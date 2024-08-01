exports.checkBoxToArray = (req, res, next) => {
  if (!Array.isArray(req.body.category)) {
    req.body.category = req.body.category ? [req.body.category] : [];
  }
  return next();
};
