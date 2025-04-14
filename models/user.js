const mongoose = require("mongoose");
const {
  ACCOUNT_CREATED_BY_EMAIL,
  ACCOUNT_CREATED_BY_GOOGLE,
  ACCOUNT_CREATED_BY_FACEBOOK,
} = require("@/helpers/constant");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return this.accountAuthType === ACCOUNT_CREATED_BY_EMAIL;
        },
        "password is required if account creating with email",
      ],
    },
    accountAuthType: {
      type: String,
      required: true,
      enum: [
        ACCOUNT_CREATED_BY_EMAIL,
        ACCOUNT_CREATED_BY_GOOGLE,
        ACCOUNT_CREATED_BY_FACEBOOK,
      ],
    },
    authenticator: {
      authenticatorName: {
        type: String,
        enum: [ACCOUNT_CREATED_BY_GOOGLE, ACCOUNT_CREATED_BY_FACEBOOK],
        required: [
          function () {
            return this.accountAuthType !== ACCOUNT_CREATED_BY_EMAIL;
          },
          "Please provide authenticator name",
        ],
      },
      authenticationId: {
        type: String,
        required: [
          function () {
            return this.accountAuthType !== ACCOUNT_CREATED_BY_EMAIL;
          },
          "Please provide authentication id",
        ],
      },
    },
    isAccountVerified: {
      type: Boolean,
      default: function () {
        return this.accountAuthType === ACCOUNT_CREATED_BY_EMAIL ? false : true;
      },
      required: true,
    },
    subscription: {
      haveSubscription: {
        type: String,
        default: false,
        required: true,
      },
      data: Object,
    },
    // profile data
    profile: {
      fullName: {
        type: String,
        required: true,
      },
      about: {
        type: String,
        default: "I am using Chat Cast!",
        required: true,
      },
      profileImageURL: {
        type: String,
      },
      blockedUsers: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  },
  { timestamps: true }
);

userSchema.methods.toClient = function () {
  const obj = this.toObject({ getters: true, versionKey: false }); // Convert the document to a plain JavaScript object

  // Change _id to id
  obj.id = obj._id;
  delete obj._id;

  // Remove password if it exists
  delete obj.password;

  // Remove authenticator object if it exists
  delete obj.authenticator;

  // Remove timestamp
  delete obj.createdAt;
  delete obj.updatedAt;

  // Remove subscription.data if it exists
  if (obj?.subscription?.data) {
    delete obj.subscription.data;
  }

  // Remove profile.blockedUsers if it exists
  if (obj?.profile?.blockedUsers) {
    delete obj.profile.blockedUsers;
  }

  return obj;
};

module.exports = mongoose.model("User", userSchema);
