const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: { type: String, required: true, maxLength: 100 },
  description: { type: String, required: true },
  category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  inStock: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"],
  },
  price: { type: Number, required: true, min: [1, "Must be higher than 0"] },
  image: { url: { type: String }, publicId: { type: String } },
});

ItemSchema.virtual("url").get(function () {
  return `/inventory/item/${this._id}`;
});

module.exports = mongoose.model("Item", ItemSchema);
