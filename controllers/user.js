const mongoose = require("mongoose");

const User = require("../models/user");
const { expressValidation } = require("../helpers/validation");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { putS3ObjectURL, deleteS3Object } = require("../helpers/awsS3");

exports.updateProfile = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    expressValidation(req);

    const {
      jwtPayload: { email, userId },
    } = req;

    const { update } = req.query;

    const user = await User.findOne({ email }).session(session);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    let message;
    if (update === "fullname") {
      const { fullName } = req.body;

      user.profile.fullName = fullName;
      await user.save({ session });

      message = "Full name updated successfully";
    } else if (update === "about") {
      const { about } = req.body;

      user.profile.about = about;
      await user.save({ session });

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
      await user.save({ session });

      message = "Password updated successfully";
    }

    await session.commitTransaction();

    return res.status(200).json({
      message,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.profilePicture = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    expressValidation(req);
    const { fileName, contentType } = req.body;
    const {
      jwtPayload: { email, userId },
    } = req;

    const user = await User.findOne({ email }).session(session);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const awsObjectPath = `uploads/profile_picture/${userId}_${Math.random()}_${fileName}`;

    const putUrlForObjectUpload = await putS3ObjectURL(
      awsObjectPath,
      contentType,
      true
    );

    if (user?.profile?.profileImageURL) {
      await deleteS3Object(user?.profile?.profileImageURL, true);
    }

    user.profile.profileImageURL = awsObjectPath;
    await user.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      data: {
        profileImageURL: awsObjectPath,
        presignedURL: putUrlForObjectUpload,
      },
      message: "URL generated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.searchUser = async (req, res, next) => {
  const { search = "" } = req.query;
  if (!search.trim().length) {
    return res.status(200).json({});
  }
  const senitizedSearchQuery = search.trim();
  try {
    const {
      jwtPayload: { email, userId },
    } = req;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const userBlacklist = user.profile.blockedUsers;

    const users = await User.find({
      $and: [
        {
          $or: [
            {
              "profile.fullName": {
                $regex: senitizedSearchQuery,
                $options: "i",
              },
            },
            { email: { $regex: senitizedSearchQuery, $options: "i" } },
          ],
        },
        {
          _id: { $nin: [...userBlacklist, userId] },
        },
        {
          blockedUsers: { $nin: [userId] },
        },
        {
          isAccountVerified: true,
        },
      ],
    })
      .select({
        _id: 1,
        email: 1,
        "profile.fullName": 1,
        "profile.profileImageURL": 1,
        "profile.about": 1,
      })
      .limit(20);

    return res.status(200).json({
      data: users,
      message: "Users found successfully",
    });
  } catch (error) {
    next(error);
  }
};
