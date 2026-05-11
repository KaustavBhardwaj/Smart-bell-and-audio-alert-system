const { API_KEY } = require("../config/env");

function apiKeyAuth(req, res, next) {
  if (!API_KEY) return next();

  const key = req.headers["x-api-key"];

  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized API request" });
  }

  next();
}

module.exports = apiKeyAuth;