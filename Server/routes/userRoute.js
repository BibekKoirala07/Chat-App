const express = require("express");

const {
  registerController,
  loginController,
  logoutController,
  checkMeController,
  getAllUsersController,
  getUserById,
} = require("../controllers/userController");
const { requireAuth } = require("../middlewares/requireAuth");

const userRoutes = express.Router();

userRoutes.get("/check-me", requireAuth, checkMeController);

userRoutes.get("/get-user/:id", requireAuth, getUserById);

userRoutes.get("/get-all-users", requireAuth, getAllUsersController);

userRoutes.post("/register", registerController);

userRoutes.post("/login", loginController);

userRoutes.get("/logout", requireAuth, logoutController);

module.exports = { userRoutes };
