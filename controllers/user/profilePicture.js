const mongoose = require("mongoose");

const User = require("@/models/user");
const { expressValidation } = require("@/helpers/validation");
const { putS3ObjectURL, deleteS3Object } = require("@/helpers/awsS3");

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
