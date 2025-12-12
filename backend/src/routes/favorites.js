const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's favorites
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        f.*,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.average_price,
        e.link,
        e.organizer,
        c.name as category_name,
        p.name as place_name,
        ci.name as city_name
      FROM favorites f
      JOIN events e ON f.event_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN places p ON e.place_id = p.id
      LEFT JOIN cities ci ON e.city_id = ci.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Add to favorites
router.post('/', authenticate, [
  body('eventId').isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId } = req.body;

    // Check if event exists
    const eventCheck = await pool.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already favorited
    const existing = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND event_id = $2',
      [req.user.id, eventId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Event already in favorites' });
    }

    const result = await pool.query(
      'INSERT INTO favorites (user_id, event_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, eventId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Event already in favorites' });
    }
    next(error);
  }
});

// Remove from favorites
router.delete('/:eventId', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND event_id = $2 RETURNING id',
      [req.user.id, req.params.eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    next(error);
  }
});

// Check if event is favorited
router.get('/check/:eventId', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND event_id = $2',
      [req.user.id, req.params.eventId]
    );

    res.json({ isFavorite: result.rows.length > 0 });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

