const { body, validationResult } = require("express-validator");
const Event = require("../models/Event");

const eventRules = [
  body("title").trim().isLength({ min: 5, max: 80 }).withMessage("Title must be 5–80 characters."),
  body("description")
    .trim()
    .isLength({ min: 15, max: 2000 })
    .withMessage("Description must be 15–2000 characters."),
  body("location")
    .trim()
    .isLength({ min: 3, max: 80 })
    .withMessage("Location must be 3–80 characters."),
  body("date").isISO8601().withMessage("Please choose a valid date and time.").toDate(),
  body("category").isIn(Event.CATEGORIES).withMessage("Please choose a category."),
  body("capacity")
    .optional({ values: "falsy" })
    .isInt({ min: 0, max: 100000 })
    .withMessage("Capacity must be a whole number (0 for unlimited).")
    .toInt(),
];

const signupRules = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters."),
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email address."),
  body("password").isLength({ min: 8, max: 72 }).withMessage("Password must be at least 8 characters."),
  body("confirm_password")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match."),
];

const profileRules = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters."),
];

// Returns the list of messages, or null when the request is valid.
const validationErrors = (req) => {
  const result = validationResult(req);
  return result.isEmpty() ? null : result.array().map((e) => e.msg);
};

module.exports = { eventRules, signupRules, profileRules, validationErrors };
