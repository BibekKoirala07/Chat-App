const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  // getting token from client
  const headerToken = req.headers.authorization.split(" ")[1];
  const token = req.cookies["chat-app-token"] || headerToken;

  console.log("token in require Auth", token, headerToken);

  // check whether we got the token or not
  if (!token) {
    console.log("no token");
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "No token provided",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log("error", err, decoded);
    if (err) {
      console.log("there was error");
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: "Token verification failed",
      });
    }

    // appending everything to req.user to check further, the decoded mostly           have _id as we have put that in jwt.sign() when we sent that to user. we         get that _id, as we want to update the specific user profile or delete, we       send the id in params and we check that id with jwt decoded id
    req.user = decoded;
    next();
  });
};

module.exports = {
  requireAuth,
};
