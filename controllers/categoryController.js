const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.category_list = asyncHandler(async (req, res, next) => {
  res.send("Category list not currently supported");
});

exports.single_category = asyncHandler(async (req, res, next) => {
  res.send("Single category not currently supported");
});

exports.category_create_get = asyncHandler(async (req, res, next) => {
  res.send("GET category create not currently supported");
});

exports.category_create_post = asyncHandler(async (req, res, next) => {
  res.send("POST category create not currently supported");
});

exports.category_delete_get = asyncHandler(async (req, res, next) => {
  res.send("GET category delete not currently supported");
});

exports.category_delete_post = asyncHandler(async (req, res, next) => {
  res.send("POST category create not currently supported");
});

exports.category_update_get = asyncHandler(async (req, res, next) => {
  res.send("GET category update not currently supported");
});

exports.category_update_post = asyncHandler(async (req, res, next) => {
  res.send("POST category update not currently supported");
});
