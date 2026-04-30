const http = require('http');

// Step 1: Login to get token
const loginData = JSON.stringify({
  email: 'admin@example.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('Step 1: Logging in as admin...');
const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Login Status:', res.statusCode);
    console.log('Response:', body);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(body);
      const token = response.token;
      console.log('\nToken:', token);
      console.log('\nStep 2: Creating project...');
      
      // Step 2: Create project with token
      const projectData = JSON.stringify({
        name: 'Team Task Manager',
        description: 'Main project for managing team tasks'
      });
      
      const projectOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/projects',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': projectData.length,
          'Authorization': `Bearer ${token}`
        }
      };
      
      const projectReq = http.request(projectOptions, (projRes) => {
        let projBody = '';
        projRes.on('data', (chunk) => { projBody += chunk; });
        projRes.on('end', () => {
          console.log('Project Status:', projRes.statusCode);
          console.log('Project Response:', projBody);
        });
      });
      
      projectReq.on('error', (e) => console.error('Project Error:', e.message));
      projectReq.write(projectData);
      projectReq.end();
    }
  });
});

loginReq.on('error', (e) => console.error('Login Error:', e.message));
loginReq.write(loginData);
loginReq.end();
