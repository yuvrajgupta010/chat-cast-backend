const express = require("express");
const { body, query } = require("express-validator");

const User = require("../models/user");
const userController = require("../controllers/user");
const { passportJWT } = require("../middlewares/passport");

const router = express.Router();

router.put(
  "/profile",
  passportJWT,
  [
    query("update", "Please provide 'update' query parameter")
      .trim()
      .notEmpty()
      .toLowerCase()
      .isIn(["fullname", "about", "password"])
      .withMessage(
        'Type must be either "fullName", "about" or "password" in query param'
      ),
    body("fullName")
      .if((value, { req }) => req.query.update === "fullname")
      .trim()
      .notEmpty()
      .withMessage("Please enter your full name"),
    body("about")
      .if((value, { req }) => req.query.update === "about")
      .trim()
      .notEmpty()
      .withMessage("Please enter something about youself"),
    body("currentPassword")
      .if((value, { req }) => req.query.update === "password")
      .trim()
      .notEmpty()
      .withMessage("Please enter current password")
      .isLength({ min: 8 })
      .withMessage("Invaild password!"),
    body("newPassword")
      .if((value, { req }) => req.query.update === "password")
      .trim()
      .notEmpty()
      .withMessage("Please enter new password")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters longer"),
    body("confirmPassword")
      .if((value, { req }) => req.query.update === "password")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Confirm Password does not match new password");
        }
        return true;
      }),
  ],
  userController.updateProfile
);

module.exports = router;
