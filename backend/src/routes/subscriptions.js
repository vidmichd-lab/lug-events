const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's subscriptions
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        p.name as place_name,
        p.type as place_type,
        p.address,
        p.description as place_description,
        c.name as city_name
      FROM subscriptions s
      JOIN places p ON s.place_id = p.id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Subscribe to place
router.post('/', authenticate, [
  body('placeId').isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { placeId } = req.body;

    // Check if place exists
    const placeCheck = await pool.query('SELECT id FROM places WHERE id = $1', [placeId]);
    if (placeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    // Check if already subscribed
    const existing = await pool.query(
      'SELECT id FROM subscriptions WHERE user_id = $1 AND place_id = $2',
      [req.user.id, placeId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already subscribed to this place' });
    }

    const result = await pool.query(
      'INSERT INTO subscriptions (user_id, place_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, placeId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Already subscribed to this place' });
    }
    next(error);
  }
});

// Unsubscribe from place
router.delete('/:placeId', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM subscriptions WHERE user_id = $1 AND place_id = $2 RETURNING id',
      [req.user.id, req.params.placeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    next(error);
  }
});

// Check if subscribed to place
router.get('/check/:placeId', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id FROM subscriptions WHERE user_id = $1 AND place_id = $2',
      [req.user.id, req.params.placeId]
    );

    res.json({ isSubscribed: result.rows.length > 0 });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

