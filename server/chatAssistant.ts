import Anthropic from '@anthropic-ai/sdk';
import type { Request, Response } from 'express';
import { dbStore } from './store.js';
import { BRANCHES } from '../src/data.js';
import { formatMoney } from '../src/siteSettings.js';
import { groupOf, isMenuGroupEnabled } from '../src/menuGroups.js';
import { checkoutDisabledCategoryNames, isProductCheckoutDisabled } from '../src/categoryCheckout.js';
import type { GeneralSettings, Product } from '../src/types.js';

const MODEL = 'claude-opus-5-5';
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1500;
const RATE_LIMIT = { requests: 20, windowMs: 10 * 60 * 1000 };
const CONTEXT_TTL_MS = 60 * 1000;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

// Per-visitor rate limit so the public endpoint can't be used to run up the API bill. In-memory,
// so on serverless hosting it is per instance - a soft guard, not a hard quota.
const recentRequests = new Map<string, number[]>();
const isRateLimited = (visitor: string) => {
  const now = Date.now();
  const recent = (recentRequests.get(visitor) || []).filter(time => now - time < RATE_LIMIT.windowMs);
  recent.push(now);
  recentRequests.set(visitor, recent);
  if (recentRequests.size > 5000) recentRequests.clear();
  return recent.length > RATE_LIMIT.requests;
};

const plainText = (html: string, maxLength: number) => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
};

const describeProduct = (product: Product, settings: GeneralSettings, checkoutDisabled: boolean) => {
  const price = checkoutDisabled
    ? 'price updating soon (cannot be ordered yet)'
    : product.priceMax && product.priceMax > product.priceMin
      ? `${formatMoney(product.priceMin, settings)} – ${formatMoney(product.priceMax, settings)}`
      : formatMoney(product.priceMin, settings);
  const notes = [
    product.stockStatus === 'out_of_stock' ? 'currently out of stock' : '',
    product.isCustomizable ? 'customisable' : '',
    product.cakeTypes?.length ? `flavours: ${product.cakeTypes.join(', ')}` : '',
    product.weights?.length ? `sizes: ${product.weights.join(', ')}` : '',
    product.variants?.length
      ? `options: ${product.variants.slice(0, 8).map(variant => `${variant.attributes.map(attribute => attribute.option).join(' / ') || 'standard'}${checkoutDisabled ? '' : ` ${formatMoney(variant.price, settings)}`}`).join(', ')}`
      : '',
    product.tags?.length ? `tags: ${product.tags.join(', ')}` : '',
  ].filter(Boolean).join('; ');
  const description = plainText(product.shortDescription || product.description || '', 220);
  return `- [${product.id}] ${product.name} — ${price}${notes ? ` (${notes})` : ''}${description ? `. ${description}` : ''}`;
};

// The store facts the assistant answers from. Built from live data and kept byte-stable between
// requests (sorted, no timestamps) so the prompt cache can reuse it.
async function buildStoreContext(): Promise<{ text: string; settings: GeneralSettings }> {
  const [settings, products, categories] = await Promise.all([dbStore.getGeneralSettings(), dbStore.getProducts(), dbStore.getCategories()]);
  const checkoutOff = checkoutDisabledCategoryNames(categories);
  const visible = products
    .filter(product => isMenuGroupEnabled(groupOf(product), settings.store))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const menuByCategory = new Map<string, string[]>();
  for (const product of visible) {
    const lines = menuByCategory.get(product.category) || [];
    lines.push(describeProduct(product, settings, isProductCheckoutDisabled(product, checkoutOff)));
    menuByCategory.set(product.category, lines);
  }
  const menu = [...menuByCategory.entries()].map(([category, lines]) => `### ${category}\n${lines.join('\n')}`).join('\n\n');

  const { business, delivery, foodOrdering, payments, store } = settings;
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const paymentMethods = [
    payments.cashOnDeliveryEnabled && 'cash on delivery',
    payments.bankTransferEnabled && 'bank transfer',
    payments.payHereEnabled && 'PayHere (cards)',
    payments.dialogGenieEnabled && 'Dialog Genie',
    payments.stripeEnabled && 'card (Stripe)',
  ].filter(Boolean).join(', ');

  const text = `# Store information

Business: ${business.name}
Main address: ${business.address}
Phone: ${business.primaryPhone}${business.secondaryPhone ? `, ${business.secondaryPhone}` : ''}
WhatsApp: ${business.whatsappNumber || 'not available'}
Email: ${business.supportEmail}
Opening hours: ${business.openingHours}

## Branches
${BRANCHES.map(branch => `- ${branch.name}: ${branch.address}, phone ${branch.phone}`).join('\n')}

## Ordering
Customers order on this website: add items to the cart, then check out. Orders can't be placed in this chat.
Store pickup: ${delivery.storePickupEnabled ? 'available' : 'not available'}
Delivery: ${delivery.enabled
    ? `available, usually ${delivery.estimatedTime}; standard fee ${formatMoney(delivery.defaultFee, settings)}${delivery.freeDeliveryMinimum > 0 ? `, free over ${formatMoney(delivery.freeDeliveryMinimum, settings)}` : ''}${delivery.areas.length ? `; areas: ${delivery.areas.map(area => `${area.name} (${formatMoney(area.charge, settings)})`).join(', ')}` : ''}`
    : 'not available online at the moment'}
${store.minimumOrderAmount > 0 ? `Minimum order: ${formatMoney(store.minimumOrderAmount, settings)}\n` : ''}Payment methods: ${paymentMethods || 'confirmed at checkout'}
Hot food (kitchen) orders: ${!foodOrdering.enabled ? 'not available online' : foodOrdering.temporarilyClosed ? `temporarily closed — ${foodOrdering.closedMessage}` : `${foodOrdering.openingDays.length === 7 ? 'every day' : foodOrdering.openingDays.map(day => weekdays[day]).join(', ')}, ${foodOrdering.openTime}–${foodOrdering.closeTime} (last order ${foodOrdering.lastOrderTime}); ${[foodOrdering.allowAsap && 'ASAP', foodOrdering.allowScheduled && 'scheduled'].filter(Boolean).join(' and ')} orders`}

## Menu
Each item is "[id] name — price (notes). description".

${menu || 'The menu is being updated.'}`;

  return { text, settings };
}

