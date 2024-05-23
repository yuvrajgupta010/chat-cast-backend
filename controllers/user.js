const User = require("../models/user");
const { expressValidation } = require("../helpers/validation");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { putS3ObjectURL } = require("../helpers/awsS3");

exports.updateProfile = async (req, res, next) => {
  try {
    expressValidation(req);

    const {
      jwtPayload: { email, userId },
    } = req;

    const { update } = req.query;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    let message;
    if (update === "fullname") {
      const { fullName } = req.body;

      user.profile.fullName = fullName;
      await user.save();

      message = "Full name updated successfully";
    } else if (update === "about") {
      const { about } = req.body;

      user.profile.about = about;
      await user.save();

      message = "About updated successfully";
    } else if (update === "password") {
      const { currentPassword } = req.body;

      const passwordResult = await comparePassword(
        currentPassword,
        user.password
      );

      if (!passwordResult) {
        const error = new Error("Password is incorrect");
        error.status = 400;
        throw error;
      }

      const { newPassword } = req.body;

      const newPasswordHash = await hashPassword(newPassword);

      user.password = newPasswordHash;
      await user.save();

      message = "Password updated successfully";
    }
    return res.status(200).json({
      message,
    });
  } catch (error) {
    next(error);
  }
};

exports.profilePicture = async (req, res, next) => {
  try {
    expressValidation(req);
    const { fileName, contentType } = req.body;
    const {
      jwtPayload: { email, userId },
    } = req;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const awsObjectPath = `uploads/profile_picture/${userId}_${fileName}`;

    const putUrlForObjectUpload = await putS3ObjectURL(
      awsObjectPath,
      contentType,
      true
    );

    user.profile.profileImageURL = awsObjectPath;
    await user.save();

    return res.status(200).json({
      data: {
        user: user.toClient(),
        presignedURL: putUrlForObjectUpload,
      },
      message: "URL generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
