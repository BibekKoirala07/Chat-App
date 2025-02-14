const jwt = require("jsonwebtoken");

// Replace 'yourSecretKey' with your actual secret key
const JWT_SECRET = process.env.JWT_SECRET;
console.log("jwt_secret", JWT_SECRET);

const createJsonWebToken = (user, expiresIn = "30d") => {
  // Payload for the JWT
  const payload = {
    user,
  };

  // Options for the JWT
  const options = {
    expiresIn, // The expiration time (default: 1 hour)
  };

  // Create and return the JWT
  return jwt.sign(payload, JWT_SECRET, options);
};

module.exports = createJsonWebToken;
