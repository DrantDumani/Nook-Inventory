// const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");

exports.validateItem = () => {
  return [
    body("name", "Name must not be empty").trim().isLength({ min: 1 }),
    body("description", "Summary must not be blank")
      .trim()
      .isLength({ min: 1 }),
    body("category", "Pick at least one category").isArray({ min: 1 }),
    body("stock", "Stock cannot be empty")
      .isInt({ min: 0 })
      .withMessage("Stock must be whole number greater than -1"),
    body("price", "Price must not be empty")
      .isInt({ min: 1 })
      .withMessage("Price must be whole number greater than 0"),
  ];
};

exports.validateCategory = () => {
  return [
    body("name", "Name must not be empty").trim().isLength({ min: 1 }),
    body("description", "Description cannot be empty")
      .trim()
      .isLength({ min: 1 }),
  ];
};

exports.validatePw = () => {
  return body("password", "Password is incorrect")
    .trim()
    .equals("KKJongaraBestSong");
};
