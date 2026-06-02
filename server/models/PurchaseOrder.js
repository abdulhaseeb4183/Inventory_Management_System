const mongoose = require('mongoose');

const POLineItemSchema = new mongoose.Schema(
  {
    itemId:   { type: mongoose.Schema.Types.Mixed, required: true },
    name:     { type: String, default: '' },
    sku:      { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber:    { type: String, required: true, unique: true, trim: true },
    supplierId:  { type: mongoose.Schema.Types.Mixed, default: null },
    supplierName:{ type: String, default: '' },
    lineItems:   [POLineItemSchema],
    status:      { type: String, enum: ['Pending', 'Ordered', 'Received', 'Cancelled'], default: 'Pending' },
    totalAmount: { type: Number, default: 0 },
    notes:       { type: String, default: '' },
    orderDate:   { type: Date, default: Date.now },
    expectedDate:{ type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
