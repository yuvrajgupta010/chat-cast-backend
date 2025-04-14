const { getS3ObectURL } = require("@/helpers/awsS3.js");

exports.getDownloadUrlForFile = async (req, res, next) => {
  try {
    const { s3_key } = req.body;
    const signDownloadUrl = await getS3ObectURL(s3_key);

    return res.status(200).json({
      data: { presignedURL: signDownloadUrl },
      message: "Download URL generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
