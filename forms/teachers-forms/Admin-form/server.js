const { createAdmin, selectAdmin } = require('./database.js'); // Importing database functions
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv'); // Import dotenv to handle environment variables

dotenv.config(); // Load environment variables from .env file

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'resetpassword'; // Use environment variable for the secret key

app.use(express.static(path.join(__dirname)));  // Serve static files
app.use(express.static(path.join(__dirname, '..', '..', 'files')));  
app.use(express.json()); // Body parser middleware

// Registration route
app.post('/register', async (req, res) => {
  const { adminName, password } = req.body;

  try {
    if (!adminName || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Store the user in the database
    await createAdmin(adminName, password);

    res.json({ message: "Registration successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { adminName, password } = req.body;

  if (!adminName || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Get the user from the database by adminName name
    const user = await selectAdmin(adminName);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User from database:', user);
    console.log('Provided password:', password);
    console.log('Hashed password from database:', user.admin_password);

    const isPasswordCorrect = await bcrypt.compare(password, user.admin_password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ adminName: user.school_name }, SECRET_KEY, { expiresIn: '1h' });

    res.json({
      message: `Welcome, ${adminName}!`,
      token: token, 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Token authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(403).json({ error: 'Access denied' });
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user; 
    next(); 
  });
};

app.get('/profile', authenticateToken, (req, res) => {
  const adminName = req.user.adminName; 
  res.json({ adminName });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.listen(5000, () => console.log('Server running on port 5000'));
