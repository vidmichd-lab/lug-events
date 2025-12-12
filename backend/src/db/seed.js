const { pool } = require('./connection');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['admin@example.com', hashedPassword, 'Admin', 'admin']
    );

    // Create sample cities
    await pool.query(
      `INSERT INTO cities (name, slug) VALUES 
       ('Москва', 'moscow'),
       ('Санкт-Петербург', 'spb'),
       ('Казань', 'kazan')
       ON CONFLICT (slug) DO NOTHING`
    );

    // Create sample categories
    await pool.query(
      `INSERT INTO categories (name, slug) VALUES 
       ('Выставки', 'exhibitions'),
       ('Концерты', 'concerts'),
       ('Театр', 'theater'),
       ('Кино', 'cinema'),
       ('Фестивали', 'festivals')
       ON CONFLICT (slug) DO NOTHING`
    );

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();

