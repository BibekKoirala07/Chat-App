const UserModel = require("../models/userModel");
const createJsonWebToken = require("../utils/createJsonWebToken");

const MessageModel = require("../models/messageModel");

const getAllUsersController = async (req, res, next) => {
  try {
    const currentUserId = req.user.user._id;

    console.log("currentUserId", currentUserId);

    const users = await UserModel.find({
      _id: { $ne: currentUserId },
    });

    const usersWithLatestMessage = await Promise.all(
      users.map(async (user) => {
        try {
          const latestMessage = await MessageModel.findOne({
            $or: [
              { senderId: currentUserId, receiverId: user._id },
              { receiverId: currentUserId, senderId: user._id },
            ],
          }).sort({ createdAt: -1 });

          return {
            ...user.toObject(),
            latestMessage: latestMessage || null,
          };
        } catch (error) {
          console.error(
            `Error fetching latest message for user ${user._id}:`,
            error
          );
          return {
            ...user.toObject(),
            latestMessage: null,
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      message: "All users fetched with latest messages",
      data: usersWithLatestMessage,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("No param provided");
    }
    const user = await UserModel.findOne({ _id: id });
    return res
      .status(200)
      .json({ success: true, message: "This is your user", data: user });
  } catch (error) {
    next(error);
  }
};

const checkMeController = async (req, res, next) => {
  try {
    console.log("req.user", req.user);
    const user = await UserModel.findOne({ email: req.user.user.email });
    return res
      .status(200)
      .json({ success: true, message: "This is your account", data: user });
  } catch (error) {
    next(error);
  }
};

const registerController = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists and isn't verified
    const existingUserIsNotVerified = await UserModel.findOne({
      email,
      isVerified: false,
    });
    if (existingUserIsNotVerified) {
      const token = createJsonWebToken(existingUserIsNotVerified);
      const { password: hashedPassword, ...data } =
        existingUserIsNotVerified._doc;
      const expiryDate = new Date(Date.now() + 3600000);

      await sendVerificationEmail(
        email,
        existingUserIsNotVerified.verificationToken
      );

      return res
        .cookie("chat-app-token", token, {
          secure: false,
          expires: expiryDate,
          httpOnly: true,
        })
        .status(200)
        .json({
          statusCode: 200,
          success: true,
          token: token,
          data,
          message: "Confirmation Email Sent",
        });
    }
    const user = await UserModel.registerStatics(username, email, password);

    const token = createJsonWebToken(user);

    const { password: hashedPassword, ...data } = user._doc;
    const expiryDate = new Date(Date.now() + 3600000);

    // await sendVerificationEmail(email, user.verificationToken); // it doesn't work in prouduction

    return res
      .cookie("chat-app-token", token, {
        secure: true, // if the proudction is running in https
        expires: expiryDate,
        httpOnly: true,
      })
      .status(200)
      .json({
        statusCode: 200,
        success: true,
        token,
        data,
        message: "Confirmation Email Sent",
      });
  } catch (error) {
    console.log("error:", error);
    next(error);
  }
};

const loginController = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.loginStatics(email, password);
    const { password: hashedPassword, ...data } = user._doc;
    const expiryDate = new Date(Date.now() + 3600000);
    if (user.isVerified) {
      const token = createJsonWebToken(user);

      res.cookie("chat-app-token", token, {
        httpOnly: true,
        secure: true,

        expires: expiryDate,
      });

      return res.status(200).json({
        statusCode: 200,
        success: true,
        data,
        token,
        message: "Logged In Successfully",
      });
    } else {
      return res.status(200).json({
        success: false,
        statusCode: 200,
        message: "You are not verified. Register again",
      });
    }
  } catch (error) {
    console.log("error:", error);
    next(error);
  }
};

const verifyEmailController = async (req, res, next) => {
  const { token } = req.params;
  console.log("req.user", req.user);
  console.log("token");

  try {
    // Find the user with the given verification token
    const user = await UserModel.findOne({
      verificationToken: token,
      verificationTokenExpiresAt: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return sendErrorResponse(res, new Error("Invalid or expired token"), 400);
    }

    // Update user's verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    const expiryDate = new Date(Date.now() + 360000); // 1 hour

    const jsonToken = createJsonWebToken(user);

    // Send a success response
    return res
      .cookie("chat-app-token", jsonToken, {
        secure: false,
        expires: expiryDate,
        httpOnly: true,
      })
      .status(200)
      .json({
        statusCode: 200,
        success: true,
        data: user,
        message: "Email verified successfully",
      });
  } catch (error) {
    next(error);
  }
};

const logoutController = async (req, res) => {
  console.log("logout done");
  res.clearCookie("chat-app-token");
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = await crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    console.log("token", resetToken);

    await sendResetPasswordEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log("Error in forgotPassword ", error);
    res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword != confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // update password
    const hashedPassword = await bcrypt.hash(confirmPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    // await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkMeController,
  registerController,
  loginController,
  verifyEmailController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  getUserById,
  getAllUsersController,
};
