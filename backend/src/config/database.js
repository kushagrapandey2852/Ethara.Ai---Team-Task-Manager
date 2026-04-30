const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

let db = null;
let lastInsertRowid = 0;

const initDb = async () => {
  const SQL = await initSqlJs();
  
  // Try to load existing database
  let data = null;
  if (fs.existsSync(DB_PATH)) {
    data = fs.readFileSync(DB_PATH);
  }
  
  db = new SQL.Database(data ? new Uint8Array(data) : undefined);
  
  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      deadline DATETIME,
      category_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES project_categories(id) ON DELETE SET NULL
    )
  `);

  // Project categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Try to add category_id column if it doesn't exist
  try {
    db.run('ALTER TABLE projects ADD COLUMN category_id INTEGER');
  } catch (e) {}

  // Try to add deadline column if it doesn't exist (migration)
  try {
    db.run('ALTER TABLE projects ADD COLUMN deadline DATETIME');
  } catch (e) {
    // Column might already exist
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    )
`);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      due_date DATETIME,
      project_id INTEGER NOT NULL,
      assignee_id INTEGER,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  
  // Task comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Task attachments table
  db.run(`
    CREATE TABLE IF NOT EXISTS task_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('task_assigned', 'task_updated', 'task_completed', 'deadline_approaching', 'project_invite', 'comment_added')),
      title TEXT NOT NULL,
      message TEXT,
      task_id INTEGER,
      project_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);
  
  saveDb();
  
  return db;
};

const getDb = () => db;

const saveDb = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

// Helper functions for common queries
const run = (sql, params = []) => {
  db.run(sql, params);
  // Get last insert rowid
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  if (stmt.step()) {
    lastInsertRowid = stmt.getAsObject().id;
  }
  stmt.free();
  saveDb();
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
};

const all = (sql, params = []) => {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

// Export db object for prepared statements (db.prepare().all(), etc.)
// This mimics the better-sqlite3 API used in controllers
const dbWrapper = {
  prepare: (sql) => {
    return {
      run: (...params) => {
        run(sql, params);
        return { lastInsertRowid: lastInsertRowid };
      },
      get: (...params) => {
        return get(sql, params);
      },
      all: (...params) => {
        return all(sql, params);
      }
    };
  }
};

module.exports = {
  db: dbWrapper,
  initDb,
  getDb,
  saveDb,
  run,
  get,
  all
};
