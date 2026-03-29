const store = new Map();

const now = () => Date.now();

const cleanupExpiredEntries = () => {
  const current = now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= current) {
      store.delete(key);
    }
  }
};

setInterval(cleanupExpiredEntries, 60 * 1000).unref();

export const createRateLimiter = ({
  windowMs,
  max,
  keyPrefix,
  message,
  statusCode = 429,
}) => {
  return (req, res, next) => {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const key = `${keyPrefix}:${ip}`;
    const current = now();
    let entry = store.get(key);

    if (!entry || entry.resetAt <= current) {
      entry = {
        count: 0,
        resetAt: current + windowMs,
      };
    }

    entry.count += 1;
    store.set(key, entry);

    const remaining = Math.max(0, max - entry.count);
    const retryAfterSeconds = Math.ceil((entry.resetAt - current) / 1000);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(statusCode).json({ msg: message });
    }

    next();
  };
};

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10),
  keyPrefix: "auth:login",
  message: "Too many login attempts. Please try again later.",
});

export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REGISTER_MAX || 5),
  keyPrefix: "auth:register",
  message: "Too many registration attempts. Please try again later.",
});

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX || 5),
  keyPrefix: "auth:forgot-password",
  message: "Too many password reset requests. Please try again later.",
});