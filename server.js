import { createUser, getUserByUsername, selectAllStudents, connection ,storeOTP, getOTPSecret, deleteOTP } from './admin/Admin-form/database.js';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pdfmake from 'pdfmake';
import speakeasy from 'speakeasy';
import { sendOTPEmail } from './admin/emailService.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'resetpassword';

// Serve static files
app.use(express.static(join(__dirname, 'Admin')));
app.use(express.static(join(__dirname, 'Admin-form')));
app.use(express.static(join(__dirname, 'pages')));
app.use(express.static(join(__dirname, '..', 'files')));

// Middleware for JSON parsing
app.use(express.json());

// authMiddleware.js

const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  // Verify token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      
      // Specific error messages
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expired. Please login again.' 
        });
      }
      return res.status(403).json({ error: 'Invalid authentication token' });
    }
    
    // Attach user data to request
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



app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Find user in administrator table
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.admin_password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Ensure user exists in users table
    await connection.query(
      'INSERT IGNORE INTO users (user_id, username) VALUES (?, ?)',
      [user.id, user.admin_name]
    );

    // 4. Admin OTP flow
    if (user.role_name === 'admin') {
      const secret = speakeasy.generateSecret({ length: 20 });
      const otp = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
        step: 300 // 5 minutes
      });

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await storeOTP(user.id, secret.base32, expiresAt);

      await sendOTPEmail(user.email || 'rutjunior8@gmail.com', otp);

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
        message: 'OTP sent to admin email',
        tempToken,
        debugOtp: otp // Remove in production
      });
    }

    // 5. Regular user flow
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
      redirectUrl: user.role_name === 'teacher' ? '/teacher-dashboard' : '/dashboard',
      user: {
        id: user.id,
        username: user.admin_name,
        role: user.role_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
// Send OTP endpoint
app.post('/send-otp', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Generate new OTP using your existing functions
    const secret = speakeasy.generateSecret({ length: 20 });
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
      step: 300 // 5 minutes
    });

    // Store OTP with expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await storeOTP(user.userId, secret.base32, expiresAt);

    // Send OTP email
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

// Verify OTP endpoint
// server.js

