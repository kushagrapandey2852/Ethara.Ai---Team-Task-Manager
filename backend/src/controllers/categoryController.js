const { db } = require('../config/database');

const getCategories = (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM project_categories ORDER BY name ASC').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = (req, res) => {
  const { name, color } = req.body;

  try {
    const result = db.prepare(
      'INSERT INTO project_categories (name, color) VALUES (?, ?)'
    ).run(name, color || '#7C3AED');

    const category = db.prepare('SELECT * FROM project_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    db.prepare(
      'UPDATE project_categories SET name = ?, color = ? WHERE id = ?'
    ).run(name, color, id);

    const category = db.prepare('SELECT * FROM project_categories WHERE id = ?').get(id);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM project_categories WHERE id = ?').run(id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
