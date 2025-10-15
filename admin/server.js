import { createUser, getUserByUsername, selectAllStudents, connection, storeOTP, getOTPSecret, deleteOTP, createStudent, selectStudent } from './Admin-form/database.js';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pdfmake from 'pdfmake';
import speakeasy from 'speakeasy';
import { sendOTPEmail } from './emailService.js';
import path from 'path';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'resetpassword';

// Serve static files
app.use(express.static(join(__dirname, 'Admin-form')));
app.use(express.static(join(__dirname, 'pages')));
app.use(express.static(join(__dirname, '..', 'files')));
app.use(express.static(join(__dirname, '..', 'student')));  // Serve student directory for registration form
// Middleware for JSON parsing
app.use(express.json());

// ====================== AUTHENTICATION MIDDLEWARE ====================== //

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expired. Please login again.' 
        });
      }
      return res.status(403).json({ error: 'Invalid authentication token' });
    }
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
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



// ====================== AUTHENTICATION ROUTES ====================== //

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password: password ? '***' : 'NULL' });

    try {
        const user = await getUserByUsername(username);
        console.log('User found in database:', user);
        
        if (!user) {
            console.log('User not found for username:', username);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Comparing password...');
        const isPasswordValid = await bcrypt.compare(password, user.admin_password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // For admin and director roles, require OTP
        if (user.role_name === 'admin' || user.role_name === 'director') {
            console.log('OTP required for role:', user.role_name);
            
            const secret = speakeasy.generateSecret({ length: 20 });
            const otp = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32',
                step: 300
            });

            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await storeOTP(user.id, secret.base32, expiresAt);

            console.log('Generated OTP:', otp);
            console.log('Sending OTP to:', user.email);

            // ✅ FIX: ACTUALLY SEND THE OTP EMAIL
            try {
                await sendOTPEmail(user.email, otp);
                console.log('✅ OTP email sent successfully to:', user.email);
            } catch (emailError) {
                console.error('❌ Failed to send OTP email:', emailError);
                return res.status(500).json({ 
                    error: 'Failed to send OTP email',
                    debugOtp: otp // Return OTP for debugging
                });
            }

            const tempToken = jwt.sign(
                { 
                    userId: user.id,
                    username: user.admin_name,
                    role: user.role_name,
                    needsOTP: true
                },
                SECRET_KEY,
                { expiresIn: '10m' }
            );

            return res.json({ 
                message: 'OTP sent to email',
                tempToken,
                debugOtp: otp, // Remove in production
                user: {
                    id: user.id,
                    username: user.admin_name,
                    role: user.role_name
                }
            });
        }

        // For teachers, login directly
        const token = jwt.sign(
            { 
                userId: user.id,
                username: user.admin_name,
                role: user.role_name
            },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        console.log('Login successful for teacher:', user.admin_name);
        
        return res.json({
            token,
            redirectUrl: getRedirectUrl(user.role_name),
            user: {
                id: user.id,
                username: user.admin_name,
                role: user.role_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
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
app.post('/send-otp', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const secret = speakeasy.generateSecret({ length: 20 });
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
      step: 300
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await storeOTP(user.userId, secret.base32, expiresAt);

    await sendOTPEmail(user.email || 'rutjunior8@gmail.com', otp);

    res.json({ 
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const otpData = await getOTPSecret(user.userId);
    if (!otpData) {
      return res.status(400).json({ error: 'No active OTP found' });
    }

    const isValid = speakeasy.totp.verify({
      secret: otpData.otp_secret,
      encoding: 'base32',
      token: otp,
      window: 1,
      step: 300
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const token = jwt.sign(
      { 
        userId: user.userId,
        username: user.username,
        role: user.role 
      }, 
      SECRET_KEY, 
      { expiresIn: '8h' }
    );

    res.json({ 
      token,
      user: {
        id: user.userId,
        username: user.username,
        role: user.role
      },
      redirectUrl: user.role === 'admin' ? '/admin-dashboard' : '/dashboard'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/debug-otp', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const otpData = await getOTPSecret(user.userId);
    
    if (!otpData) {
      return res.status(400).json({ error: 'No active OTP found' });
    }

    const currentOtp = speakeasy.totp({
      secret: otpData.otp_secret,
      encoding: 'base32',
      step: 300
    });

    res.json({
      secret: otpData.otp_secret,
      currentOtp,
      time: new Date(),
      expiresAt: otpData.expires_at
    });

  } catch (error) {
    console.error('Debug OTP error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

app.post('/final-auth', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!user.needsOTP) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const otpData = await getOTPSecret(user.userId);
    if (!otpData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    const isValid = speakeasy.totp.verify({
      secret: otpData.otp_secret,
      encoding: 'base32',
      token: otp,
      step: 300,
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await deleteOTP(user.userId);

    const token = jwt.sign(
      { 
        userId: user.userId, 
        username: user.username,
        role: user.role
      }, 
      SECRET_KEY, 
      { expiresIn: '8h' }
    );

    res.json({ 
      token,
      user: {
        id: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in final auth:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

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
    const students = await selectAllStudents();
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Enhanced student search with three-name support
app.get('/students/search', authenticateToken, async (req, res) => {
  const query = req.query.q;

  try {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${query.trim()}%`;
    
    // Enhanced search that handles first, middle, and last names
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
        student_firstName LIKE ? OR
        student_middleName LIKE ? OR
        student_lastName LIKE ? OR
        CONCAT(student_firstName, ' ', student_lastName) LIKE ? OR
        CONCAT(student_firstName, ' ', student_middleName, ' ', student_lastName) LIKE ? OR
        CONCAT(student_firstName, ' ', COALESCE(student_middleName, ''), ' ', student_lastName) LIKE ?
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

// Get student by name (supports full names with middle names)
app.get('/student/:name', authenticateToken, async (req, res) => {
  const fullName = req.params.name;

  try {
    // Split the name into parts for more flexible searching
    const nameParts = fullName.trim().split(/\s+/);
    
    let query = `
      SELECT * FROM student 
      WHERE 
        CONCAT(student_firstName, ' ', student_lastName) = ? OR
        CONCAT(student_firstName, ' ', COALESCE(student_middleName, ''), ' ', student_lastName) LIKE ?
    `;
    let params = [fullName, `%${fullName}%`];

    // If we have multiple name parts, try different combinations
    if (nameParts.length >= 2) {
      query += ` OR (student_firstName = ? AND student_lastName = ?)`;
      params.push(nameParts[0], nameParts[nameParts.length - 1]);
    }

    // Also search by individual name parts
    nameParts.forEach(part => {
      query += ` OR student_firstName LIKE ? OR student_lastName LIKE ? OR student_middleName LIKE ?`;
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
// Update the student records endpoint
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
// Add this route to your backend (after the student search route)
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

// Add route to get available classes
// Get available classes from student table
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    const [classes] = await connection.query(
      `SELECT DISTINCT student_class 
       FROM student 
       WHERE student_class IS NOT NULL AND student_class != ''
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

// Get students by class from student table
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
// ====================== FAULT MANAGEMENT ROUTES ====================== //
// Add this to your backend routes
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

app.post('/register-teacher', authenticateToken, authorizeRole(['admin']), async (req, res) => {
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

// Director Dashboard Statistics
app.get('/api/director/dashboard-stats', authenticateToken, authorizeRole(['director', 'admin']), async (req, res) => {
  try {
    const [totalStudents] = await connection.query('SELECT COUNT(*) as total FROM student');
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
    `);

    // Class-wise statistics
    const [classStats] = await connection.query(`
      SELECT 
        student_class,
        COUNT(*) as student_count,
        AVG(student_conduct) as avg_conduct
      FROM student 
      GROUP BY student_class 
      ORDER BY avg_conduct DESC
    `);

    res.json({
      overview: {
        totalStudents: totalStudents[0].total,
        totalTeachers: totalTeachers[0].total,
        totalFaults: totalFaults[0].total,
        pendingRequests: pendingRequests[0].total,
        ...conductStats[0]
      },
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
      WHERE 1=1 ${classCondition}
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
        (SELECT AVG(student_conduct) FROM student) as avg_conduct_score
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

// All Students with Detailed Info
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
      WHERE 1=1
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

    // Get available classes for filter
    const [classes] = await connection.query(`
      SELECT DISTINCT student_class 
      FROM student 
      WHERE student_class IS NOT NULL AND student_class != ''
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

// ====================== HOME ROUTES ====================== //

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, "Admin-form", 'login.html'));
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

// ====================== SERVER START ====================== //

app.listen(5000, () => {
  console.log('Server running on port 5000');
  console.log('Main Application: http://localhost:5000');
  console.log('Student Registration: http://localhost:5000/signup.html');
  console.log('API Documentation:');
  console.log('  - Authentication: POST /login, POST /verify-otp');
  console.log('  - Student Registration: POST /register');
  console.log('  - Student Search: GET /students/search?q=name');
  console.log('  - Fault Management: POST /add-fault');
  console.log('  - Reports: GET /reports/daily, /reports/weekly, etc.');
});
