import { supabaseAdmin } from './supabaseClient.js';

const BUCKET = 'media';

function cleanFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80);
}

// Uploads a raw buffer to the Supabase Storage 'media' bucket and returns its public URL.
export async function uploadImageBuffer(buffer: Buffer, fileNameHint: string, contentType: string): Promise<string> {
  const ext = (contentType.split('/')[1] || 'jpg').split(';')[0];
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanFileName(fileNameHint)}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Uploads a base64 data: URL (from an admin file picker) to Storage. Passes through plain http(s) URLs unchanged.
export async function uploadDataUrlImage(image: string, fileNameHint: string): Promise<string> {
  if (!image) return image;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;

  const matches = image.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
  if (!matches) return image;

  const [, contentType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');
  return uploadImageBuffer(buffer, fileNameHint || `img_${Date.now()}`, contentType);
}

// Downloads an external image (e.g. from a WooCommerce store) and re-uploads it into Supabase Storage.
// Falls back to the original URL if the download fails, so a migration never hard-fails on one bad image.
export async function downloadAndUploadImage(sourceUrl: string, fileNameHint: string): Promise<string> {
  if (!sourceUrl) return sourceUrl;
  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.warn(`Image download failed (${res.status}) for ${sourceUrl}, keeping original URL.`);
      return sourceUrl;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return sourceUrl;
    const buffer = Buffer.from(await res.arrayBuffer());
    return await uploadImageBuffer(buffer, fileNameHint, contentType);
  } catch (err) {
    console.warn(`Failed to migrate image ${sourceUrl}:`, err);
    return sourceUrl;
  }
}
