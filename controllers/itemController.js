const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const queries = require("../db/queries");
require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000, files: 1 },
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

exports.index = asyncHandler(async (req, res, next) => {
  const result = await queries.countItemsAndCategories();
  const { itemtotal, categorytotal } = result[0];
  res.render("index", {
    title: "Inventory",
    itemCount: itemtotal,
    categoryCount: categorytotal,
  });
});

exports.item_list = asyncHandler(async (req, res, next) => {
  const allItems = await queries.getItemList();
  res.render("itemList", { allItems, title: "Item List" });
});

exports.OLDsingle_item = asyncHandler(async (req, res, next) => {
  const singleItem = await Item.findById(req.params.id)
    .populate({
      path: "category",
      select: "name",
    })
    .exec();

  if (!singleItem) {
    const err = new Error("Item not found.");
    err.status = 404;
    return next(err);
  }

  res.render("itemDetail", {
    title: singleItem.name,
    singleItem,
  });
});

exports.single_item = asyncHandler(async (req, res, next) => {
  const singleItem = await queries.getItemById(req.params.id);

  if (!singleItem) {
    const err = new Error("Item not found.");
    err.status = 404;
    return next(err);
  }

  res.render("itemDetail", {
    title: singleItem.name,
    singleItem,
  });
});

exports.item_create_get = asyncHandler(async (req, res, next) => {
  const allCategories = await queries.getCategoryList();

  res.render("itemForm", { title: "Create Item", allCategories });
});

exports.item_create_post = [
  upload.single("image-file"),
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category = req.body.category ? [req.body.category] : [];
    }
    next();
  },

  body("name", "Name must not be empty").trim().isLength({ min: 1 }),
  body("description", "Summary must not be blank").trim().isLength({ min: 1 }),
  body("category", "Pick at least one category").isArray({ min: 1 }),
  body("stock", "Stock cannot be empty")
    .isInt({ min: 0 })
    .withMessage("Stock must be whole number greater than -1"),
  body("price", "Price must not be empty")
    .isInt({ min: 1 })
    .withMessage("Price must be whole number greater than 0"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req).array();
    const item = {
      name: req.body.name,
      description: req.body.description,
      instock: req.body.stock,
      price: req.body.price,
      category: req.body.category,
    };

    if (errors.length) {
      const allCategories = await queries.getCategoryList();

      for (const category of allCategories) {
        if (item.category.includes(category.id.toString())) {
          category.checked = "true";
        }
      }

      res.render("itemForm", {
        title: "Create item",
        allCategories,
        item: item,
        errors: errors,
      });
    } else {
      const row = await queries.createItem(item);
      const item_id = row[0].item_id;

      if (req.file) {
        const upload = await new Promise((resolve) => {
          cloudinary.uploader
            .upload_stream((err, result) => {
              return resolve(result);
            })
            .end(req.file.buffer);
        });
        const { public_id } = upload;
        const transformURL = cloudinary.url(public_id, {
          width: 128,
          height: 128,
        });
        await queries.insertOrUpdateImage(item_id, transformURL, public_id);
      }

      res.redirect(`/inventory/item/${item_id}`);
    }
  }),
];

exports.item_delete_get = asyncHandler(async (req, res, next) => {
  const item = await queries.getItemNameAndStock(req.params.id);

  if (!item) res.redirect("/inventory/items");

  res.render("itemDelete", { title: "Delete Item", singleItem: item });
});

exports.item_delete_post = [
  body("password", "Password is incorrect").trim().equals("KKJongaraBestSong"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const item = await queries.getItemNameAndStock(req.params.id);

      if (!item) return res.redirect("/inventory/items");
      else {
        res.render("itemDelete", {
          title: "Delete Item",
          singleItem: item,
          errors: errors.array(),
        });
      }
    } else {
      const deletedItem = await queries.deleteItemById(req.params.id);
      if (deletedItem) {
        await cloudinary.uploader.destroy(deletedItem.img_public_id);
      }
      res.redirect("/inventory/items");
    }
  }),
];

exports.item_update_get = asyncHandler(async (req, res, next) => {
  const [item, allCategories] = await Promise.all([
    queries.getItemById(req.params.id),
    queries.getCategoryList(),
  ]);

  if (!item) {
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  allCategories.forEach((cat) => {
    if (item.categories.findIndex((catObj) => catObj.catId === cat.id) > -1) {
      cat.checked = true;
    }
  });

  res.render("itemForm", {
    title: "Update Form",
    item: item,
    allCategories: allCategories,
    requirePass: true,
  });
});

exports.item_update_post = [
  upload.single("image-file"),
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category = req.body.category ? [req.body.category] : [];
    }
    next();
  },

  body("name", "Name must not be empty").trim().isLength({ min: 1 }),
  body("description", "Summary must not be blank").trim().isLength({ min: 1 }),
  body("category", "Pick at least one category").isArray({ min: 1 }),
  body("stock", "Stock cannot be empty")
    .isInt({ min: 0 })
    .withMessage("Stock must be whole number greater than -1"),
  body("price", "Price must not be empty")
    .isInt({ min: 1 })
    .withMessage("Price must be whole number greater than 0"),
  body("password", "Password is incorrect").trim().equals("KKJongaraBestSong"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      instock: req.body.stock,
      price: req.body.price,
      id: req.params.id,
    };

    if (!errors.isEmpty()) {
      const allCategories = await queries.getCategoryList();

      for (const category of allCategories) {
        if (item.category.includes(category.id.toString())) {
          category.checked = "true";
        }
      }

      res.render("itemForm", {
        title: "Update Item",
        allCategories,
        item: item,
        errors: errors.array(),
        requirePass: true,
      });
    } else {
      const updatedItemIds = await queries.updateItem(item);
      console.log(updatedItemIds);
      if (req.file) {
        const publicId = updatedItemIds.img_public_id;
        const options = publicId
          ? { public_id: publicId, invalidate: true, overwrite: true }
          : {};
        const upload = await new Promise((resolve) => {
          cloudinary.uploader
            .upload_stream(options, (err, result) => {
              return resolve(result);
            })
            .end(req.file.buffer);
        });

        const { public_id } = upload;
        console.log(public_id);
        const transformURL = cloudinary.url(public_id, {
          width: 128,
          height: 128,
          version: upload.version,
        });
        await queries.insertOrUpdateImage(
          updatedItemIds.id,
          transformURL,
          public_id
        );
      }
      return res.redirect(`/inventory/item/${updatedItemIds.id}`);
    }
  }),
];
