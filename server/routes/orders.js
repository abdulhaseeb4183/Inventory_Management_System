const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order (also deducts inventory)
router.post('/', async (req, res) => {
  try {
    const { customerName, customerContact, lineItems, orderId, date, status, totalUnits, totalAmount, shippingInfo } = req.body;

    // Deduct stock for each line item
    for (const line of lineItems) {
      await Item.findByIdAndUpdate(line.itemId, {
        $inc: { quantity: -line.quantity },
      });
    }

    const order = new Order({
      orderId,
      customerName,
      customerContact,
      lineItems,
      status: status || 'Pending',
      totalUnits,
      totalAmount,
      shippingInfo,
      date,
    });

    const saved = await order.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Order ID '${req.body.orderId}' already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update order (handles stock revert + re-deduct)
router.put('/:id', async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) return res.status(404).json({ error: 'Order not found.' });

    const { customerName, customerContact, lineItems, status, totalUnits, totalAmount, shippingInfo } = req.body;

    // Restore old stock if old order was not Returned
    if (oldOrder.status !== 'Returned') {
      for (const line of oldOrder.lineItems) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: line.quantity } });
      }
    }

    // Deduct new stock if new status is not Returned
    if (status !== 'Returned') {
      for (const line of lineItems) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: -line.quantity } });
      }
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { customerName, customerContact, lineItems, status, totalUnits, totalAmount, shippingInfo },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update order status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { newStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const oldStatus = order.status;

    if (oldStatus !== newStatus) {
      if (newStatus === 'Returned') {
        // Restore stock
        for (const line of order.lineItems) {
          await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: line.quantity } });
        }
      } else if (oldStatus === 'Returned') {
        // Re-deduct stock
        for (const line of order.lineItems) {
          await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: -line.quantity } });
        }
      }
    }

    order.status = newStatus;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update shipping info
router.patch('/:id/shipping', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    order.shippingInfo = { ...order.shippingInfo.toObject(), ...req.body };
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE order (restore stock if not Returned)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.status !== 'Returned') {
      for (const line of order.lineItems) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: line.quantity } });
      }
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
