const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.index = asyncHandler(async (req, res, next) => {
  const [itemCount, categoryCount] = await Promise.all([
    Item.countDocuments().exec(),
    Category.countDocuments().exec(),
  ]);
  res.render("index", { title: "Inventory", itemCount, categoryCount });
});

exports.item_list = asyncHandler(async (req, res, next) => {
  const allItems = await Item.find({}, "name price").sort({ name: 1 }).exec();
  res.render("itemList", { allItems, title: "Item List" });
});

exports.single_item = asyncHandler(async (req, res, next) => {
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

exports.item_create_get = asyncHandler(async (req, res, next) => {
  const allCategories = await Category.find().sort({ name: 1 }).exec();

  res.render("itemForm", {
    title: "Create Item",
    allCategories,
  });
});

exports.item_create_post = [
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
    .withMessage("Price cannot be 0 or lower"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      inStock: req.body.stock,
      price: req.body.price,
    });

    if (!errors.isEmpty()) {
      const allCategories = await Category.find().sort({ name: 1 }).exec();

      for (const category of allCategories) {
        if (item.category.includes(category._id)) {
          category.checked = "true";
        }
      }

      res.render("itemForm", {
        title: "Create item",
        allCategories,
        item: item,
        errors: errors.array(),
      });
    } else {
      await item.save();
      res.redirect(item.url);
    }
  }),
];

exports.item_delete_get = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id, "name inStock").exec();

  if (!item) res.redirect("/inventory/items");

  res.render("itemDelete", {
    title: "Delete Item",
    singleItem: item,
  });
});

exports.item_delete_post = asyncHandler(async (req, res, next) => {
  await Item.findByIdAndDelete(req.body.itemId);
  res.redirect("/inventory/items");
});

exports.item_update_get = asyncHandler(async (req, res, next) => {
  const [item, allCategories] = await Promise.all([
    Item.findById(req.params.id).exec(),
    Category.find({}, "name").sort({ name: 1 }).exec(),
  ]);

  if (!item) {
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  allCategories.forEach((cat) => {
    if (item.category.includes(cat._id)) cat.checked = "true";
  });

  res.render("itemForm", {
    title: "Update Item",
    item: item,
    allCategories: allCategories,
  });
});

exports.item_update_post = [
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
    .withMessage("Price cannot be 0 or lower"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      inStock: req.body.stock,
      price: req.body.price,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allCategories = await Category.find().sort({ name: 1 }).exec();

      for (const category of allCategories) {
        if (item.category.includes(category._id)) {
          category.checked = "true";
        }
      }

      res.render("itemForm", {
        title: "Create item",
        allCategories,
        item: item,
        errors: errors.array(),
      });
    } else {
      const updatedItem = await Item.findByIdAndUpdate(req.params.id, item);
      res.redirect(updatedItem.url);
    }
  }),
];
