module.exports = function getDebugInfo(req, res) {
  return {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query,
    method: req.method,
    path: req.path,
    ip: req.ip,
    env: process.env.NODE_ENV,
  };
};