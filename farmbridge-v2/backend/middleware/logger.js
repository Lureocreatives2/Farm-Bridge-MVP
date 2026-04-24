// middleware/logger.js
// Lightweight request logger — no external dependency needed

const logger = (req, res, next) => {
  const start = Date.now();
  const { method, url } = req;

  res.on("finish", () => {
    const ms  = Date.now() - start;
    const s   = res.statusCode;
    const col = s >= 500 ? "\x1b[31m" : s >= 400 ? "\x1b[33m" : "\x1b[32m";
    const rst = "\x1b[0m";
    console.log(`${col}${method} ${url} → ${s}${rst} (${ms}ms)`);
  });

  next();
};

module.exports = logger;
