// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`);

  if (err.message?.includes("Only JPEG"))
    return res.status(400).json({ success: false, error: err.message });

  if (err.code === "P2002")
    return res.status(409).json({ success: false, error: `Duplicate: ${err.meta?.target}` });

  if (err.code === "P2025")
    return res.status(404).json({ success: false, error: "Record not found" });

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Server error" : err.message,
  });
};

module.exports = errorHandler;
