import rateLimit from 'express-rate-limit';

/**
 * High-Performance API Gateway Rate Limiter.
 * Restricts rapid, repetitive requests from a single client signature to preserve upstream cloud computing costs.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window time-frame
  max: 5, // Maximum allowance of 5 distinct connection handshakes per minute per client
  standardHeaders: true, // Automatically sends back 'RateLimit-Limit' and 'RateLimit-Remaining' metadata in response headers
  legacyHeaders: false, // Disables X-RateLimit-* old legacy fallback headers
  
  // Custom response structure executed when a client crosses the threshold limit
  handler: (req, res) => {
    console.warn(`[Rate-Limit Violation]: IP Address ${req.ip} exceeded allowed traffic thresholds.`);
    res.status(429).json({
      error: 'Too many requests. You are being throttled.',
      retryAfterMinutes: 1,
      message: 'To protect system capacity, developers are restricted to 5 AI requests per minute.'
    });
  }
});