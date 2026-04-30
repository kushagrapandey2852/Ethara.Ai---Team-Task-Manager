const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const seed = async () => {
  const SQL = await initSqlJs();
  let data = null;
  if (fs.existsSync(DB_PATH)) {
    data = fs.readFileSync(DB_PATH);
  }
  
  const db = new SQL.Database(data ? new Uint8Array(data) : undefined);
  
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const memberPassword = bcrypt.hashSync('member123', 10);

  console.log('Cleaning existing data...');
  db.run('DELETE FROM task_comments');
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM project_members');
  db.run('DELETE FROM projects');
  db.run('DELETE FROM project_categories');
  db.run('DELETE FROM users');
  db.run('DELETE FROM notifications');

  console.log('Creating users...');
  db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", ['admin', 'admin@example.com', hashedPassword, 'admin']);
  db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", ['member', 'member@example.com', memberPassword, 'member']);
  db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", ['john_doe', 'john@example.com', memberPassword, 'member']);

  const getUsers = db.prepare("SELECT id, username FROM users");
  const users = {};
  while(getUsers.step()) {
    const u = getUsers.getAsObject();
    users[u.username] = u.id;
  }
  getUsers.free();

  console.log('Creating categories...');
  db.run("INSERT INTO project_categories (name, color) VALUES (?, ?)", ['Development', '#3B82F6']);
  db.run("INSERT INTO project_categories (name, color) VALUES (?, ?)", ['Design', '#EC4899']);
  db.run("INSERT INTO project_categories (name, color) VALUES (?, ?)", ['Marketing', '#10B981']);

  const getCats = db.prepare("SELECT id, name FROM project_categories");
  const cats = {};
  while(getCats.step()) {
    const c = getCats.getAsObject();
    cats[c.name] = c.id;
  }
  getCats.free();

  console.log('Creating projects...');
  db.run("INSERT INTO projects (name, description, owner_id, category_id, deadline) VALUES (?, ?, ?, ?, ?)", 
    ['Website Redesign', 'Complete overhaul of the company website with modern UI.', users['admin'], cats['Design'], '2026-06-15']);
  db.run("INSERT INTO projects (name, description, owner_id, category_id, deadline) VALUES (?, ?, ?, ?, ?)", 
    ['Mobile App v2', 'Updating the mobile app to include social features.', users['admin'], cats['Development'], '2026-07-20']);

  const getProjs = db.prepare("SELECT id, name FROM projects");
  const projs = {};
  while(getProjs.step()) {
    const p = getProjs.getAsObject();
    projs[p.name] = p.id;
  }
  getProjs.free();

  console.log('Adding members...');
  db.run("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)", [projs['Website Redesign'], users['admin'], 'admin']);
  db.run("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)", [projs['Website Redesign'], users['member'], 'member']);
  db.run("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)", [projs['Website Redesign'], users['john_doe'], 'member']);

  db.run("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)", [projs['Mobile App v2'], users['admin'], 'admin']);
  db.run("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)", [projs['Mobile App v2'], users['member'], 'member']);

  console.log('Creating tasks...');
  db.run("INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    ['Finalize Mockups', 'Create high-fidelity mockups for the homepage.', 'completed', 'high', '2026-05-10', projs['Website Redesign'], users['john_doe'], users['admin']]);
  
  db.run("INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    ['Implement Header', 'Develop the responsive navigation header.', 'in_progress', 'medium', '2026-05-20', projs['Website Redesign'], users['member'], users['admin']]);

  db.run("INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    ['Content Strategy', 'Draft the new copy for the About page.', 'pending', 'low', '2026-05-25', projs['Website Redesign'], users['john_doe'], users['admin']]);

  db.run("INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    ['API Authentication', 'Implement JWT auth for the new endpoints.', 'in_progress', 'high', '2026-05-15', projs['Mobile App v2'], users['member'], users['admin']]);

  console.log('Adding comments...');
  const getTask = db.prepare("SELECT id FROM tasks WHERE title = 'Implement Header'");
  if (getTask.step()) {
    const taskId = getTask.getAsObject().id;
    db.run("INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)", [taskId, users['member'], 'I have started working on the CSS for the header.']);
    db.run("INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)", [taskId, users['admin'], 'Great, make sure it is accessible.']);
  }
  getTask.free();

  console.log('Saving database...');
  const buffer = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, buffer);
  console.log('Database seeded successfully!');
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
