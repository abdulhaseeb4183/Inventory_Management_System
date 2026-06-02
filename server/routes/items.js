const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create item
router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `SKU '${req.body.sku}' already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update item
router.put('/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Item not found.' });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `SKU '${req.body.sku}' already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE item
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST adjust stock (stock-in / stock-out)
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { amount, operation } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const diff = Number(amount) || 0;
    if (operation === 'in') {
      item.quantity = (Number(item.quantity) || 0) + diff;
    } else {
      item.quantity = Math.max(0, (Number(item.quantity) || 0) - diff);
    }
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
