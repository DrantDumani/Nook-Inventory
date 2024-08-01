const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const validation = require("../middleware/validation");
const upload = require("../multer/multerConfig");
const cloudinary = require("../cloudinary/cloudinaryConfig");
const queries = require("../db/queries");
const handleCheckBoxInput = require("../middleware/checkboxToArray");
require("dotenv").config();

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
  handleCheckBoxInput.checkBoxToArray,
  validation.validateItem(),

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
  validation.validatePw(),

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
      const deletedItem = await queries.deleteItemById(req.body.itemId);
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
  handleCheckBoxInput.checkBoxToArray,
  validation.validateItem(),
  validation.validatePw(),

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
