export function errorMiddleware(err, req, res, next) {
  console.error("Request error:", err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.message === "Unsupported image format") {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.response?.status === 429) {
    return res.status(503).json({
      message: "AI service rate limit exceeded",
    });
  }

  return res.status(500).json({
    message: "Prescription analysis failed",
  });
}
