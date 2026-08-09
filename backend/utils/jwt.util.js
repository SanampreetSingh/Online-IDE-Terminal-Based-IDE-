const jwt = require('jsonwebtoken');
const env = require('../config/env.config');

const signToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

module.exports = {
  signToken,
  verifyToken,
};