let cachedContext: { value: { text: string; settings: GeneralSettings }; at: number } | null = null;
const getStoreContext = async () => {
  if (!cachedContext || Date.now() - cachedContext.at > CONTEXT_TTL_MS) cachedContext = { value: await buildStoreContext(), at: Date.now() };
  return cachedContext.value;
};

const instructions = (settings: GeneralSettings) => `You are ${settings.assistant.name || 'the assistant'}, the website chat assistant for ${settings.business.name}, a bakery in Sri Lanka. You talk with customers browsing the online shop.

Help them find products, compare options and prices, and learn how ordering, delivery, pickup, branches and opening hours work. Answer only from the store information below. When something isn't covered there - ingredients or allergens that aren't listed, today's stock, custom cake quotes, order problems - say you don't know and give the phone number or WhatsApp. Never make up products, prices, discounts or policies. Items marked "price updating soon" can't be ordered yet.

Keep replies short and warm: a few sentences, or a short list using "-" bullets. Write plain text without markdown headings, tables, bold or links. Reply in the language the customer writes in (English, Tamil or Sinhala). If asked about something unrelated to the bakery, briefly bring the conversation back to how you can help.

When you recommend specific menu items, end your reply with one line per item in the form [[product:ID]], using the id in square brackets from the menu (at most 3). The website turns these lines into product cards, so don't mention the ids anywhere else.`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const parseHistory = (raw: unknown): ChatTurn[] | null => {
  if (!Array.isArray(raw)) return null;
  const turns = raw
    .filter((turn): turn is ChatTurn => !!turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string' && turn.content.trim() !== '')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(turn => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_CHARS) }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns.length && turns[turns.length - 1].role === 'user' ? turns : null;
};

const UNAVAILABLE = 'Sorry, I can’t answer right now. Please call us or message us on WhatsApp and we’ll be happy to help.';

export async function handleChat(req: Request, res: Response) {
  const history = parseHistory(req.body?.messages);
  if (!history) return res.status(400).json({ error: 'Send at least one customer message.' });

  const visitor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(visitor)) return res.status(429).json({ error: 'You’re sending messages quickly - please wait a few minutes and try again.' });

  const { text: storeContext, settings } = await getStoreContext();
  if (!settings.assistant.enabled) return res.status(403).json({ error: 'The chat assistant is switched off.' });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error('Chat assistant: ANTHROPIC_API_KEY is not set.');
    return res.status(503).json({ error: UNAVAILABLE });
  }

  const now = new Intl.DateTimeFormat('en-GB', { timeZone: settings.system.timezone || 'Asia/Colombo', dateStyle: 'full', timeStyle: 'short' }).format(new Date());

  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 2048, // replies are meant to be a few sentences; this also caps cost per message
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // if Claude declines, the API retries on Anthropic's recommended fallback model
    system: [
      { type: 'text', text: instructions(settings) },
      { type: 'text', text: storeContext, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      ...history,
      // Changes every request, so it goes after the cached prefix rather than into the system prompt.
      { role: 'system', content: `Current date and time at the bakery: ${now}.` },
    ],
  });
  res.on('close', () => { if (!res.writableEnded) stream.abort(); });

  let started = false;
  const write = (chunk: string) => {
    if (!started) {
      started = true;
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
    }
    res.write(chunk);
  };

  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') write(event.delta.text);
    }
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') write(started ? `\n\n${UNAVAILABLE}` : UNAVAILABLE);
    else if (!started) write(UNAVAILABLE);
    res.end();
  } catch (error) {
    if (stream.aborted) return;
    if (error instanceof Anthropic.RateLimitError) console.warn('Chat assistant rate limited by the Claude API.');
    else if (error instanceof Anthropic.AuthenticationError) console.error('Chat assistant: the Anthropic API key was rejected.');
    else if (error instanceof Anthropic.APIError) console.error(`Chat assistant API error ${error.status}:`, error.message);
    else console.error('Chat assistant error:', error);
    if (started) res.end(`\n\n${UNAVAILABLE}`);
    else res.status(error instanceof Anthropic.RateLimitError ? 429 : 502).json({ error: UNAVAILABLE });
  }
}
