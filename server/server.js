require("dotenv").config();

// Importing DB connect
const connectDB = require("./db/connectDB");

// importing routes
const { userRoutes } = require("./routes/userRoute");

const { Server } = require("socket.io");

// setInterval(() => {
//   console.log("memeoy usage: ", process.memoryUsage());
// }, 20000);

// Express App
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const http = require("http");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV == "production"
        ? process.env.PROD_FRONTEND_URL
        : process.env.DEV_FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const cors = require("cors");

const cookieParser = require("cookie-parser");
const socketEvents = require("./socket/socketEvents");

// middleware
app.use(cookieParser({}));
app.use(express.json({ limit: "10kb" })); // it is necessary to set it to prevent DOS attacks
app.use(
  cors({
    origin:
      process.env.NODE_ENV == "production"
        ? process.env.PROD_FRONTEND_URL
        : process.env.DEV_FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Routes
// app.use("/api/auth", userRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/groups", groupRoutes);

socketEvents(io);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const URI = process.env.PROD_MONGO_URI;
connectDB(URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Example app listening on port ${PORT}!`)
    );
  })
  .catch((error) => {
    console.log("Error while connecting to database", error);
  });
