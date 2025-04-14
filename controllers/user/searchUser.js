const User = require("@/models/user");

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
