const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all events with filters
router.get('/', [
  query('cityId').optional().isUUID(),
  query('categoryId').optional().isUUID(),
  query('placeId').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cityId, categoryId, placeId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        e.*,
        c.name as category_name,
        c.slug as category_slug,
        p.name as place_name,
        p.type as place_type,
        ci.name as city_name,
        ci.slug as city_slug
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN places p ON e.place_id = p.id
      LEFT JOIN cities ci ON e.city_id = ci.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (cityId) {
      query += ` AND e.city_id = $${paramCount}`;
      params.push(cityId);
      paramCount++;
    }

    if (categoryId) {
      query += ` AND e.category_id = $${paramCount}`;
      params.push(categoryId);
      paramCount++;
    }

    if (placeId) {
      query += ` AND e.place_id = $${paramCount}`;
      params.push(placeId);
      paramCount++;
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM events WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (cityId) {
      countQuery += ` AND city_id = $${countParamCount}`;
      countParams.push(cityId);
      countParamCount++;
    }
    if (categoryId) {
      countQuery += ` AND category_id = $${countParamCount}`;
      countParams.push(categoryId);
      countParamCount++;
    }
    if (placeId) {
      countQuery += ` AND place_id = $${countParamCount}`;
      countParams.push(placeId);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      events: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get event by ID
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.slug as category_slug,
        p.name as place_name,
        p.type as place_type,
        p.address as place_address,
        ci.name as city_name,
        ci.slug as city_slug
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN places p ON e.place_id = p.id
      LEFT JOIN cities ci ON e.city_id = ci.id
      WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create event (admin only)
router.post('/', authenticate, requireAdmin, [
  body('title').notEmpty(),
  body('cityId').isUUID(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('averagePrice').optional().isFloat({ min: 0 }),
  body('link').optional().isURL(),
  body('categoryId').optional().isUUID(),
  body('placeId').optional().isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      averagePrice,
      link,
      organizer,
      categoryId,
      placeId,
      cityId
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events (title, description, start_date, end_date, average_price, link, organizer, category_id, place_id, city_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, startDate, endDate, averagePrice, link, organizer, categoryId, placeId, cityId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update event (admin only)
router.put('/:id', authenticate, requireAdmin, [
  body('title').optional().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('averagePrice').optional().isFloat({ min: 0 }),
  body('link').optional().isURL(),
  body('categoryId').optional().isUUID(),
  body('placeId').optional().isUUID(),
  body('cityId').optional().isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      averagePrice,
      link,
      organizer,
      categoryId,
      placeId,
      cityId
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(startDate);
    }
    if (endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(endDate);
    }
    if (averagePrice !== undefined) {
      updates.push(`average_price = $${paramCount++}`);
      values.push(averagePrice);
    }
    if (link !== undefined) {
      updates.push(`link = $${paramCount++}`);
      values.push(link);
    }
    if (organizer !== undefined) {
      updates.push(`organizer = $${paramCount++}`);
      values.push(organizer);
    }
    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(categoryId);
    }
    if (placeId !== undefined) {
      updates.push(`place_id = $${paramCount++}`);
      values.push(placeId);
    }
    if (cityId !== undefined) {
      updates.push(`city_id = $${paramCount++}`);
      values.push(cityId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete event (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

