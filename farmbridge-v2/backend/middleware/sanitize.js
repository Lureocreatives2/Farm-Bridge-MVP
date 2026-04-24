// middleware/sanitize.js
// Strips dangerous HTML/script characters from all incoming string fields.
// Runs before route handlers so data stored in DB is always clean.

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      obj[key] = escapeHtml(obj[key].trim());
    } else if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

const sanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  next();
};

module.exports = sanitize;
