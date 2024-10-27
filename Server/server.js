require("dotenv").config();

const connectDB = require("./db/connectDB");

const { Server } = require("socket.io");

const express = require("express");
const app = express();
const PORT = 3000;

const corsOrigin =
  process.env.NODE_ENV == "production"
    ? process.env.PROD_FRONTEND_URL
    : process.env.DEV_FRONTEND_URL;

const http = require("http");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// helmet
const helmet = require("helmet");
// this returs a function and we would like to use it for our middleware
// it sets the header to our request
// it is better to use helmet at the top of middleware so that security headers
// become set at the start of the response
app.use(helmet()); // add security
// check in postman, without helment we would normally have 7-10 headers while with helment
// we would have 15-20 header added such as Cross Origin Resource policy, Referrer policy etc

// rate limit
// rate limti is a function . when we call that function it is going to return another function
// that is going to be middleware function
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      error: "Too many requests. Please try again later.",
    });
  },
});

// this enable hackers to not know about the technology we are using
app.disable("x-powered-by"); // less hackers know about our stack

const cors = require("cors");

// Cookie-Parser
const cookieParser = require("cookie-parser");
const messageRoutes = require("./routes/messageRoute");
const groupRoutes = require("./routes/groupRoute");
const socketEvents = require("./socket/socketEvents");
const { userRoutes } = require("./routes/userRoute");

// middleware
app.use(cookieParser());
app.use(express.json({ limit: "10kb" })); // it is necessary to set it to prevent DOS attacks
app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use("/api", limiter); // works on all api routes that starts with /api
// it helps in preventing Brute force attacks and denail of Service

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

socketEvents(io);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const URI =
  process.env.NODE_ENV == "production"
    ? process.env.PROD_MONGO_URI
    : process.env.DEV_MONGO_URI;
connectDB(URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Example app listening on port ${PORT}!`)
    );
  })
  .catch((error) => {
    console.log("Error while connecting to database", error);
  });
