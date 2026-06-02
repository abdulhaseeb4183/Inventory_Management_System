const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Item = require('../models/Item');

// GET all purchase orders
router.get('/', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create purchase order
router.post('/', async (req, res) => {
  try {
    const po = new PurchaseOrder(req.body);

    // If immediately Received, add stock
    if (po.status === 'Received') {
      for (const line of po.lineItems) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: line.quantity } });
      }
    }

    const saved = await po.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `PO Number '${req.body.poNumber}' already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update purchase order
router.put('/:id', async (req, res) => {
  try {
    const oldPO = await PurchaseOrder.findById(req.params.id);
    if (!oldPO) return res.status(404).json({ error: 'Purchase Order not found.' });

    const updated = req.body;

    // Validate stock won't go negative
    if (oldPO.status === 'Received' && updated.status !== 'Received') {
      for (const line of oldPO.lineItems) {
        const item = await Item.findById(line.itemId);
        const currentQty = item ? (Number(item.quantity) || 0) : 0;
        if (currentQty - Number(line.quantity) < 0) {
          return res.status(400).json({
            error: `Cannot revert PO: Item '${line.name}' stock would go below zero (current: ${currentQty}, trying to remove: ${line.quantity}).`,
          });
        }
      }
    }

    // Handle stock adjustments
    if (oldPO.status !== 'Received' && updated.status === 'Received') {
      // Newly received — add stock
      for (const line of updated.lineItems) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: line.quantity } });
      }
    } else if (oldPO.status === 'Received' && updated.status !== 'Received') {
      // Un-received — remove stock
      for (const line of oldPO.lineItems) {
        await Item.findByIdAndUpdate(line.itemId, {
          $inc: { quantity: -line.quantity },
        });
      }
    } else if (oldPO.status === 'Received' && updated.status === 'Received') {
      // Both received — net adjust
      const allItemIds = new Set([
        ...oldPO.lineItems.map((l) => String(l.itemId)),
        ...updated.lineItems.map((l) => String(l.itemId)),
      ]);
      for (const itemId of allItemIds) {
        const oldLine = oldPO.lineItems.find((l) => String(l.itemId) === itemId);
        const newLine = updated.lineItems.find((l) => String(l.itemId) === itemId);
        const diff = (newLine ? Number(newLine.quantity) : 0) - (oldLine ? Number(oldLine.quantity) : 0);
        if (diff !== 0) {
          await Item.findByIdAndUpdate(itemId, { $inc: { quantity: diff } });
        }
      }
    }

    const savedPO = await PurchaseOrder.findByIdAndUpdate(req.params.id, updated, {
      new: true,
      runValidators: true,
    });

    res.json(savedPO);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `PO Number '${req.body.poNumber}' already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE purchase order
router.delete('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found.' });

    if (po.status === 'Received') {
      // Validate stock won't go negative
      for (const line of po.lineItems) {
        const item = await Item.findById(line.itemId);
        const currentQty = item ? (Number(item.quantity) || 0) : 0;
        if (currentQty - Number(line.quantity) < 0) {
          return res.status(400).json({
            error: `Cannot delete Received PO: Item '${line.name}' stock would go below zero (current: ${currentQty}).`,
          });
        }
      }
      // Remove stock
      for (const line of po.lineItems) {
        await Item.findByIdAndUpdate(line.itemId, { $inc: { quantity: -line.quantity } });
      }
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
