const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * AWS configuration variables.
 */
const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_S3_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;

/**
 * Initialize an S3 client with specified configuration.
 */
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a presigned URL for getting an object from S3.
 * @param {string} key - The key of the object to retrieve.
 * @returns {Promise<string>} - The presigned URL for getting the object.
 */
const getS3ObjectURL = async (key) => {
  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 30 }); //expire in 30 seconds
  return url;
};

/**
 * Generates a presigned URL for uploading an object to S3.
 * @param {string} key - The key of the object to upload.
 * @param {string} contentType - The content type of the object to upload.
 * @returns {Promise<string>} - The presigned URL for uploading the object.
 */
const putS3ObjectURL = async (key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); //expire in 1 min
  return url;
};

/**
 * Deletes an object from S3.
 * @param {string} key - The key of the object to delete.
 * @returns {Promise<Object>} - The response from the S3 delete operation.
 */
const deleteS3Object = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  return response;
};

const consolefu = async () => {
  const url = await putS3ObjectURL("linkedIn.png", "image/png");
  console.log(url);
};

consolefu();

module.exports = {
  getS3ObjectURL,
  putS3ObjectURL,
  deleteS3Object,
};
