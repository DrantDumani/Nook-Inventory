const createError = require("http-errors");
const compression = require("compression");
const helmet = require("helmet");
const express = require("express");
const path = require("path");
const logger = require("morgan");
require("dotenv").config();
const favicon = require("serve-favicon");

const indexRouter = require("./routes/index");
const inventoryRouter = require("./routes/inventory");

const port = process.env.PORT || 3000;

const app = express();
app.use(compression());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "img-src": ["'self'", "https://res.cloudinary.com/"],
      "script-src": ["'self'"],
    },
  })
);

const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(limiter);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public/images", "favicon.ico")));

app.use("/", indexRouter);
app.use("/inventory", inventoryRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(port, () => {
  console.log(`listening on port: ${port}`);
});
