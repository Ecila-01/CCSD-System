// Insert Cloudinary delivery transformations into an existing secure_url so the
// CDN returns a small, format-optimized image instead of the full-resolution
// original. Non-Cloudinary values (relative paths, blob: previews, gravatar,
// empty) are returned unchanged, so this is always safe to wrap around a src.
//
// Why this exists: team/hero photos are stored as raw multi-megapixel uploads
// (e.g. 4284x5712) but displayed at ~44px. Without a transformation the browser
// downloads and decodes the full original, which is slow and makes off-screen
// images flicker (blank -> reappear) when scrolled back into view because the
// decoded bitmap gets evicted and must be re-decoded.
export function cldThumb(url, { w = 200, h, crop = 'fill', gravity = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || at === -1) return url;
  // Don't double-transform if a transformation is already present.
  const rest = url.slice(at + marker.length);
  if (/^(c_|w_|h_|f_|q_|g_|dpr_|e_)/.test(rest)) return url;
  const t = [`c_${crop}`, `w_${w}`];
  if (h) t.push(`h_${h}`);
  if (crop === 'fill' || crop === 'thumb') t.push(`g_${gravity}`);
  t.push('f_auto', 'q_auto');
  return url.slice(0, at + marker.length) + t.join(',') + '/' + rest;
}
