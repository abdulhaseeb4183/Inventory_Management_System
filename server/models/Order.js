const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema(
  {
    itemId:    { type: mongoose.Schema.Types.Mixed, required: true }, // supports numeric or ObjectId
    name:      { type: String, default: '' },
    sku:       { type: String, default: '' },
    quantity:  { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const ShippingInfoSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: '' },
    phone:        { type: String, default: '' },
    address:      { type: String, default: '' },
    courierName:  { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId:         { type: String, required: true, unique: true },
    customerName:    { type: String, required: true, trim: true },
    customerContact: { type: String, default: '', trim: true },
    lineItems:       [LineItemSchema],
    status:          { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Returned'], default: 'Pending' },
    totalUnits:      { type: Number, default: 0 },
    totalAmount:     { type: Number, default: 0 },
    shippingInfo:    { type: ShippingInfoSchema, default: () => ({}) },
    date:            { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
