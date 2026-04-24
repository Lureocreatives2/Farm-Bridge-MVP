// middleware/rateLimit.js
// Simple in-memory rate limiter.
// For production with multiple instances, swap the Map for Redis.

const store = new Map(); // ip → { count, resetAt }

function rateLimit({ windowMs = 60_000, max = 30, message = "Too many requests, slow down." } = {}) {
  return (req, res, next) => {
    const ip  = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();
    const rec = store.get(ip);

    if (!rec || now > rec.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    rec.count++;
    if (rec.count > max) {
      res.set("Retry-After", Math.ceil((rec.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: message });
    }

    next();
  };
}

// Aggressive limit for write operations (POST)
const writeLimiter = rateLimit({ windowMs: 60_000, max: 10, message: "Too many listings. Please wait a minute." });

// Relaxed limit for reads
const readLimiter  = rateLimit({ windowMs: 60_000, max: 60 });

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of store.entries()) {
    if (now > rec.resetAt) store.delete(ip);
  }
}, 300_000);

module.exports = { rateLimit, writeLimiter, readLimiter };
