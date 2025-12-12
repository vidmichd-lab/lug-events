const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all places
router.get('/', [
  query('cityId').optional().isUUID(),
  query('type').optional().isIn(['museum', 'theater', 'cafe', 'restaurant', 'cinema', 'space']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cityId, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as city_name, c.slug as city_slug
      FROM places p
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (cityId) {
      query += ` AND p.city_id = $${paramCount}`;
      params.push(cityId);
      paramCount++;
    }

    if (type) {
      query += ` AND p.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get place by ID
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as city_name, c.slug as city_slug
       FROM places p
       LEFT JOIN cities c ON p.city_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create place (admin only)
router.post('/', authenticate, requireAdmin, [
  body('name').notEmpty(),
  body('type').isIn(['museum', 'theater', 'cafe', 'restaurant', 'cinema', 'space']),
  body('cityId').isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, address, cityId, description } = req.body;

    const result = await pool.query(
      `INSERT INTO places (name, type, address, city_id, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type, address, cityId, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update place (admin only)
router.put('/:id', authenticate, requireAdmin, [
  body('type').optional().isIn(['museum', 'theater', 'cafe', 'restaurant', 'cinema', 'space']),
  body('cityId').optional().isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, address, cityId, description } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (cityId !== undefined) {
      updates.push(`city_id = $${paramCount++}`);
      values.push(cityId);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE places SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete place (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM places WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

