const express = require('express');
const { pool } = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [
      eventsCount,
      placesCount,
      usersCount,
      complaintsCount,
      pendingComplaintsCount
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM events'),
      pool.query('SELECT COUNT(*) FROM places'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM complaints'),
      pool.query("SELECT COUNT(*) FROM complaints WHERE status = 'pending'")
    ]);

    res.json({
      events: parseInt(eventsCount.rows[0].count),
      places: parseInt(placesCount.rows[0].count),
      users: parseInt(usersCount.rows[0].count),
      complaints: parseInt(complaintsCount.rows[0].count),
      pendingComplaints: parseInt(pendingComplaintsCount.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Update user role
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

