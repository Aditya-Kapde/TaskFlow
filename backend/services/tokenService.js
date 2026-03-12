const jwt = require("jsonwebtoken");

const tokenService = {
  // ─── Generate Access Token ──────────────────────────────────
  // Short-lived (15 min) — used in Authorization header for every API request
  generateAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN, // "15m"
    });
  },

  // ─── Generate Refresh Token ─────────────────────────────────
  // Long-lived (7 days) — only used to get a new access token
  // Stored in httpOnly cookie so JavaScript cannot read it (XSS protection)
  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN, // "7d"
    });
  },

  // ─── Verify Access Token ────────────────────────────────────
  // Returns decoded payload if valid, throws an error if expired or tampered
  verifyAccessToken(token) {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  },

  // ─── Verify Refresh Token ───────────────────────────────────
  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  },

  // ─── Attach Refresh Token as httpOnly Cookie ─────────────────
  // httpOnly: JS cannot access this cookie — prevents XSS token theft
  // secure: only sent over HTTPS in production
  // sameSite: "strict" prevents CSRF attacks
  setRefreshTokenCookie(res, token) {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  },

  // ─── Clear Refresh Token Cookie ─────────────────────────────
  // Called on logout — removes the cookie from the browser
  clearRefreshTokenCookie(res) {
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
    });
  },
};

module.exports = tokenService;