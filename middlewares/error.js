module.exports = (error, req, res, next) => {
  if (error.status) {
    console.log(error.message);
    const statusCode = error.status;
    const message = error.message;
    return res.status(statusCode).json({ message });
  } else {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal Server Error!",
    });
  }
};
