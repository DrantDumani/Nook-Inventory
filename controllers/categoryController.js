const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.category_list = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({}, "name").sort({ name: 1 }).exec();
  res.render("categoryList", {
    title: "Category List",
    categories: categories,
  });
});

exports.single_category = asyncHandler(async (req, res, next) => {
  const [category, itemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, "name price")
      .sort({ name: 1 })
      .exec(),
  ]);

  if (!category) {
    const err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }

  res.render("categoryDetail", {
    title: category.name,
    category: category,
    allItems: itemsInCategory,
  });
});

exports.category_create_get = asyncHandler(async (req, res, next) => {
  res.render("CategoryForm", { title: "Create Category" });
});

exports.category_create_post = [
  body("name", "Name must not be empty").trim().isLength({ min: 1 }),
  body("description", "Description cannot be empty")
    .trim()
    .isLength({ min: 1 }),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    let duplicateNameErr = "";

    const nameExists = await Category.findOne({
      name: req.body.name,
    })
      .collation({ locale: "en", strength: 2 })
      .exec();

    if (nameExists) {
      duplicateNameErr =
        "There is another category with that name in the inventory.";
    }

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
    });

    if (!errors.isEmpty() || duplicateNameErr) {
      res.render("CategoryForm", {
        title: "Create Category",
        category: category,
        errors: errors.array(),
        nameErr: duplicateNameErr,
      });
    } else {
      await category.save();
      res.redirect(category.url);
    }
  }),
];

exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const [category, itemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, "name").sort({ name: 1 }).exec(),
  ]);

  if (!category) {
    res.redirect("/inventory/categories");
  }

  res.render("categoryDelete", {
    title: "Delete Category",
    category: category,
    allItems: itemsInCategory,
  });
});

exports.category_delete_post = [
  body("password", "Password is incorrect").trim().equals("KKJongaraBestSong"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const [category, itemsInCategory] = await Promise.all([
      Category.findById(req.params.id).exec(),
      Item.find({ category: req.params.id }, "name").sort({ name: 1 }).exec(),
    ]);

    if (itemsInCategory.length || !errors.isEmpty()) {
      res.render("categoryDelete", {
        title: "Delete Category",
        allItems: itemsInCategory,
        category: category,
        errors: errors.array(),
      });
      return;
    } else {
      await Category.findByIdAndDelete(req.body.categoryId);
      res.redirect("/inventory/categories");
    }
  }),
];

exports.category_update_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();

  if (!category) {
    const err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }

  res.render("categoryForm", {
    title: "Update Category",
    category: category,
    requirePass: true,
  });
});

exports.category_update_post = [
  body("name", "Name must not be empty").trim().isLength({ min: 1 }),
  body("description", "Description cannot be empty")
    .trim()
    .isLength({ min: 1 }),
  body("password", "Password is incorrect").trim().equals("KKJongaraBestSong"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    let duplicateNameErr = "";

    const [validId, nameExists] = await Promise.all([
      Category.findById(req.params.id, "name").exec(),
      Category.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec(),
    ]);

    if (
      validId &&
      nameExists &&
      validId._id.toString() !== nameExists._id.toString()
    ) {
      duplicateNameErr =
        "There is another category with that name in the inventory.";
    }

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      _id: req.params.id,
    });

    if (!errors.isEmpty() || duplicateNameErr) {
      res.render("categoryForm", {
        title: "Update Category",
        category: category,
        errors: errors.array(),
        nameErr: duplicateNameErr,
        requirePass: true,
      });
    } else {
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        category
      );
      res.redirect(updatedCategory.url);
    }
  }),
];
