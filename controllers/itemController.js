const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.index = asyncHandler(async (req, res, next) => {
  res.send("Index not supported yet");
});

exports.item_list = asyncHandler((req, res, next) => {
  res.send("Item list not supported yet");
});

exports.single_item = asyncHandler((req, res, next) => {
  res.send("Single item not supported yet.");
});

exports.item_create_get = asyncHandler((req, res, next) => {
  res.send("GET Item create not supported yet");
});

exports.item_create_post = asyncHandler((req, res, next) => {
  res.send("POST Item create not supported yet");
});

exports.item_delete_get = asyncHandler((req, res, next) => {
  res.send("GET Item delete not supported yet");
});

exports.item_delete_post = asyncHandler((req, res, next) => {
  res.send("POST Item delete not supported yet");
});

exports.item_update_get = asyncHandler((req, res, next) => {
  res.send("GET Item update not supported yet");
});

exports.item_update_post = asyncHandler((req, res, next) => {
  res.send("GET Item create not supported yet");
});
