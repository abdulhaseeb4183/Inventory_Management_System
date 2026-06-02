const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, default: '', trim: true },
    contact: { type: String, default: '', trim: true },
    phone:   { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    notes:   { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', SupplierSchema);
