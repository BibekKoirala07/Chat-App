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
    const user = await UserModel.registerStatics(username, email, password);

    const { password: hashedPassword, ...data } = user._doc;
    const token = createJsonWebToken(data);
    const expiryDate = new Date(Date.now() + 3600000);

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
        data,
        message: "Registered Successfully!",
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
    const token = createJsonWebToken(data);

    res.cookie("chat-app-token", token, {
      httpOnly: true,
      secure: false,
      expires: expiryDate,
    });

    setTimeout(() => {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        data,
        message: "Logged In Successfully",
      });
    }, 2000);
  } catch (error) {
    setTimeout(() => {
      console.log("error:", error);
      next(error);
    }, 2000);
  }
};

const logoutController = async (req, res) => {
  console.log("logout done");
  res.clearCookie("token");
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  getAllUsersController,
  getUserById,
  checkMeController,
  registerController,
  loginController,
  logoutController,
};
