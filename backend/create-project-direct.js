const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

async function main() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);
  
  // Check users table
  const users = db.exec('SELECT * FROM users');
  console.log('Users:', users);
  
  // Check if admin exists
  const adminCheck = db.exec("SELECT * FROM users WHERE username = 'admin'");
  console.log('Admin user:', adminCheck);
  
  if (adminCheck.length > 0 && adminCheck[0].values.length > 0) {
    const adminId = adminCheck[0].values[0][0];
    console.log('Admin ID:', adminId);
    
    // Create project
    db.run("INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)", 
      ['Team Task Manager', 'Main project for team tasks', adminId]);
    
    const projectId = db.exec('SELECT last_insert_rowid()');
    console.log('Project ID:', projectId);
    
    // Add owner as admin member
    db.run("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)", 
      [projectId[0].values[0][0], adminId, 'admin']);
    
    // Save
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    
    console.log('✅ Project created successfully!');
  } else {
    console.log('Admin user not found');
  }
}

main().catch(console.error);
