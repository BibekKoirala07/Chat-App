const express = require("express");

const {
  registerController,
  loginController,
  logoutController,
  checkMeController,
  getAllUsersController,
  getUserById,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
} = require("../controllers/userController");
const { requireAuth } = require("../middlewares/requireAuth");

const userRoutes = express.Router();

userRoutes.get("/check-me", requireAuth, checkMeController);

userRoutes.get("/get-user/:id", requireAuth, getUserById);

userRoutes.get("/get-all-users", requireAuth, getAllUsersController);

userRoutes.post("/register", registerController);

userRoutes.post("/login", loginController);

userRoutes.get("/logout", requireAuth, logoutController);

userRoutes.get("/verify-email/:token", verifyEmailController);

userRoutes.post("/forgot-password", forgotPasswordController);

userRoutes.post("/reset-password/:token", resetPasswordController);

module.exports = { userRoutes };
