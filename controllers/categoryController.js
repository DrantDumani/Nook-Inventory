const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const validation = require("../middleware/validation");
const queries = require("../db/queries");

exports.category_list = asyncHandler(async (req, res, next) => {
  const categories = await queries.getCategoryList();
  res.render("categoryList", {
    title: "Category List",
    categories: categories,
  });
});

exports.single_category = asyncHandler(async (req, res, next) => {
  const [category, itemsInCategory] = await Promise.all([
    queries.getCategoryById(req.params.id),
    queries.getItemsInCategory(req.params.id),
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
  res.render("categoryForm", { title: "Create Category" });
});

exports.category_create_post = [
  validation.validateCategory(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const category = {
      name: req.body.name,
      description: req.body.description,
    };

    if (!errors.isEmpty()) {
      res.render("categoryForm", {
        title: "Create Category",
        category: category,
        errors: errors.array(),
      });
    } else {
      const newCategoryId = await queries.createCategory(category);
      res.redirect(`/inventory/category/${newCategoryId}`);
    }
  }),
];

exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const [category, itemsInCategory] = await Promise.all([
    queries.getCategoryById(req.params.id),
    queries.getItemsInCategory(req.params.id),
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
  validation.validatePw(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const [category, itemsInCategory] = await Promise.all([
        queries.getCategoryById(req.params.id),
        queries.getItemsInCategory(req.params.id),
      ]);

      return res.render("categoryDelete", {
        title: "Delete Category",
        allItems: itemsInCategory,
        category: category,
        errors: errors.array(),
      });
    } else {
      await queries.deleteCategory(req.body.categoryId);
      res.redirect("/inventory/categories");
    }
  }),
];

exports.category_update_get = asyncHandler(async (req, res, next) => {
  const category = await queries.getCategoryById(req.params.id);

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
  validation.validateCategory(),
  validation.validatePw(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const category = {
      name: req.body.name,
      description: req.body.description,
      id: req.params.id,
    };

    if (!errors.isEmpty()) {
      res.render("categoryForm", {
        title: "Update Category",
        category: category,
        errors: errors.array(),
        requirePass: true,
      });
    } else {
      const updatedCatId = await queries.updateCategory(category);
      res.redirect(`/inventory/category/${updatedCatId}`);
    }
  }),
];
