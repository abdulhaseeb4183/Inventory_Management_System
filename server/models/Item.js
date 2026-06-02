const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    sku:          { type: String, required: true, trim: true, unique: true },
    category:     { type: String, default: 'General', trim: true },
    quantity:     { type: Number, default: 0, min: 0 },
    costPrice:    { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', ItemSchema);
