export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // Allow images from our uploads folder
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; frame-ancestors 'none';");

  const isSecureRequest =
    req.secure || req.headers["x-forwarded-proto"] === "https";

  if (isSecureRequest) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
};