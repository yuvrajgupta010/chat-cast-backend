const { expressValidation } = require("@/helpers/validation");
const { putS3ObjectURL } = require("@/helpers/awsS3.js");

exports.getUploadUrlForFile = async (req, res, next) => {
  try {
    expressValidation(req);
    const { fileName, contentType } = req.body;
    const {
      jwtPayload: { email, userId },
    } = req;

    const uploadKey = `upload/${userId}_${Math.random()}_${fileName}`;

    const signUrlForUpload = await putS3ObjectURL(uploadKey, contentType);

    return res.status(200).json({
      data: { presignedURL: signUrlForUpload, uploadPath: uploadKey },
      message: "Url generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
