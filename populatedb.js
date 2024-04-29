#! /usr/bin/env node

console.log(
  'This script populates some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: node populatedb "mongodb+srv://cooluser:coolpassword@cluster0.lz91hw2.mongodb.net/tom_nook?retryWrites=true&w=majority"'
);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const Item = require("./models/item");
const Category = require("./models/category");

const items = [];
const categories = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await createCategories();
  await createItems();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

// We pass the index to the ...Create functions so that, for example,
// genre[0] will always be the Fantasy genre, regardless of the order
// in which the elements of promise.all's argument complete.
async function itemCreate(
  index,
  name,
  description,
  category,
  inStock,
  price,
  image
) {
  const itemDetail = { name, description, inStock, price };
  if (category) itemDetail.category = category;
  if (image) itemDetail.image = image;

  const item = new Item(itemDetail);
  await item.save();
  items[index] = item;
  console.log(`Added item: ${name}`);
}

async function categoryCreate(index, name, description) {
  const category = new Category({ name, description });
  await category.save();
  categories[index] = category;
  console.log(`Added category: ${name}`);
}

async function createCategories() {
  console.log("Adding categories");
  await Promise.all([
    categoryCreate(0, "Flooring", "Rugs, Carpets, and other floor decor"),
    categoryCreate(1, "Furniture", "General houseware and appliances"),
    categoryCreate(
      2,
      "Wallpaper",
      "Wall mounted paneling, tiles, and stickers"
    ),
    categoryCreate(
      3,
      "Music",
      "Musical instruments and tools, vinyl records, tapes, and cds"
    ),
  ]);
}

async function createItems() {
  console.log("Adding items");
  await Promise.all([
    itemCreate(
      0,
      "Bamboo Shelf",
      "Hand carved from our island rampant bamboo, this sturdy shelf will last a lifetime.",
      [categories[1]],
      8,
      2400
    ),
    itemCreate(
      1,
      "Alto Saxophone",
      "A quality instrument, autographed by K.K. Slider himself.",
      [categories[3]],
      22,
      3400
    ),
    itemCreate(
      2,
      "Underwater Flooring",
      "Designed to invoke the feeling of being on the ocean floor. Comes with safe bioluminescent properties",
      [categories[0]],
      2,
      7200
    ),
    itemCreate(
      3,
      "Chic Wall",
      "A simple design that will make any guest feel welcome in your humble abode.",
      [categories[0]],
      41,
      1960
    ),
  ]);
}
