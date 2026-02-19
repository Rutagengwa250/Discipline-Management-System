import { createUser, getUserByUsername, selectAllStudents, connection, createStudent, selectStudent } from './Admin-form/database.js';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pdfmake from 'pdfmake';
import path from 'path';
import cors from 'cors';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'resetpassword';

// ====================== CORS CONFIGURATION ====================== //
app.use(cors({
  origin: true, // Allow all origins for mobile testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ====================== MIDDLEWARE ====================== //

// Mobile request logger
app.use((req, res, next) => {
  const isMobile = /mobile|android|iphone|ipad/i.test(req.headers['user-agent'] || '');
  if (isMobile) {
    console.log('📱 Mobile Request:', {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Serve static files with CORS headers
app.use(express.static(join(__dirname, 'Admin-form'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.static(join(__dirname, 'pages'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.static(join(__dirname, '..', 'files'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.static(join(__dirname, '..', 'student'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Middleware for JSON parsing
app.use(express.json());

// ====================== NETWORK TEST ENDPOINT ====================== //
app.get('/api/network-test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is reachable from mobile',
    clientInfo: {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    },
    serverInfo: {
      host: req.hostname,
      protocol: req.protocol,
      port: 5000
    }
  });
});

// ====================== AUTHENTICATION MIDDLEWARE ====================== //

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Debug logging for mobile requests
  const isMobile = /mobile|android|iphone|ipad/i.test(req.headers['user-agent'] || '');
  
  if (isMobile) {
    console.log('📱 Mobile Auth Debug:', {
      hasAuthHeader: !!authHeader,
      tokenLength: token ? token.length : 0,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });
  }

  if (!token) {
    return res.status(401).json({ 
      error: 'Authorization token required',
      details: 'No token provided in Authorization header'
    });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', {
        error: err.message,
        userAgent: req.headers['user-agent'],
        isMobile: isMobile
      });
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expired. Please login again.' 
        });
      }
      return res.status(403).json({ 
        error: 'Invalid authentication token',
        details: 'Token may be corrupted or malformed'
      });
    }
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    if (isMobile) {
      console.log('📱 Mobile User authenticated:', {
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role
      });
    }
    
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ====================== AUTHENTICATION ROUTES ====================== //

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt:', { username });
    
    try {
        const user = await getUserByUsername(username);
        
        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.admin_password);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('✅ Password valid for:', username);
        
        // Generate token directly for all users (no OTP required)
        const token = jwt.sign(
          { 
            userId: user.id,
            username: user.admin_name,
            role: user.role_name
          },
          SECRET_KEY,
          { expiresIn: '8h' }
        );

        return res.json({
          token,
          redirectUrl: getRedirectUrl(user.role_name),
          user: {
            id: user.id,
            username: user.admin_name,
            role: user.role_name,
            email: user.email
          }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            error: 'Login failed: ' + error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

function getRedirectUrl(role) {
    switch (role) {
        case 'teacher': return '/teacher-dashboard.html';
        case 'director': return '/director-dashboard.html';
        case 'admin': return '/profile-page.html';
        default: return '/dashboard.html';
    }
}



// ====================== STUDENT REGISTRATION ROUTES ====================== //

app.post('/register', async (req, res) => {
  const { student_firstName, student_middleName, student_lastName, className } = req.body;

  try {
    // Validation
    if (!student_firstName || !student_lastName || !className) {
      return res.status(400).json({ 
        error: 'First name, last name, and class are required' 
      });
    }

    // Validate name formats
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!nameRegex.test(student_firstName)) {
      return res.status(400).json({
        error: 'First name can only contain letters, spaces, hyphens, apostrophes, and periods'
      });
    }

    if (!nameRegex.test(student_lastName)) {
      return res.status(400).json({
        error: 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods'
      });
    }

    if (student_middleName && !nameRegex.test(student_middleName)) {
      return res.status(400).json({
        error: 'Middle name can only contain letters, spaces, hyphens, apostrophes, and periods'
      });
    }

    // Validate name lengths
    if (student_firstName.length < 2 || student_firstName.length > 50) {
      return res.status(400).json({
        error: 'First name must be between 2 and 50 characters'
      });
    }

    if (student_lastName.length < 2 || student_lastName.length > 50) {
      return res.status(400).json({
        error: 'Last name must be between 2 and 50 characters'
      });
    }

    if (student_middleName && student_middleName.length > 100) {
      return res.status(400).json({
        error: 'Middle name must be less than 100 characters'
      });
    }

    // Check if student already exists
    const existingStudent = await selectStudent(student_firstName, student_middleName, student_lastName, className);
    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Student already exists in this class' 
      });
    }

    // Store the user in the database
    await createStudent(student_firstName, student_middleName, student_lastName, className);
    
    console.log('New student registered:', { 
      student_firstName, 
      student_middleName: student_middleName || 'None', 
      student_lastName, 
      className 
    });
    
    res.status(201).json({ 
      message: "Student registered successfully!",
      student: {
        firstName: student_firstName,
        middleName: student_middleName,
        lastName: student_lastName,
        class: className
      }
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      error: 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Serve registration form
app.get('/signup.html', (req, res) => {
  res.sendFile(join(__dirname, '..', 'student', 'signup.html'));
});

// ====================== STUDENT MANAGEMENT ROUTES ====================== //

app.get('/students', authenticateToken, async (req, res) => {
  try {
    const isMobile = /mobile|android|iphone|ipad/i.test(req.headers['user-agent'] || '');
    
    if (isMobile) {
      console.log('📱 Mobile Student Fetch Request:', {
        userId: req.user.userId,
        role: req.user.role,
        userAgent: req.headers['user-agent']
      });
    }

    // Get all students and filter out graduated ones
    const allStudents = await selectAllStudents();
    const activeStudents = allStudents.filter(student => 
      student.student_class !== 'Graduated' && 
      student.student_class !== 'graduated'
    );
    
    if (isMobile) {
      console.log(`✅ Mobile Student Fetch Success: ${activeStudents.length} active students (filtered out ${allStudents.length - activeStudents.length} graduated students)`);
    }
    
    res.json(activeStudents);
  } catch (err) {
    const isMobile = /mobile|android|iphone|ipad/i.test(req.headers['user-agent'] || '');
    
    console.error('Error fetching students:', {
      error: err.message,
      userId: req.user?.userId,
      role: req.user?.role,
      isMobile: isMobile
    });
    
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      mobileFriendly: isMobile ? 'Failed to load student data. Please check your connection.' : undefined
    });
  }
});

// Enhanced student search with three-name support - EXCLUDES GRADUATED STUDENTS
app.get('/students/search', authenticateToken, async (req, res) => {
  const query = req.query.q;

  try {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${query.trim()}%`;
    
    // Enhanced search that handles first, middle, and last names - EXCLUDES GRADUATED STUDENTS
    const [students] = await connection.query(
      `SELECT 
        id, 
        student_firstName, 
        student_middleName,
        student_lastName, 
        student_class,
        student_conduct
      FROM student 
      WHERE 
        (student_firstName LIKE ? OR
        student_middleName LIKE ? OR
        student_lastName LIKE ? OR
        CONCAT(student_firstName, ' ', student_lastName) LIKE ? OR
        CONCAT(student_firstName, ' ', student_middleName, ' ', student_lastName) LIKE ? OR
        CONCAT(student_firstName, ' ', COALESCE(student_middleName, ''), ' ', student_lastName) LIKE ?)
        AND student_class != 'Graduated'
      ORDER BY 
        student_firstName, student_lastName
      LIMIT 10`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(students);
  } catch (err) {
    console.error('Error fetching search suggestions:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get student by name (supports full names with middle names) - EXCLUDES GRADUATED STUDENTS
app.get('/student/:name', authenticateToken, async (req, res) => {
  const fullName = req.params.name;

  try {
    // Split the name into parts for more flexible searching
    const nameParts = fullName.trim().split(/\s+/);
    
    let query = `
      SELECT * FROM student 
      WHERE 
        (CONCAT(student_firstName, ' ', student_lastName) = ? OR
        CONCAT(student_firstName, ' ', COALESCE(student_middleName, ''), ' ', student_lastName) LIKE ?)
        AND student_class != 'Graduated'
    `;
    let params = [fullName, `%${fullName}%`];

    // If we have multiple name parts, try different combinations
    if (nameParts.length >= 2) {
      query += ` OR (student_firstName = ? AND student_lastName = ? AND student_class != 'Graduated')`;
      params.push(nameParts[0], nameParts[nameParts.length - 1]);
    }

    // Also search by individual name parts
    nameParts.forEach(part => {
      query += ` OR (student_firstName LIKE ? AND student_class != 'Graduated') 
                OR (student_lastName LIKE ? AND student_class != 'Graduated') 
                OR (student_middleName LIKE ? AND student_class != 'Graduated')`;
      params.push(`%${part}%`, `%${part}%`, `%${part}%`);
    });

    const [rows] = await connection.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get student by ID
app.get('/student/:id/records', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const query = `
    SELECT 
        f.id,
        f.fault_description AS description,
        f.points_deducted AS points,
        f.created_at,
        COALESCE(rr.status, 'active') as removal_status,
        rr.admin_comment as rejection_reason
    FROM faults f
    LEFT JOIN removal_requests rr ON f.id = rr.fault_id
    WHERE f.student_id = ?
    ORDER BY f.created_at DESC
    `;
    
    const [result] = await connection.query(query, [studentId]);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students by class - EXCLUDES GRADUATED STUDENTS
app.get('/api/students/class/:className', authenticateToken, async (req, res) => {
  try {
    const className = req.params.className;
    
    const [students] = await connection.query(
      `SELECT 
        id, 
        student_firstName, 
        student_middleName,
        student_lastName, 
        student_class,
        student_conduct
      FROM student 
      WHERE student_class = ? 
        AND student_class != 'Graduated'
      ORDER BY student_firstName, student_lastName`,
      [className]
    );

    res.json(students);
  } catch (err) {
    console.error('Error fetching students by class:', err);
    res.status(500).json({ 
      error: 'Failed to fetch students',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get available classes - EXCLUDES GRADUATED CLASS
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    const [classes] = await connection.query(
      `SELECT DISTINCT student_class 
       FROM student 
       WHERE student_class IS NOT NULL 
         AND student_class != ''
         AND student_class != 'Graduated'
       ORDER BY student_class`
    );

    const classList = classes.map(c => c.student_class);
    res.json(classList);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ 
      error: 'Failed to fetch classes',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ====================== FAULT MANAGEMENT ROUTES ====================== //

app.post('/api/bulk-removal-requests', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();
        
        const { studentIds, faultType, faultDescription, pointsToRemove, reason } = req.body;
        const teacherId = req.user.userId;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Student IDs array is required' 
            });
        }

        if (studentIds.length > 50) {
            return res.status(400).json({ 
                success: false,
                error: 'Maximum 50 students allowed per bulk request' 
            });
        }

        if (!pointsToRemove || !reason) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields' 
            });
        }

        const results = [];
        
        for (const studentId of studentIds) {
            let faultId = null;
            
            if (faultType && faultType !== 'other') {
                const [faultResult] = await conn.query(
                    `INSERT INTO faults 
                     (student_id, fault_type, fault_description, points_deducted, created_by)
                     VALUES (?, ?, ?, ?, ?)`,
                    [studentId, faultType, faultDescription, pointsToRemove, teacherId]
                );
                faultId = faultResult.insertId;
            }

            const [request] = await conn.query(
                `INSERT INTO removal_requests 
                 (student_id, requester_id, fault_id, points_deducted, reason, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [studentId, teacherId, faultId, pointsToRemove, reason]
            );

            const [student] = await conn.query(
                `SELECT student_firstName, student_lastName FROM student WHERE id = ?`,
                [studentId]
            );

            results.push({
                id: request.insertId,
                student_firstName: student[0].student_firstName,
                student_lastName: student[0].student_lastName,
                fault_description: faultDescription,
                points_deducted: pointsToRemove,
                status: 'pending',
                created_at: new Date().toISOString()
            });
        }

        await conn.commit();
        
        res.status(201).json({ 
            success: true,
            message: `Bulk request submitted successfully for ${results.length} students`,
            requests: results
        });
    } catch (error) {
        await conn.rollback();
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit bulk request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        conn.release();
    }
});

app.post('/add-fault', authenticateToken, async (req, res) => {
  const { studentId, faultDescription, marksToDeduct } = req.body;

  try {
    await addFault(studentId, faultDescription, marksToDeduct);
    await deductConductScore(studentId, marksToDeduct);
    res.json({ message: "Fault logged and marks deducted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function addFault(studentId, faultDescription, marksToDeduct) {
  const query = `INSERT INTO faults 
                (student_id, fault_description, points_deducted) 
                VALUES (?, ?, ?)`;
  return connection.query(query, [studentId, faultDescription, marksToDeduct]);
}

async function deductConductScore(studentId, marks) {
  const selectQuery = `SELECT student_conduct FROM student WHERE id = ?`;
  const updateQuery = `UPDATE student SET student_conduct = ? WHERE id = ?`;

  const [rows] = await connection.query(selectQuery, [studentId]);
  const currentConductScore = rows[0].student_conduct;
  const newConductScore = currentConductScore - marks;

  return connection.query(updateQuery, [newConductScore, studentId]);
}

// ====================== REMOVAL REQUEST ROUTES ====================== //

app.get('/api/student-faults/:studentId', authenticateToken, async (req, res) => {
  try {
    const [faults] = await connection.query(
      `SELECT f.* 
       FROM faults f
       WHERE f.student_id = ?`,
      [req.params.studentId]
    );
    res.json(faults);
  } catch (error) {
    console.error('Error fetching student faults:', error);
    res.status(500).json({ error: 'Failed to fetch student faults' });
  }
});

app.post('/api/teacher/removal-requests', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { faultId, studentId, reason } = req.body;
    const requesterId = req.user.userId;
    
    await createRemovalRequest(faultId, studentId, requesterId, reason);
    
    res.json({ message: 'Removal request submitted for admin approval' });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

app.get('/api/teacher/removal-requests', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const [requests] = await connection.query(`
      SELECT r.*, 
             s.student_firstName, s.student_lastName,
             f.fault_description
      FROM removal_requests r
      JOIN student s ON r.student_id = s.id
      LEFT JOIN faults f ON r.fault_id = f.id
      WHERE r.requester_id = ?
      ORDER BY r.created_at DESC`,
      [req.user.userId]);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.get('/api/removal-requests/:id', authenticateToken, async (req, res) => {
  try {
    const [request] = await connection.query(`
      SELECT r.*, 
             s.student_firstName, s.student_lastName,
             s.student_class,
             a.admin_name as requester_name,
             f.fault_description, f.points_deducted, f.fault_type
      FROM removal_requests r
      JOIN student s ON r.student_id = s.id
      JOIN administrator a ON r.requester_id = a.id
      LEFT JOIN faults f ON r.fault_id = f.id
      WHERE r.id = ?`, 
      [req.params.id]);
    
    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(request[0]);
  } catch (error) {
    console.error('Error getting request details:', error);
    res.status(500).json({ 
      error: 'Failed to get request details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/fault-removal-requests/:id', authenticateToken, async (req, res) => {
  try {
    const [request] = await connection.query(`
      SELECT r.*, 
             s.student_firstName, s.student_lastName,
             a.admin_name as requester_name,
             f.fault_description, f.points_deducted, f.fault_type
      FROM removal_requests r
      JOIN student s ON r.student_id = s.id
      JOIN administrator a ON r.requester_id = a.id
      LEFT JOIN faults f ON r.fault_id = f.id
      WHERE r.id = ?`, 
      [req.params.id]);
    
    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(request[0]);
  } catch (error) {
    console.error('Error getting request details:', error);
    res.status(500).json({ error: 'Failed to get request details' });
  }
});

app.post('/api/removal-requests', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    
    const { studentId, faultType, faultDescription, pointsToRemove, reason } = req.body;
    const teacherId = req.user.userId;

    if (!studentId || !pointsToRemove || !reason) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    let faultId = null;
    if (faultType && faultType !== 'other') {
      const [faultResult] = await conn.query(
        `INSERT INTO faults 
         (student_id, fault_type, fault_description, points_deducted, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [studentId, faultType, faultDescription, pointsToRemove, teacherId]
      );
      faultId = faultResult.insertId;
    }

    const [request] = await conn.query(
      `INSERT INTO removal_requests 
       (student_id, requester_id, fault_id, points_deducted, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [studentId, teacherId, faultId, pointsToRemove, reason]
    );

    await conn.commit();
    
    const [student] = await conn.query(
      `SELECT student_firstName, student_lastName FROM student WHERE id = ?`,
      [studentId]
    );

    res.status(201).json({ 
      success: true,
      message: 'Request submitted successfully',
      request: {
        id: request.insertId,
        student_firstName: student[0].student_firstName,
        student_lastName: student[0].student_lastName,
        fault_description: faultDescription,
        points_deducted: pointsToRemove,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    conn.release();
  }
});

app.patch('/api/removal-requests/:id/status', 
  authenticateToken, 
  authorizeRole(['admin']), 
  async (req, res) => {
    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();
      
      const { status, adminComment } = req.body;
      const requestId = req.params.id;
      const adminId = req.user.userId;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid status' 
        });
      }

      const [request] = await conn.query(
        `SELECT r.*, s.student_conduct 
         FROM removal_requests r
         JOIN student s ON r.student_id = s.id
         WHERE r.id = ? FOR UPDATE`,
        [requestId]
      );

      if (request.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Request not found' 
        });
      }

      await conn.query(
        `UPDATE removal_requests 
         SET status = ?, 
             resolved_by = ?, 
             resolved_at = NOW(), 
             admin_comment = ?
         WHERE id = ?`,
        [status, adminId, adminComment, requestId]
      );

      if (status === 'approved') {
        const newConduct = request[0].student_conduct - request[0].points_deducted;
        
        await conn.query(
          `UPDATE student 
           SET student_conduct = GREATEST(0, ?)
           WHERE id = ?`,
          [newConduct, request[0].student_id]
        );
      }

      await conn.commit();
      
      const [updatedRequest] = await conn.query(
        `SELECT r.*, 
                CONCAT(s.student_firstName, ' ', s.student_lastName) as student_name,
                a.admin_name as admin_name
         FROM removal_requests r
         JOIN student s ON r.student_id = s.id
         JOIN administrator a ON r.resolved_by = a.id
         WHERE r.id = ?`,
        [requestId]
      );

      res.json({ 
        success: true,
        message: `Request ${status} successfully`,
        request: updatedRequest[0]
      });
    } catch (error) {
      await conn.rollback();
      console.error('Error updating request:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update request status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      conn.release();
    }
});

app.get('/api/removal-requests', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        rr.*, 
        s.student_firstName, 
        s.student_lastName, 
        s.student_class,
        a.admin_name as requester_name,
        f.fault_description,
        f.fault_type
      FROM removal_requests rr
      JOIN student s ON rr.student_id = s.id
      JOIN administrator a ON rr.requester_id = a.id
      LEFT JOIN faults f ON rr.fault_id = f.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by status if provided
    if (req.query.status && req.query.status !== 'all') {
      query += ' AND rr.status = ?';
      params.push(req.query.status);
    }
    
    // If user is teacher, only show their requests
    if (req.user.role === 'teacher') {
      query += ' AND rr.requester_id = ?';
      params.push(req.user.userId);
    }
    
    query += ' ORDER BY rr.created_at DESC';
    
    const [requests] = await connection.query(query, params);
    
    // Format the response to match frontend expectations
    const formattedRequests = requests.map(request => ({
      id: request.id,
      student_name: `${request.student_firstName} ${request.student_lastName}`,
      student_firstName: request.student_firstName,
      student_lastName: request.student_lastName,
      student_class: request.student_class,
      fault_description: request.fault_description || 'Direct points removal',
      fault_type: request.fault_type,
      points_deducted: request.points_deducted,
      status: request.status,
      reason: request.reason,
      admin_comment: request.admin_comment,
      created_at: request.created_at,
      requester_name: request.requester_name
    }));
    
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching removal requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.delete('/api/teacher/removal-requests/:id', 
  authenticateToken, 
  authorizeRole(['teacher']), 
  async (req, res) => {
    try {
      const [request] = await connection.query(
        `SELECT id FROM removal_requests 
         WHERE id = ? AND requester_id = ? AND status = 'pending'`,
        [req.params.id, req.user.userId]
      );
      
      if (request.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Request not found or cannot be canceled' 
        });
      }
      
      await connection.query(
        `DELETE FROM removal_requests WHERE id = ?`,
        [req.params.id]
      );
      
      res.json({ 
        success: true,
        message: 'Request canceled successfully' 
      });
    } catch (error) {
      console.error('Error canceling request:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to cancel request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// ====================== DASHBOARD & REPORTING ROUTES ====================== //

app.get('/dashboard-data', authenticateToken, async (req, res) => {
  try {
    const students = await selectAllStudents();

    const conductDistribution = {
      excellent: students.filter(s => s.student_conduct >= 32).length,
      good: students.filter(s => s.student_conduct >= 20 && s.student_conduct < 32).length,
      poor: students.filter(s => s.student_conduct < 20).length,
    };

    const topPerformers = students
      .sort((a, b) => b.student_conduct - a.student_conduct)
      .slice(0, 5)
      .map(s => ({
        name: `${s.student_firstName} ${s.student_lastName}`,
        class: s.student_class,
        conduct: s.student_conduct,
      }));

    const atRiskStudents = students
      .filter(s => s.student_conduct < 20)
      .map(s => ({
        name: `${s.student_firstName} ${s.student_lastName}`,
        class: s.student_class,
        conduct: s.student_conduct,
      }));

    res.json({ conductDistribution, topPerformers, atRiskStudents });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/profile', authenticateToken, (req, res) => {
  const adminName = req.user.adminName; 
  res.json({ adminName });
});

// ====================== TEACHER REGISTRATION ROUTES ====================== //

app.post('/register-teacher', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const { username, password } = req.body;
  
  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    await createUser(username, password, 'teacher');
    res.status(201).json({ message: "Teacher registered successfully" });
  } catch (error) {
    console.error('Error registering teacher:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    res.status(500).json({ error: "Teacher registration failed" });
  }
});

// ====================== PERMISSION MANAGEMENT ROUTES ====================== //

app.post('/api/permissions', authenticateToken, async (req, res) => {
  try {
    const {
      studentName,
      studentClass,
      permissionType,
      departureTime,
      returnTime,
      destination,
      reason,
      guardianInfo,
      status = 'pending'
    } = req.body;

    const [result] = await connection.query(
      `INSERT INTO permissions 
      (student_name, student_class, permission_type, departure_time, 
       return_time, destination, reason, guardian_info, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentName,
        studentClass,
        permissionType,
        departureTime,
        returnTime,
        destination,
        reason,
        guardianInfo,
        status,
        req.user.adminName
      ]
    );

    await connection.query(
      `INSERT INTO permission_history 
      (permission_id, changed_by, change_type, new_value)
      VALUES (?, ?, 'create', ?)`,
      [result.insertId, req.user.adminName, JSON.stringify(req.body)]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Permission created successfully'
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Failed to create permission' });
  }
});

app.get('/api/permissions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const validFilters = ['all', 'active', 'pending', 'approved', 'denied'];
    const filter = validFilters.includes(req.query.filter) ? req.query.filter : 'all';
    const studentName = req.query.studentName || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = `
      SELECT SQL_CALC_FOUND_ROWS 
        p.*, 
        CONCAT(p.student_name, ' (', p.student_class, ')') as student_info
      FROM permissions p 
      WHERE 1=1
    `;
    const params = [];

    if (filter === 'active') {
      query += ' AND p.status = "approved" AND p.return_time > NOW()';
    } else if (filter !== 'all') {
      query += ' AND p.status = ?';
      params.push(filter);
    }

    if (studentName) {
      query += ' AND p.student_name LIKE ?';
      params.push(`%${studentName}%`);
    }

    if (startDate && endDate) {
      query += ' AND DATE(p.departure_time) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY p.departure_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [permissions] = await connection.query(query, params);
    
    const [[{ total }]] = await connection.query('SELECT FOUND_ROWS() as total');
    
    res.json({
      success: true,
      data: permissions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch permissions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/permissions/:id', authenticateToken, async (req, res) => {
  try {
    const [permission] = await connection.query(
      `SELECT p.*, 
       CONCAT(p.student_name, ' (', p.student_class, ')') as student_info,
       (SELECT GROUP_CONCAT(CONCAT(h.changed_at, ' - ', h.changed_by, ': ', h.change_type) SEPARATOR '\n')
        FROM permission_history h WHERE h.permission_id = p.id) as history
       FROM permissions p WHERE p.id = ?`,
      [req.params.id]
    );

    if (!permission.length) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json(permission[0]);
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ error: 'Failed to fetch permission' });
  }
});

app.patch('/api/permissions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, reason } = req.body;

    const [current] = await connection.query(
      'SELECT status FROM permissions WHERE id = ?',
      [req.params.id]
    );

    if (!current.length) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await connection.query(
      'UPDATE permissions SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    await connection.query(
      `INSERT INTO permission_history 
      (permission_id, changed_by, change_type, old_value, new_value, change_reason)
      VALUES (?, ?, 'status_change', ?, ?, ?)`,
      [
        req.params.id,
        req.user.adminName,
        current[0].status,
        status,
        reason || 'No reason provided'
      ]
    );

    res.json({ message: 'Permission status updated successfully' });
  } catch (error) {
    console.error('Error updating permission status:', error);
    res.status(500).json({ error: 'Failed to update permission status' });
  }
});

app.patch('/api/permissions/:id/return', authenticateToken, async (req, res) => {
  try {
    const { actualReturnTime } = req.body;

    const [current] = await connection.query(
      'SELECT actual_return_time FROM permissions WHERE id = ?',
      [req.params.id]
    );

    await connection.query(
      'UPDATE permissions SET actual_return_time = ? WHERE id = ?',
      [actualReturnTime, req.params.id]
    );

    await connection.query(
      `INSERT INTO permission_history 
      (permission_id, changed_by, change_type, old_value, new_value)
      VALUES (?, ?, 'return_recorded', ?, ?)`,
      [
        req.params.id,
        req.user.adminName,
        current[0].actual_return_time || 'Not recorded',
        actualReturnTime
      ]
    );

    res.json({ message: 'Return time recorded successfully' });
  } catch (error) {
    console.error('Error recording return time:', error);
    res.status(500).json({ error: 'Failed to record return time' });
  }
});

// ====================== REPORT GENERATION ROUTES ====================== //

// Report Generation Functions
function getMostCommonOffense(cases) {
  if (!cases || cases.length === 0) return 'N/A';
  const offenses = cases.reduce((acc, curr) => {
    acc[curr.fault_description] = (acc[curr.fault_description] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(offenses).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
}

async function generateCustomReport(startDate, endDate, classFilter = null) {
  if (!startDate || !endDate) {
    throw new Error('Both start and end dates are required');
  }
  
  let query = `SELECT 
    f.student_id, 
    f.fault_description, 
    f.points_deducted,
    f.created_at, 
    s.student_firstName, 
    s.student_lastName, 
    s.student_class,
    COALESCE(rr.status, 'active') as request_status
  FROM faults f
  INNER JOIN student s ON f.student_id = s.id 
  LEFT JOIN removal_requests rr ON f.id = rr.fault_id
  WHERE DATE(f.created_at) BETWEEN ? AND ?
  AND (rr.status IS NULL OR rr.status != 'rejected')`;
  
  const params = [startDate, endDate];
  
  if (classFilter) {
    query += ' AND s.student_class = ?';
    params.push(classFilter);
  }

  const [rows] = await connection.query(query, params);
  
  // Filter out rejected faults in application layer as well
  const activeFaults = rows.filter(row => row.request_status !== 'rejected');
  
  return {
    cases: activeFaults,
    totalCases: activeFaults.length,
    totalPointsDeducted: activeFaults.reduce((sum, row) => sum + (row.points_deducted || 0), 0),
    startDate: startDate,
    endDate: endDate,
    mostCommonOffense: getMostCommonOffense(activeFaults)
  };
}

async function generateDailyReport(classFilter = null) {
  const today = new Date().toISOString().split('T')[0];
  return generateCustomReport(today, today, classFilter);
}

async function generateWeeklyReport(classFilter = null) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  return generateCustomReport(startDate, endDate, classFilter);
}

async function generateMonthlyReport(classFilter = null) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];
  
  return generateCustomReport(startDate, endDate, classFilter);
}

// Keep your existing route handlers the same
app.get('/reports/daily', authenticateToken, async (req, res) => {
  try {
    const classFilter = req.query.class || null;
    const reportData = await generateDailyReport(classFilter);
    res.json(reportData);
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

app.get('/reports/weekly', authenticateToken, async (req, res) => {
  try {
    const classFilter = req.query.class || null;
    const reportData = await generateWeeklyReport(classFilter);
    res.json(reportData);
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

app.get('/reports/monthly', authenticateToken, async (req, res) => {
  try {
    const classFilter = req.query.class || null;
    const reportData = await generateMonthlyReport(classFilter);
    res.json(reportData);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

app.get('/reports/custom', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, class: classFilter } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required' });
    }
    
    const reportData = await generateCustomReport(startDate, endDate, classFilter || null);
    res.json(reportData);
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

function generatePDF(data) {
  // Group data by student
  const groupedData = {};
  
  data.forEach(row => {
    const studentId = row.student_id;
    if (!groupedData[studentId]) {
      groupedData[studentId] = {
        student_id: studentId,
        student_firstName: row.student_firstName,
        student_lastName: row.student_lastName,
        student_class: row.student_class,
        faults: [],
        points: [],
        dates: []
      };
    }
    
    // Add fault details to the student's record
    groupedData[studentId].faults.push(row.fault_description || 'N/A');
    groupedData[studentId].points.push(row.points_deducted || 0);
    groupedData[studentId].dates.push(
      row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'
    );
  });

  // Convert grouped data to array
  const students = Object.values(groupedData);

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };

  const printer = new pdfmake(fonts);

  // Create table body with formatted content
  const tableBody = [
    [
      { text: 'Student ID', style: 'tableHeader' },
      { text: 'Student Name', style: 'tableHeader' },
      { text: 'Class', style: 'tableHeader' },
      { text: 'Fault Description', style: 'tableHeader' },
      { text: 'Total Points', style: 'tableHeader' },
      { text: 'Dates', style: 'tableHeader' }
    ]
  ];

  // Add student rows with formatted content
  students.forEach(student => {
    tableBody.push([
      student.student_id || 'N/A',
      `${student.student_firstName || ''} ${student.student_lastName || ''}`.trim(),
      student.student_class || 'N/A',
      {
        text: student.faults.map(fault => `• ${fault}`).join('\n'),
        style: 'faultCell'
      },
      {
        text: student.points.reduce((sum, point) => sum + point, 0).toString(),
        style: 'pointsCell'
      },
      {
        text: student.dates.join('\n'),
        style: 'dateCell'
      }
    ]);
  });

  const docDefinition = {
    content: [
      { text: 'Discipline Management System Report', style: 'header' },
      { text: `Generated on: ${new Date().toLocaleDateString()}`, style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', '*', 'auto', '*'],
          body: tableBody
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
        alignment: 'center'
      },
      subheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10],
        alignment: 'center'
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'white',
        fillColor: '#4361ee',
        margin: [2, 2, 2, 2],
        alignment: 'center'
      },
      faultCell: {
        fontSize: 8,
        margin: [2, 2, 2, 2]
      },
      pointsCell: {
        fontSize: 9,
        margin: [2, 2, 2, 2],
        alignment: 'center'
      },
      dateCell: {
        fontSize: 8,
        margin: [2, 2, 2, 2]
      }
    },
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 9
    },
    pageMargins: [15, 15, 15, 15]
  };

  return printer.createPdfKitDocument(docDefinition);
}

app.get('/reports/:type/pdf', authenticateToken, async (req, res) => {
  try {
    const type = req.params.type;
    const { startDate, endDate, class: classFilter } = req.query;
    
    let reportData;
    
    if (type === 'custom') {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Both startDate and endDate are required for custom reports' });
      }
      reportData = await generateCustomReport(startDate, endDate, classFilter || null);
    } else {
      const generator = {
        daily: generateDailyReport,
        weekly: generateWeeklyReport,
        monthly: generateMonthlyReport
      }[type];
      
      if (!generator) {
        return res.status(400).json({ error: 'Invalid report type' });
      }
      
      reportData = await generator(classFilter || null);
    }

    const pdfDoc = generatePDF(reportData.cases);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

app.get('/api/permissions/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const [permission] = await connection.query(
      'SELECT * FROM permissions WHERE id = ?',
      [req.params.id]
    );

    if (!permission.length) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    const fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Bold.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-BoldItalic.ttf'
      }
    };

    const printer = new pdfmake(fonts);

    const docDefinition = {
      content: [
        { text: 'PERMISSION SLIP', style: 'header' },
        { text: '\n' },
        {
          table: {
            widths: ['auto', '*'],
            body: [
              ['Student Name:', permission[0].student_name],
              ['Class:', permission[0].student_class],
              ['Permission Type:', permission[0].permission_type],
              ['Departure Time:', new Date(permission[0].departure_time).toLocaleString()],
              ['Expected Return:', new Date(permission[0].return_time).toLocaleString()],
              ['Destination:', permission[0].destination],
              ['Reason:', permission[0].reason],
              ['Status:', permission[0].status.toUpperCase()],
              ['Approved By:', permission[0].created_by]
            ]
          }
        },
        { text: '\n' },
        { text: 'Guardian/Parent Information:', style: 'subheader' },
        { text: permission[0].guardian_info || 'N/A' },
        { text: '\n\n' },
        { text: 'School Stamp/Seal:', style: 'subheader' },
        { text: '\n\n__________________________', alignment: 'right' },
        { text: 'Authorized Signature', alignment: 'right' }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=permission_${req.params.id}.pdf`);
    
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Director Dashboard Statistics - FIXED TO USE ONLY EXISTING COLUMNS
app.get('/api/director/dashboard-stats', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const [totalStudents] = await connection.query('SELECT COUNT(*) as total FROM student WHERE student_class != "Graduated"');
    const [totalTeachers] = await connection.query('SELECT COUNT(*) as total FROM administrator WHERE role_id IN (SELECT id FROM user_roles WHERE role_name = "teacher")');
    const [totalFaults] = await connection.query('SELECT COUNT(*) as total FROM faults WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const [pendingRequests] = await connection.query('SELECT COUNT(*) as total FROM removal_requests WHERE status = "pending"');

    const [conductStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN student_conduct >= 32 THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN student_conduct >= 20 AND student_conduct < 32 THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN student_conduct < 20 THEN 1 ELSE 0 END) as poor,
        AVG(student_conduct) as average_conduct
      FROM student
      WHERE student_class != 'Graduated'
    `);

    // Class-wise statistics
    const [classStats] = await connection.query(`
      SELECT 
        student_class,
        COUNT(*) as student_count,
        AVG(student_conduct) as avg_conduct
      FROM student 
      WHERE student_class != 'Graduated'
      GROUP BY student_class 
      ORDER BY avg_conduct DESC
    `);

    const overview = {
        totalStudents: totalStudents[0].total,
        totalTeachers: totalTeachers[0].total,
        totalFaults: totalFaults[0].total,
        pendingRequests: pendingRequests[0].total,
        ...conductStats[0]
      };

    // Backward compatible response shape:
    // - New: stats.overview.totalStudents
    // - Old dashboards: stats.totalStudents
    res.json({
      ...overview,
      overview,
      classStats: classStats
    });
  } catch (error) {
    console.error('Director dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Recent Activity for Director
app.get('/api/director/recent-activity', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const [recentFaults] = await connection.query(`
      SELECT 
        f.*,
        CONCAT(s.student_firstName, ' ', s.student_lastName) as student_name,
        s.student_class,
        a.admin_name as reported_by,
        DATE_FORMAT(f.created_at, '%Y-%m-%d %H:%i') as formatted_date
      FROM faults f
      JOIN student s ON f.student_id = s.id
      JOIN administrator a ON f.created_by = a.id
      WHERE s.student_class != 'Graduated'
      ORDER BY f.created_at DESC
      LIMIT 15
    `);

    const [recentRequests] = await connection.query(`
      SELECT 
        rr.*,
        CONCAT(s.student_firstName, ' ', s.student_lastName) as student_name,
        s.student_class,
        a.admin_name as requester_name,
        DATE_FORMAT(rr.created_at, '%Y-%m-%d %H:%i') as formatted_date,
        CASE 
          WHEN rr.status = 'approved' THEN 'success'
          WHEN rr.status = 'rejected' THEN 'danger'
          ELSE 'warning'
        END as status_type
      FROM removal_requests rr
      JOIN student s ON rr.student_id = s.id
      JOIN administrator a ON rr.requester_id = a.id
      WHERE s.student_class != 'Graduated'
      ORDER BY rr.created_at DESC
      LIMIT 15
    `);

    res.json({
      recentFaults,
      recentRequests
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Failed to load recent activity' });
  }
});

// Comprehensive Discipline Report
app.get('/api/director/discipline-report', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const { period = 'monthly', class: classFilter } = req.query;
    
    let dateCondition = '';
    switch (period) {
      case 'weekly':
        dateCondition = 'AND f.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'monthly':
        dateCondition = 'AND f.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'yearly':
        dateCondition = 'AND f.created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
        break;
    }

    let classCondition = '';
    const params = [];
    if (classFilter && classFilter !== 'all') {
      classCondition = 'AND s.student_class = ?';
      params.push(classFilter);
    }

    const [classReport] = await connection.query(`
      SELECT 
        s.student_class,
        COUNT(*) as total_students,
        AVG(s.student_conduct) as avg_conduct,
        COUNT(f.id) as total_faults,
        SUM(f.points_deducted) as total_points_lost,
        COUNT(DISTINCT f.student_id) as students_with_faults
      FROM student s
      LEFT JOIN faults f ON s.id = f.student_id ${dateCondition}
      WHERE s.student_class != 'Graduated' ${classCondition}
      GROUP BY s.student_class
      ORDER BY avg_conduct DESC
    `, params);

    // Top offenses
    const [topOffenses] = await connection.query(`
      SELECT 
        fault_description,
        COUNT(*) as occurrence_count,
        AVG(points_deducted) as avg_points
      FROM faults
      WHERE 1=1 ${dateCondition.replace('f.', '')}
      GROUP BY fault_description
      ORDER BY occurrence_count DESC
      LIMIT 10
    `);

    // Teacher activity
    const [teacherActivity] = await connection.query(`
      SELECT 
        a.admin_name,
        COUNT(f.id) as faults_logged,
        COUNT(rr.id) as removal_requests,
        AVG(f.points_deducted) as avg_points_per_fault
      FROM administrator a
      LEFT JOIN faults f ON a.id = f.created_by ${dateCondition}
      LEFT JOIN removal_requests rr ON a.id = rr.requester_id ${dateCondition.replace('f.', 'rr.')}
      WHERE a.role_id IN (SELECT id FROM user_roles WHERE role_name = 'teacher')
      GROUP BY a.id, a.admin_name
      ORDER BY faults_logged DESC
    `);

    res.json({
      classReport,
      topOffenses,
      teacherActivity,
      reportPeriod: period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Discipline report error:', error);
    res.status(500).json({ error: 'Failed to generate discipline report' });
  }
});

// Student Conduct Trends
app.get('/api/director/conduct-trends', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    let groupBy, interval;
    switch (period) {
      case 'daily':
        groupBy = 'DATE(f.created_at)';
        interval = '7 DAY';
        break;
      case 'weekly':
        groupBy = 'YEARWEEK(f.created_at)';
        interval = '12 WEEK';
        break;
      default: // monthly
        groupBy = 'DATE_FORMAT(f.created_at, "%Y-%m")';
        interval = '12 MONTH';
    }

    const [trends] = await connection.query(`
      SELECT 
        ${groupBy} as period,
        COUNT(f.id) as total_faults,
        SUM(f.points_deducted) as total_points_deducted,
        COUNT(DISTINCT f.student_id) as unique_students,
        (SELECT AVG(student_conduct) FROM student WHERE student_class != 'Graduated') as avg_conduct_score
      FROM faults f
      WHERE f.created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY period
      ORDER BY period ASC
    `);

    res.json({
      period,
      trends,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conduct trends error:', error);
    res.status(500).json({ error: 'Failed to load conduct trends' });
  }
});

// All Students with Detailed Info - EXCLUDES GRADUATED STUDENTS
app.get('/api/director/students', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const { class: className, page = 1, limit = 50, conduct = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        s.*,
        COUNT(f.id) as total_faults,
        COALESCE(SUM(f.points_deducted), 0) as total_points_lost,
        COUNT(rr.id) as removal_requests_count
      FROM student s
      LEFT JOIN faults f ON s.id = f.student_id
      LEFT JOIN removal_requests rr ON s.id = rr.student_id
      WHERE s.student_class != 'Graduated'
    `;

    const params = [];

    if (className && className !== 'all') {
      query += ' AND s.student_class = ?';
      params.push(className);
    }

    if (conduct !== 'all') {
      if (conduct === 'excellent') {
        query += ' AND s.student_conduct >= 32';
      } else if (conduct === 'good') {
        query += ' AND s.student_conduct >= 20 AND s.student_conduct < 32';
      } else if (conduct === 'poor') {
        query += ' AND s.student_conduct < 20';
      }
    }

    query += `
      GROUP BY s.id
      ORDER BY s.student_class, s.student_firstName, s.student_lastName
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [students] = await connection.query(query, params);

    // Get available classes for filter - EXCLUDES GRADUATED
    const [classes] = await connection.query(`
      SELECT DISTINCT student_class 
      FROM student 
      WHERE student_class IS NOT NULL 
        AND student_class != ''
        AND student_class != 'Graduated'
      ORDER BY student_class
    `);

    res.json({
      students,
      availableClasses: classes.map(c => c.student_class),
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: students.length
      }
    });
  } catch (error) {
    console.error('Error fetching students for director:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Student Detailed Profile
app.get('/api/director/students/:id', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const studentId = req.params.id;

    const [student] = await connection.query(`
      SELECT * FROM student WHERE id = ?
    `, [studentId]);

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [faults] = await connection.query(`
      SELECT 
        f.*,
        a.admin_name as reported_by,
        DATE_FORMAT(f.created_at, '%Y-%m-%d %H:%i') as formatted_date
      FROM faults f
      JOIN administrator a ON f.created_by = a.id
      WHERE f.student_id = ?
      ORDER BY f.created_at DESC
    `, [studentId]);

    const [removalRequests] = await connection.query(`
      SELECT 
        rr.*,
        a.admin_name as requester_name,
        DATE_FORMAT(rr.created_at, '%Y-%m-%d %H:%i') as formatted_date
      FROM removal_requests rr
      JOIN administrator a ON rr.requester_id = a.id
      WHERE rr.student_id = ?
      ORDER BY rr.created_at DESC
    `, [studentId]);

    res.json({
      student: student[0],
      faults,
      removalRequests
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// ====================== SERVE DIRECTOR DASHBOARD ====================== //

app.get('/director-dashboard.html', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'director-dashboard.html'));
});

// ===== SYSTEM SETTINGS & BACKUP ENDPOINTS =====

// Get system statistics - FIXED TO USE ONLY EXISTING COLUMNS
app.get('/api/director/system-stats', authenticateToken, authorizeRole(['director']), async (req, res) => {
  try {
    console.log('Fetching system stats...');
    
    // Get current term with fallback
    let currentTerm = { name: 'Term 1' };
    try {
      const [terms] = await connection.query(`
        SELECT * FROM terms WHERE status = 'active' ORDER BY start_date DESC LIMIT 1
      `);
      if (terms.length > 0) {
        currentTerm = terms[0];
      }
    } catch (termError) {
      console.log('Terms table not available, using default term');
    }

    // Get student statistics with safe queries - EXCLUDES GRADUATED
    let studentStats = { 
      total_students: 0, 
      promotable_students: 0, 
      repeat_students: 0, 
      graduating_students: 0 
    };
    
    try {
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total_students,
          SUM(CASE WHEN student_conduct >= 20 THEN 1 ELSE 0 END) as promotable_students,
          SUM(CASE WHEN student_conduct < 20 THEN 1 ELSE 0 END) as repeat_students,
          SUM(CASE WHEN student_class LIKE 'S6%' OR student_class = 'S6' THEN 1 ELSE 0 END) as graduating_students
        FROM student
        WHERE student_class != 'Graduated'
      `);
      if (stats.length > 0) {
        studentStats = stats[0];
      }
    } catch (studentError) {
      console.log('Error fetching student stats:', studentError.message);
    }

    // Get last backup with safe query
    let lastBackup = null;
    try {
      const [backups] = await connection.query(`
        SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1
      `);
      if (backups.length > 0) {
        lastBackup = new Date(backups[0].created_at).toLocaleDateString();
      }
    } catch (backupError) {
      console.log('Backups table not available');
    }

    // Count distinct classes safely - EXCLUDES GRADUATED
    let classCount = 0;
    try {
      const [classes] = await connection.query(`
        SELECT COUNT(DISTINCT student_class) as class_count FROM student 
        WHERE student_class != 'Graduated' AND student_class != ''
      `);
      if (classes.length > 0) {
        classCount = classes[0].class_count;
      }
    } catch (classError) {
      console.log('Error counting classes:', classError.message);
    }

    // Calculate next promotion date
    const nextPromotion = new Date();
    nextPromotion.setMonth(11); // December
    nextPromotion.setDate(15);

    res.json({
      current_term: currentTerm.name,
      total_students: studentStats.total_students || 0,
      promotable_students: studentStats.promotable_students || 0,
      repeat_students: studentStats.repeat_students || 0,
      graduating_students: studentStats.graduating_students || 0,
      new_classes: classCount,
      next_promotion: nextPromotion.toISOString().split('T')[0],
      last_backup: lastBackup || 'Never'
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system statistics',
      details: error.message 
    });
  }
});

// Reset conduct scores - FIXED TO USE ONLY EXISTING COLUMNS
app.post('/api/director/reset-conduct', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const { term_name, reset_date } = req.body;
    console.log('Resetting conduct for new term:', term_name);

    // 1. Check if we have an active term to archive
    let archivedTermId = null;
    try {
      const [activeTerms] = await conn.query(`SELECT id FROM terms WHERE status = 'active'`);
      if (activeTerms.length > 0) {
        await conn.query(`
          UPDATE terms 
          SET status = 'archived', end_date = ? 
          WHERE status = 'active'
        `, [reset_date]);
        
        // Get the archived term ID
        const [archived] = await conn.query(`
          SELECT id FROM terms WHERE status = 'archived' ORDER BY end_date DESC LIMIT 1
        `);
        if (archived.length > 0) {
          archivedTermId = archived[0].id;
        }
      }
    } catch (termError) {
      console.log('No active term to archive or terms table issue:', termError.message);
    }

    // 2. Create new term
    const [newTerm] = await conn.query(`
      INSERT INTO terms (name, start_date, status) 
      VALUES (?, ?, 'active')
    `, [term_name, reset_date]);

    const newTermId = newTerm.insertId;

    // 3. Archive current student conduct records if we have students and an archived term
    try {
      const [students] = await conn.query('SELECT id, student_conduct FROM student WHERE student_conduct IS NOT NULL AND student_class != "Graduated"');
      if (students.length > 0 && archivedTermId) {
        for (const student of students) {
          const [faultCount] = await conn.query('SELECT COUNT(*) as count FROM faults WHERE student_id = ?', [student.id]);
          
          await conn.query(`
            INSERT INTO student_conduct_history 
            (student_id, term_id, conduct_score, faults_count, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [
            student.id, 
            archivedTermId,
            student.student_conduct || 40.00,
            faultCount[0].count || 0
          ]);
        }
        console.log(`Archived conduct for ${students.length} students`);
      }
    } catch (archiveError) {
      console.log('Error archiving conduct records:', archiveError.message);
    }

    // 4. Reset all student conduct scores to 40 - ONLY ACTIVE STUDENTS
    await conn.query(`UPDATE student SET student_conduct = 40.00 WHERE student_class != 'Graduated'`);

    // 5. Archive and clear current faults if they exist
    try {
      const [faults] = await conn.query('SELECT COUNT(*) as count FROM faults');
      if (faults[0].count > 0) {
        await conn.query(`INSERT INTO faults_archive SELECT *, NULL, NOW() FROM faults`);
        await conn.query(`DELETE FROM faults`);
        console.log(`Archived and cleared ${faults[0].count} faults`);
      }
    } catch (faultError) {
      console.log('Error handling faults:', faultError.message);
    }

    await conn.commit();

    console.log('Term reset successfully');
    res.json({ 
      success: true, 
      message: 'Term reset successfully', 
      new_term_id: newTermId,
      students_updated: true
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error resetting conduct:', error);
    res.status(500).json({ 
      error: 'Failed to reset conduct scores',
      details: error.message 
    });
  } finally {
    conn.release();
  }
});

// Create backup - FIXED TO USE ONLY EXISTING COLUMNS
app.post('/api/director/create-backup', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const { backup_name, description } = req.body;
    console.log('Creating backup:', backup_name);

    const userId = req.user.userId;

    // Create backup record
    const [backup] = await conn.query(`
      INSERT INTO backups (name, description, created_by, created_at) 
      VALUES (?, ?, ?, NOW())
    `, [backup_name, description, userId]);

    const backupId = backup.insertId;

    // Backup students - ONLY ACTIVE STUDENTS
    try {
      const [students] = await conn.query('SELECT * FROM student WHERE student_class != "Graduated"');
      for (const student of students) {
        await conn.query(`
          INSERT INTO backup_students 
          (backup_id, student_id, student_firstName, student_middleName, student_lastName, 
           student_class, student_conduct, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [backupId, student.id, student.student_firstName, student.student_middleName, 
            student.student_lastName, student.student_class, student.student_conduct || 40.00]);
      }
      console.log(`Backed up ${students.length} students`);
    } catch (studentError) {
      console.log('Error backing up students:', studentError.message);
    }

    await conn.commit();

    console.log('Backup created successfully with ID:', backupId);
    res.json({ 
      success: true, 
      message: 'Backup created successfully', 
      backup_id: backupId
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      error: 'Failed to create backup',
      details: error.message 
    });
  } finally {
    conn.release();
  }
});

// Get backups list
app.get('/api/director/backups', authenticateToken, authorizeRole(['director']), async (req, res) => {
  try {
    let backups = [];
    try {
      const [backupData] = await connection.query(`
        SELECT b.*, a.username as created_by_name
        FROM backups b
        LEFT JOIN administrator a ON b.created_by = a.id
        ORDER BY b.created_at DESC
      `);
      backups = backupData;
    } catch (backupError) {
      console.log('Error fetching backups:', backupError.message);
    }

    res.json({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch backups',
      details: error.message 
    });
  }
});

// Delete backup
app.delete('/api/director/backups/:id', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const backupId = req.params.id;

    // Delete backup and related records
    const [result] = await conn.query('DELETE FROM backups WHERE id = ?', [backupId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    await conn.commit();

    res.json({ 
      success: true, 
      message: 'Backup deleted successfully'
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error deleting backup:', error);
    res.status(500).json({ 
      error: 'Failed to delete backup',
      details: error.message 
    });
  } finally {
    conn.release();
  }
});

// Export backup to CSV
app.get('/api/director/export-backup/:id', authenticateToken, authorizeRole(['director']), async (req, res) => {
  try {
    const backupId = req.params.id;
    
    const [backupData] = await connection.query(`
      SELECT 
        b.name as backup_name,
        b.description,
        b.created_at,
        a.username as created_by,
        bs.student_firstName,
        bs.student_lastName,
        bs.student_class,
        bs.student_conduct
      FROM backups b
      LEFT JOIN administrator a ON b.created_by = a.id
      LEFT JOIN backup_students bs ON b.id = bs.backup_id
      WHERE b.id = ?
    `, [backupId]);

    if (backupData.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Create CSV data
    const headers = Object.keys(backupData[0]).join(',');
    const rows = backupData.map(row => 
      Object.values(row).map(field => 
        `"${String(field || '').replace(/"/g, '""')}"`
      ).join(',')
    );
    const csvData = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${backupId}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvData);

  } catch (error) {
    console.error('Error exporting backup:', error);
    res.status(500).json({ 
      error: 'Failed to export backup',
      details: error.message 
    });
  }
});

// Restore from backup
app.post('/api/director/restore-backup', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const { backup_id } = req.body;

    // Verify backup exists
    const [backup] = await conn.query('SELECT * FROM backups WHERE id = ?', [backup_id]);
    if (backup.length === 0) {
      throw new Error('Backup not found');
    }

    // Get backup student data
    const [backupStudents] = await conn.query(`
      SELECT * FROM backup_students WHERE backup_id = ?
    `, [backup_id]);

    // Restore students
    for (const student of backupStudents) {
      await conn.query(`
        INSERT INTO student (id, student_firstName, student_middleName, student_lastName, student_class, student_conduct)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          student_firstName = VALUES(student_firstName),
          student_middleName = VALUES(student_middleName),
          student_lastName = VALUES(student_lastName),
          student_class = VALUES(student_class),
          student_conduct = VALUES(student_conduct)
      `, [student.student_id, student.student_firstName, student.student_middleName,
          student.student_lastName, student.student_class, student.student_conduct]);
    }

    await conn.commit();

    res.json({ 
      success: true, 
      message: 'Backup restored successfully',
      students_restored: backupStudents.length
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error restoring backup:', error);
    res.status(500).json({ 
      error: 'Failed to restore backup',
      details: error.message 
    });
  } finally {
    conn.release();
  }
});

// Promote students endpoint - FIXED TO USE ONLY EXISTING COLUMNS
app.post('/api/director/promote-students', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const { academic_year, promotion_date, repeat_student_ids = [], promotion_data = {} } = req.body;
    console.log('Promoting students for academic year:', academic_year);
    console.log('Repeat student IDs:', repeat_student_ids);
    console.log('Promotion data received:', Object.keys(promotion_data).length, 'students');

    // 1. Archive current academic year data (optional)
    try {
      const [studentData] = await conn.query(`
        SELECT 
          COUNT(*) as student_count,
          AVG(student_conduct) as avg_conduct
        FROM student
        WHERE student_class != 'Graduated'
      `);

      await conn.query(`
        INSERT INTO academic_year_history 
        (academic_year, student_count, avg_conduct, promotion_date)
        VALUES (?, ?, ?, ?)
      `, [
        academic_year, 
        studentData[0].student_count, 
        studentData[0].avg_conduct || 40, 
        promotion_date
      ]);
    } catch (historyError) {
      console.log('Error creating academic year history:', historyError.message);
    }

    // 2. Process promotion based on frontend data
    const promotionResults = {
      promoted: 0,
      repeated: 0,
      graduated: 0,
      errors: 0
    };

    // Get all active students to process
    const [allStudents] = await conn.query('SELECT id, student_class FROM student WHERE student_class != "Graduated"');

    for (const student of allStudents) {
      const studentId = student.id;
      const studentData = promotion_data[studentId];
      
      try {
        if (studentData) {
          // Use the promotion data from frontend
          const { next_class, should_repeat, current_class } = studentData;
          
          if (should_repeat) {
            // Student repeats - reset conduct only
            await conn.query(`
              UPDATE student 
              SET student_conduct = 40
              WHERE id = ?
            `, [studentId]);
            promotionResults.repeated++;
            console.log(`Student ${studentId} repeating ${current_class}`);
            
          } else {
            // Student promotes/graduates - update class and reset conduct
            await conn.query(`
              UPDATE student 
              SET student_class = ?, student_conduct = 40
              WHERE id = ?
            `, [next_class, studentId]);
            
            if (next_class === 'Graduated') {
              promotionResults.graduated++;
              console.log(`Student ${studentId} graduated from ${current_class}`);
            } else {
              promotionResults.promoted++;
              console.log(`Student ${studentId} promoted from ${current_class} to ${next_class}`);
            }
          }
          
        } else {
          // Fallback: Use repeat_student_ids array (legacy support)
          const shouldRepeat = repeat_student_ids.includes(studentId);
          
          if (shouldRepeat) {
            // Student repeats
            await conn.query(`UPDATE student SET student_conduct = 40 WHERE id = ?`, [studentId]);
            promotionResults.repeated++;
          } else {
            // Student promotes - use backend logic as fallback
            let newClass = student.student_class;
            
            if (student.student_class === 'S1') newClass = 'S2';
            else if (student.student_class === 'S2') newClass = 'S3';
            else if (student.student_class === 'S3') newClass = 'S4';
            else if (student.student_class === 'S4') newClass = 'S5';
            else if (student.student_class.startsWith('S5')) {
              newClass = student.student_class.replace('S5', 'S6');
            } else if (student.student_class.startsWith('S6') || student.student_class === 'S3') {
              newClass = 'Graduated';
            }
            
            await conn.query(`UPDATE student SET student_class = ?, student_conduct = 40 WHERE id = ?`, [newClass, studentId]);
            
            if (newClass === 'Graduated') {
              promotionResults.graduated++;
            } else if (newClass !== student.student_class) {
              promotionResults.promoted++;
            } else {
              promotionResults.repeated++;
            }
          }
        }
      } catch (studentError) {
        console.error(`Error processing student ${studentId}:`, studentError);
        promotionResults.errors++;
      }
    }

    // 3. Handle graduated students - move to alumni
    try {
      const [graduatedStudents] = await conn.query(`
        SELECT s.* FROM student s 
        WHERE s.student_class = 'Graduated'
      `);

      for (const student of graduatedStudents) {
        const [existingAlumni] = await conn.query(`
          SELECT id FROM alumni_students WHERE student_id = ?
        `, [student.id]);

        if (existingAlumni.length === 0) {
          await conn.query(`
            INSERT INTO alumni_students 
            (student_id, student_firstName, student_middleName, student_lastName, student_class, student_conduct)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            student.id,
            student.student_firstName,
            student.student_middleName,
            student.student_lastName,
            student.student_class,
            student.student_conduct
          ]);
        }
      }
      console.log(`Processed ${graduatedStudents.length} graduated students`);
    } catch (graduationError) {
      console.log('Error handling graduated students:', graduationError.message);
    }

    await conn.commit();

    console.log('Student promotion completed successfully:', promotionResults);
    res.json({ 
      success: true, 
      message: 'Student promotion completed successfully',
      results: promotionResults
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error promoting students:', error);
    res.status(500).json({ 
      error: 'Failed to promote students',
      details: error.message 
    });
  } finally {
    conn.release();
  }
});

// ===== CURRENT TERM MANAGEMENT ENDPOINTS =====

// Get current term settings
app.get('/api/director/current-term', authenticateToken, authorizeRole(['director']), async (req, res) => {
  try {
    console.log('Fetching current term settings...');
    
    // Get current active term
    const [currentTerm] = await connection.query(`
      SELECT * FROM terms WHERE status = 'active' ORDER BY start_date DESC LIMIT 1
    `);

    if (currentTerm.length === 0) {
      // Create a default term if none exists
      const defaultTermName = 'Term 1';
      const defaultStartDate = new Date().toISOString().split('T')[0];
      const defaultEndDate = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0];
      
      const [newTerm] = await connection.query(`
        INSERT INTO terms (name, start_date, end_date, status) 
        VALUES (?, ?, ?, 'active')
      `, [defaultTermName, defaultStartDate, defaultEndDate]);

      return res.json({
        id: newTerm.insertId,
        name: defaultTermName,
        start_date: defaultStartDate,
        end_date: defaultEndDate,
        status: 'active',
        academic_year: new Date().getFullYear().toString(),
        created_at: new Date().toISOString()
      });
    }

    const term = currentTerm[0];
    const startDate = new Date(term.start_date);
    const academicYear = startDate.getFullYear().toString();

    res.json({
      ...term,
      academic_year: academicYear
    });

  } catch (error) {
    console.error('Error fetching current term:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current term',
      details: error.message 
    });
  }
});

// Update current term settings
app.put('/api/director/current-term', authenticateToken, authorizeRole(['director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const { term_name, academic_year, term_start, term_end } = req.body;
    console.log('Updating current term settings:', { term_name, academic_year, term_start, term_end });

    // Validate required fields
    if (!term_name || !term_start || !term_end) {
      return res.status(400).json({ 
        error: 'Missing required fields: term_name, term_start, term_end are required' 
      });
    }

    // Validate dates
    if (new Date(term_end) <= new Date(term_start)) {
      return res.status(400).json({ 
        error: 'Term end date must be after term start date' 
      });
    }

    // Get current active term
    const [currentTerm] = await conn.query(`
      SELECT id FROM terms WHERE status = 'active' ORDER BY start_date DESC LIMIT 1
    `);

    if (currentTerm.length === 0) {
      // Create new term if none exists
      const [newTerm] = await conn.query(`
        INSERT INTO terms (name, start_date, end_date, status) 
        VALUES (?, ?, ?, 'active')
      `, [term_name, term_start, term_end]);

      await conn.commit();
      
      return res.json({ 
        success: true, 
        message: 'Term created successfully',
        term: {
          id: newTerm.insertId,
          name: term_name,
          start_date: term_start,
          end_date: term_end,
          status: 'active',
          academic_year: academic_year
        }
      });
    }

    // Update existing term
    await conn.query(`
      UPDATE terms 
      SET name = ?, start_date = ?, end_date = ?
      WHERE status = 'active'
    `, [term_name, term_start, term_end]);

    await conn.commit();

    console.log('Term settings updated successfully');
    res.json({ 
      success: true, 
      message: 'Term settings updated successfully',
      term: {
        id: currentTerm[0].id,
        name: term_name,
        start_date: term_start,
        end_date: term_end,
        status: 'active',
        academic_year: academic_year
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error updating term settings:', error);
    res.status(500).json({ 
      error: 'Failed to update term settings',
      details: error.message 
    });
  } finally {
    conn.release();
  }
});
// Get all administrators
app.get('/api/director/admins', authenticateToken, authorizeRole(['director']), async (req, res) => {
    try {
        console.log('🔍 Fetching ADMIN role users only...');
        
        // Only get users with admin role (role_id = 1)
        const [admins] = await connection.query(`
            SELECT id, username, email, role_id, admin_name
            FROM administrator 
            WHERE role_id = 1  -- ONLY admin role
            ORDER BY username
        `);

        console.log('✅ Found ADMIN users:', admins);

        const adminsWithRoles = admins.map(admin => ({
            id: admin.id,
            username: admin.username,
            email: admin.email || 'No email',
            role: 'admin', // Always admin since we filtered by role_id = 1
            name: admin.admin_name || admin.username
        }));

        console.log('✅ Processed ADMIN users:', adminsWithRoles.length);
        res.json(adminsWithRoles);
        
    } catch (error) {
        console.error('❌ Error fetching admins:', error);
        res.json([]); // Return empty array on error
    }
});
// Get specific admin details
// Update admin credentials - ONLY FOR ADMIN ROLE (role_id = 1)
app.put('/api/director/admins/:id/credentials', authenticateToken, authorizeRole(['director']), async (req, res) => {
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();

        const adminId = req.params.id;
        const { username, email, password, update_reason } = req.body;
        const directorId = req.user.userId;

        console.log('🔄 Updating credentials for admin ID:', adminId);

        // Verify admin exists AND has admin role (role_id = 1)
        const [admin] = await conn.query(`
            SELECT * FROM administrator 
            WHERE id = ? AND role_id = 1
        `, [adminId]);
        
        if (admin.length === 0) {
            return res.status(404).json({ 
                error: 'Administrator not found or user is not an admin' 
            });
        }

        // Check if username already exists (excluding current admin)
        if (username !== admin[0].username) {
            const [existing] = await conn.query(
                'SELECT id FROM administrator WHERE username = ? AND id != ?',
                [username, adminId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }

        // Update admin credentials
        let updateQuery = 'UPDATE administrator SET username = ?, email = ?';
        const updateParams = [username, email];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', admin_password = ?';
            updateParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ? AND role_id = 1'; // Only update admin role
        updateParams.push(adminId);

        const [result] = await conn.query(updateQuery, updateParams);

        if (result.affectedRows === 0) {
            throw new Error('No administrator found with admin role');
        }

        // Log the credential change (optional - if table exists)
        try {
            await conn.query(`
                INSERT INTO admin_credential_history 
                (admin_id, changed_by, change_type, old_username, new_username, 
                 old_email, new_email, change_reason, changed_at)
                VALUES (?, ?, 'credential_update', ?, ?, ?, ?, ?, NOW())
            `, [
                adminId,
                directorId,
                admin[0].username,
                username,
                admin[0].email,
                email,
                update_reason || 'No reason provided'
            ]);
        } catch (logError) {
            console.log('Note: Could not log credential change:', logError.message);
        }

        await conn.commit();

        console.log('✅ Admin credentials updated successfully for ID:', adminId);
        res.json({
            success: true,
            message: 'Administrator credentials updated successfully',
            admin_id: adminId,
            new_username: username
        });

    } catch (error) {
        await conn.rollback();
        console.error('❌ Error updating admin credentials:', error);
        res.status(500).json({ 
            error: 'Failed to update administrator credentials',
            details: error.message 
        });
    } finally {
        conn.release();
    }
});
// Get specific admin details - SIMPLE VERSION (NO JOIN)
app.get('/api/director/admins/:id', authenticateToken, authorizeRole(['director']), async (req, res) => {
    try {
        const adminId = req.params.id;
        console.log('🔍 Fetching admin details for ID:', adminId);

        // SIMPLE query - no JOIN, no ambiguous columns
        const [admins] = await connection.query(`
            SELECT 
                id,
                username,
                email,
                role_id,
                admin_name
            FROM administrator 
            WHERE id = ?
        `, [adminId]);

        if (admins.length === 0) {
            console.log('❌ Admin not found with ID:', adminId);
            return res.status(404).json({ 
                error: 'Administrator not found' 
            });
        }

        const admin = admins[0];
        
        // Only allow admin role users (role_id = 1)
        if (admin.role_id !== 1) {
            console.log('❌ User is not an admin, role_id:', admin.role_id);
            return res.status(403).json({ 
                error: 'Only admin role users can have their credentials updated' 
            });
        }

        const adminDetails = {
            id: admin.id,
            username: admin.username,
            email: admin.email || 'No email',
            role: 'admin',
            name: admin.admin_name || admin.username,
            role_id: admin.role_id
        };

        console.log('✅ Admin details found:', adminDetails);
        res.json(adminDetails);

    } catch (error) {
        console.error('❌ Error fetching admin details:', error);
        res.status(500).json({ 
            error: 'Failed to fetch administrator details',
            details: error.message 
        });
    }
});

// Update admin credentials
app.put('/api/director/admins/:id/credentials', authenticateToken, authorizeRole(['director']), async (req, res) => {
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();

        const adminId = req.params.id;
        const { username, email, password, update_reason } = req.body;
        const directorId = req.user.userId;

        // Verify admin exists
        const [admin] = await conn.query('SELECT * FROM administrator WHERE id = ?', [adminId]);
        if (admin.length === 0) {
            return res.status(404).json({ error: 'Administrator not found' });
        }

        // Check if username already exists (excluding current admin)
        if (username !== admin[0].username) {
            const [existing] = await conn.query(
                'SELECT id FROM administrator WHERE username = ? AND id != ?',
                [username, adminId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }

        // Update admin credentials
        let updateQuery = 'UPDATE administrator SET username = ?, email = ?';
        const updateParams = [username, email];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', admin_password = ?';
            updateParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(adminId);

        await conn.query(updateQuery, updateParams);

        // Log the credential change
        await conn.query(`
            INSERT INTO admin_credential_history 
            (admin_id, changed_by, change_type, old_username, new_username, 
             old_email, new_email, change_reason, changed_at)
            VALUES (?, ?, 'credential_update', ?, ?, ?, ?, ?, NOW())
        `, [
            adminId,
            directorId,
            admin[0].username,
            username,
            admin[0].email,
            email,
            update_reason || 'No reason provided'
        ]);

        await conn.commit();

        res.json({
            success: true,
            message: 'Administrator credentials updated successfully',
            admin_id: adminId
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error updating admin credentials:', error);
        res.status(500).json({ error: 'Failed to update administrator credentials' });
    } finally {
        conn.release();
    }
});
// Director-specific expulsion endpoint (simplified)
app.post('/api/director/students/:id/expel', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const studentId = req.params.id;
    const { reason, details, expulsion_date, isGraduation = false } = req.body;
    const adminId = req.user.userId;

    console.log(`Processing ${isGraduation ? 'graduation' : 'expulsion'} for student ID: ${studentId}`);

    // Verify student exists and is not already graduated/expelled
    const [student] = await conn.query(
      'SELECT * FROM student WHERE id = ? AND student_class != "Graduated"',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found or already graduated/expelled' 
      });
    }

    // SIMPLE: Just update student class to "Graduated"
    await conn.query(
      'UPDATE student SET student_class = "Graduated" WHERE id = ?',
      [studentId]
    );

    // Log to console instead of database table
    console.log(`✅ Student expelled: ${student[0].student_firstName} ${student[0].student_lastName} (ID: ${studentId}) - Reason: ${reason}`);

    await conn.commit();

    res.json({
      success: true,
      message: `Student ${isGraduation ? 'graduated' : 'expelled'} successfully`,
      student: {
        id: studentId,
        name: `${student[0].student_firstName} ${student[0].student_lastName}`,
        previous_class: student[0].student_class,
        new_status: 'Graduated'
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('❌ Error expelling student:', error);
    res.status(500).json({ 
      success: false,
      error: `Failed to expel student`,
      details: error.message 
    });
  } finally {
    conn.release();
  }
});
// ====================== STUDENT EXPULSION/GRADUATION ENDPOINT ====================== //

app.post('/api/students/:id/expel', authenticateToken, authorizeRole(['admin', 'director']), async (req, res) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const studentId = req.params.id;
    const { reason, details, expulsion_date, isGraduation = false } = req.body;
    const adminId = req.user.userId;

    console.log(`Processing ${isGraduation ? 'graduation' : 'expulsion'} for student ID: ${studentId}`);

    // Verify student exists and is not already graduated/expelled
    const [student] = await conn.query(
      'SELECT * FROM student WHERE id = ? AND student_class != "Graduated"',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found or already graduated/expelled' 
      });
    }

    // SIMPLE: Just update student class to "Graduated" (this removes them from active lists)
    await conn.query(
      'UPDATE student SET student_class = "Graduated" WHERE id = ?',
      [studentId]
    );

    // NO HISTORY TABLE - Just log to console
    console.log(`✅ Student ${studentId} (${student[0].student_firstName} ${student[0].student_lastName}) ${isGraduation ? 'graduated' : 'expelled'}. Reason: ${reason}, Details: ${details}`);

    await conn.commit();

    res.json({
      success: true,
      message: `Student ${isGraduation ? 'graduated' : 'expelled'} successfully`,
      student: {
        id: studentId,
        name: `${student[0].student_firstName} ${student[0].student_lastName}`,
        previous_class: student[0].student_class,
        new_status: 'Graduated'
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('❌ Error expelling/graduating student:', error);
    res.status(500).json({ 
      success: false,
      error: `Failed to ${req.body.isGraduation ? 'graduate' : 'expel'} student`,
      details: error.message 
    });
  } finally {
    conn.release();
  }
});

// ====================== HOME ROUTES ====================== //

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, "Admin-form", 'login.html'));
});
// Add this route BEFORE the error handlers, near the other routes
app.get('/otp/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get OTP from your OTP storage (you need to implement this)
    // For now, we'll show a simple page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DMS OTP Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .otp-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 500px;
          }
          .otp-code {
            font-size: 48px;
            font-weight: bold;
            color: #2196F3;
            letter-spacing: 10px;
            margin: 20px 0;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
            border: 2px dashed #2196F3;
          }
          .timer {
            color: #ff9800;
            font-size: 20px;
            margin: 10px 0;
          }
          .note {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="otp-container">
          <h1>🔐 Your OTP Code</h1>
          <p>Enter this code in the login form</p>
          <div class="otp-code">Check server console</div>
          <div class="timer">⏰ Valid for 5 minutes</div>
          <p class="note">
            The OTP code is displayed in the server console.<br>
            Check your terminal where you ran "node server.js"
          </p>
          <p><a href="javascript:window.close()">Close this window</a></p>
        </div>
        <script>
          // Auto-refresh every 30 seconds
          setTimeout(() => location.reload(), 30000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`<h2>Error: ${error.message}</h2>`);
  }
});
// ====================== ERROR HANDLING ====================== //

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Add this to your server.js to debug routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// ====================== SERVER START ====================== //

// Helper function to get network IP
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const netInterface of interfaces[name]) {
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        return netInterface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  const networkIP = getNetworkIP();
  console.log('🚀 Server running successfully!');
  console.log('📍 Local Access:');
  console.log(`   http://localhost:${PORT}`);
  console.log('📍 Mobile Access:');
  console.log(`   http://${networkIP}:${PORT}`);
  console.log('📍 Student Registration:');
  console.log(`   http://${networkIP}:${PORT}/signup.html`);
  console.log('📍 Network Test:');
  console.log(`   http://${networkIP}:${PORT}/api/network-test`);
  console.log('📱 Mobile debugging enabled');
  console.log('🌐 CORS configured for all origins');
});

