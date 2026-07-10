// Dependency-free security middleware (no external packages required).
// Covers: security response headers (helmet-style), NoSQL operator
// sanitisation of request bodies/params, and a simple in-memory rate limiter.

// --- 1. Security headers -------------------------------------------------
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // This API only ever returns JSON/text, so lock scripting down hard.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  // Only meaningful over HTTPS; harmless on http during local dev.
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
}

// --- 2. NoSQL operator sanitisation -------------------------------------
// Strip any object key starting with '$' or containing '.', which is how
// Mongo query/update operators get smuggled in through JSON request bodies.
function scrub(value) {
  if (Array.isArray(value)) {
    value.forEach(scrub);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        scrub(value[key]);
      }
    }
  }
  return value;
}

function sanitizeBody(req, res, next) {
  if (req.body) scrub(req.body);
  if (req.params) scrub(req.params);
  next();
}

// --- 3. Simple in-memory rate limiter -----------------------------------
// NOTE: state lives in THIS process only. Fine for a single long-running
// Node instance (this app runs node-cron, so it is not serverless). If you
// ever scale to multiple instances, move this to a shared store (e.g. Redis).
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    let entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;

    // Opportunistic cleanup so the Map doesn't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }

    if (entry.count > max) {
      const retry = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({
        message: message || 'Too many requests. Please try again later.',
      });
    }
    return next();
  };
}

module.exports = { securityHeaders, sanitizeBody, rateLimit };
