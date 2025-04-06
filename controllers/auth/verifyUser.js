exports.verifyUser = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: "OK!",
    });
  } catch (error) {
    next(error);
  }
};
