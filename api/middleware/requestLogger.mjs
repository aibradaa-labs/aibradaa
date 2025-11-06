/**
 * Request Logger Middleware
 * Logs all incoming requests for monitoring
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`→ ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
};