app.post('/verify-otp', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user; // From middleware

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // Get OTP data from database
    const otpData = await getOTPSecret(user.userId);
    if (!otpData) {
      return res.status(400).json({ error: 'No active OTP found' });
    }

    // Verify OTP
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

    // Generate final token (different from tempToken)
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

// Debug OTP endpoint
app.get('/debug-otp', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    // Get OTP data using your existing function
    const otpData = await getOTPSecret(user.userId);
    
    if (!otpData) {
      return res.status(400).json({ error: 'No active OTP found' });
    }

    // Generate current valid OTP
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

// Authentication middleware

// Final authentication after OTP verification
app.post('/final-auth', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    // Check if this is the OTP verification step
    if (!user.needsOTP) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Get stored OTP secret
    const otpData = await getOTPSecret(user.userId);
    if (!otpData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    // Verify OTP
    const isValid = speakeasy.totp.verify({
      secret: otpData.otp_secret,
      encoding: 'base32',
      token: otp,
      step: 300, // 5 minutes
      window: 1 // Allow 1 step (5 minutes) before/after current time
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Delete the used OTP
    await deleteOTP(user.userId);

    // Generate final auth token
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
  
  // Teacher registration (admin only)
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
// Teacher registration (admin only)
app.post('/register-teacher', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(name, email, hashedPassword, 'teacher');
        res.status(201).json({ message: "Teacher registered successfully" });
    } catch (error) {
        console.error('Error registering teacher:', error);
        res.status(500).json({ error: "Teacher registration failed" });
    }
});
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
// Get student faults (add this to your server)
// Get all removal requests (for admin and teachers)
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

// Get single request details
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

// Submit new removal request
app.post('/api/removal-requests', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();
        
        const { studentId, faultType, faultDescription, pointsToRemove, reason } = req.body;
        const teacherId = req.user.userId;

        // Validation
        if (!studentId || !pointsToRemove || !reason) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields' 
            });
        }

        // Create fault record if needed
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

        // Create removal request
        const [request] = await conn.query(
            `INSERT INTO removal_requests 
             (student_id, requester_id, fault_id, points_deducted, reason, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [studentId, teacherId, faultId, pointsToRemove, reason]
        );

        await conn.commit();
        
        // Get student info for response
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
// Update request status (approve/reject)
// Update your admin approval endpoint in server.js
// Update your admin approval endpoint
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

        // Validate status
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid status' 
            });
        }

        // Get the request with student info
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

        // Update request status
        await conn.query(
            `UPDATE removal_requests 
             SET status = ?, 
                 resolved_by = ?, 
                 resolved_at = NOW(), 
                 admin_comment = ?
             WHERE id = ?`,
            [status, adminId, adminComment, requestId]
        );

        // If approved, update student points
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
        
        // Get updated request details
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
            SELECT r.*, 
                   CONCAT(s.student_firstName, ' ', s.student_lastName) as student_name,
                   s.student_class,
                   CONCAT(a.admin_name) as requester_name,
                   f.fault_description
            FROM removal_requests r
            JOIN student s ON r.student_id = s.id
            JOIN administrator a ON r.requester_id = a.id
            LEFT JOIN faults f ON r.fault_id = f.id
            WHERE 1=1`;
        
        const params = [];
        
        // Filter by status if provided
        if (req.query.status && req.query.status !== 'all') {
            query += ' AND r.status = ?';
            params.push(req.query.status);
        }
        
        // Teachers can only see their own requests
        if (req.user.role === 'teacher') {
            query += ' AND r.requester_id = ?';
            params.push(req.user.userId);
        }
        
        query += ' ORDER BY r.created_at DESC';
        
        const [requests] = await connection.query(query, params);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching removal requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
// Cancel request (teacher)
app.delete('/api/teacher/removal-requests/:id', 
  authenticateToken, 
  authorizeRole(['teacher']), 
  async (req, res) => {
    try {
        // First check if the request belongs to this teacher
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
app.get('/students', authenticateToken, async (req, res) => {
    try {
        const students = await selectAllStudents();
        res.json(students);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Endpoint to fetch a single student by name
app.get('/student/:name', authenticateToken, async (req, res) => {
    const fullName = req.params.name;
    const [firstName, lastName] = fullName.split(' ');

    try {
        const [rows] = await connection.query(
            'SELECT * FROM student WHERE (student_firstName = ? AND student_lastName = ?) OR (student_firstName = ? OR student_lastName = ?)',
            [firstName, lastName, fullName, fullName]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Endpoint to fetch search suggestions
app.get('/students/search', authenticateToken, async (req, res) => {
    const query = req.query.q;

    try {
        const [students] = await connection.query(
            'SELECT id, student_firstName, student_lastName, student_class FROM student WHERE CONCAT(student_firstName, " ", student_lastName) LIKE ? OR student_firstName LIKE ? OR student_lastName LIKE ? LIMIT 5',
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );

        res.json(students);
    } catch (err) {
        console.error('Error fetching search suggestions:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Add this to your routes (likely in your server.js or routes file)
app.get('/student/:id/records', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const query = `
    SELECT 
        f.id,
        f.fault_description AS description,
        f.points_deducted AS points,
        f.created_at
    FROM faults f
    WHERE f.student_id = ?
    ORDER BY f.created_at DESC
    `;
    
    const result = await connection.query(query, [studentId]);
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching student records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Endpoint to add fault and deduct conduct score
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

// Endpoint to fetch dashboard data
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

// Profile route
app.get('/profile', authenticateToken, (req, res) => {
    const adminName = req.user.adminName; 
    res.json({ adminName });
});

// Home route
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, "Admin-form", 'login.html'));
});

// Report Generation Functions
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
    // Validate dates
    if (!startDate || !endDate) {
        throw new Error('Both start and end dates are required');
    }
    
    let query = `SELECT 
        faults.student_id, 
        faults.fault_description, 
        faults.points_deducted,
        faults.created_at, 
        student.student_firstName, 
        student.student_lastName, 
        student.student_class 
    FROM faults 
    INNER JOIN student ON faults.student_id = student.id 
    WHERE DATE(faults.created_at) BETWEEN ? AND ?`;
    
    const params = [startDate, endDate];
    
    if (classFilter) {
        query += ' AND student.student_class = ?';
        params.push(classFilter);
    }

    const [rows] = await connection.query(query, params);
    
    return {
        cases: rows,
        totalCases: rows.length,
        totalPointsDeducted: rows.reduce((sum, row) => sum + (row.points_deducted || 0), 0),
        startDate: startDate,
        endDate: endDate,
        mostCommonOffense: getMostCommonOffense(rows)
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

// Report Endpoints
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
    const fonts = {
        Roboto: {
            normal: 'fonts/static/Roboto-Regular.ttf',
            bold: 'fonts/static/Roboto-Bold.ttf',
            italics: 'fonts/static/Roboto-Italic.ttf',
            bolditalics: 'fonts/static/Roboto-BoldItalic.ttf'
        }
    };

    const printer = new pdfmake(fonts);

    const docDefinition = {
        content: [
            { text: 'Discipline Management System Report', style: 'header' },
            { text: 'Fault Logs', style: 'subheader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', '*', 'auto', 'auto'],
                    body: [
                        ['Student ID', 'Student Name', 'Class', 'Fault Description', 'Points Deducted', 'Date'],
                        ...data.map(row => [
                            row.student_id,
                            `${row.student_firstName} ${row.student_lastName}`,
                            row.student_class,
                            row.fault_description,
                            row.points_deducted || 0,
                            new Date(row.created_at).toLocaleDateString()
                        ])
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            }
        }
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
            // Handle other report types (daily, weekly, monthly)
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

// ====================== PERMISSION MANAGEMENT ROUTES ====================== //

// Create new permission
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

        // Log the creation in history
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

// Get permissions with filtering and pagination
app.get('/api/permissions', authenticateToken, async (req, res) => {
    try {
        // Validate and parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Validate other filters
        const validFilters = ['all', 'active', 'pending', 'approved', 'denied'];
        const filter = validFilters.includes(req.query.filter) ? req.query.filter : 'all';
        const studentName = req.query.studentName || '';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Base query with parameterized values
        let query = `
            SELECT SQL_CALC_FOUND_ROWS 
                p.*, 
                CONCAT(p.student_name, ' (', p.student_class, ')') as student_info
            FROM permissions p 
            WHERE 1=1
        `;
        const params = [];

        // Add filter conditions
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

        // Add pagination (must be last)
        query += ' ORDER BY p.departure_time DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Execute query
        const [permissions] = await connection.query(query, params);
        
        // Get total count
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
// Get single permission
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

// Update permission status
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

        // Log the status change
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

// Record actual return time
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

        // Log the return time recording
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

// Generate permission slip PDF
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

// Start the server
app.listen(5000, () => console.log('Server running on port 5000'));