// index.html shows a branded loading screen before any JavaScript runs. The storefront hides it once
// settings and the catalogue have loaded; the admin hides it as soon as it mounts.
export function hideBootLoader() {
  const loader = document.getElementById('boot-loader');
  if (!loader || loader.classList.contains('bl-hide')) return;
  loader.classList.add('bl-hide');
  setTimeout(() => loader.remove(), 400);
}
