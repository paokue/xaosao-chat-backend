const { default: rateLimit } = require("express-rate-limit");

// middleware/originCheck.js
const allowedWebOrigins = [
  "https://web.whoxachat.com",
  "https://admin.whoxachat.com",
];

const originCheck = (req, res, next) => {
  const origin = req.headers.origin;
  const userAgent = req.headers["user-agent"];

  const isFlutter = userAgent && userAgent.includes("Dart");
  const isAllowedOrigin = allowedWebOrigins.includes(origin);

  if (isAllowedOrigin || isFlutter) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden request source" });
};

const phoneRegisterLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 5 requests per window
  message: { error: "Too many requests. Please try again later." },
});

module.exports = { originCheck, phoneRegisterLimiter };
