function requestLogger(req, res, next) {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;
    const ip = req.ip;

    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms) - ${ip}`);

    return originalSend.call(this, data);
  };

  next();
}

module.exports = requestLogger;
