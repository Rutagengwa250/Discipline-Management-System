import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createStudent, selectStudent } from './database.js'; // Importing database functions

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(__dirname));  // Serve static files
app.use(express.static(path.join(__dirname, '..', '..', 'files')));  
app.use(express.json()); // Body parser middleware

// Registration route
app.post('/register', async (req, res) => {
  const { student_firstName, student_lastName, className } = req.body;

  try {
    if (!student_firstName || !student_lastName || !className) {
      return res.status(400).json({ error: 'Names and className are required' });
    }
    // Check if student already exists
    const existingStudent = await selectStudent(student_firstName, student_lastName, className);
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Store the user in the database
    await createStudent(student_firstName, student_lastName, className);
    console.log('New student:', { student_firstName, student_lastName, className });
    res.json({ message: "Registration successful!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.listen(5000, () => console.log('Server running on port 5000'));
