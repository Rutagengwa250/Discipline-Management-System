import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createPool({
  host: process.env.mysql_host,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  database: process.env.mysql_database,
}).promise();

// ====================== USER MANAGEMENT FUNCTIONS ====================== //

export const getUserByUsername = async (username) => {
  try {
    const [rows] = await connection.query(
      `SELECT a.*, r.role_name 
       FROM administrator a
       LEFT JOIN user_roles r ON a.role_id = r.id
       WHERE a.admin_name = ?`,
      [username]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
};

export const createUser = async (username, password, roleName = 'teacher') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await connection.query(
      `INSERT INTO administrator (admin_name, admin_password, role_id)
       VALUES (?, ?, (SELECT id FROM user_roles WHERE role_name = ?))`,
      [username, hashedPassword, roleName]
    );
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// ====================== STUDENT MANAGEMENT FUNCTIONS ====================== //

// Create student with middle name support
export const createStudent = async (firstName, middleName, lastName, className) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO student (student_firstName, student_middleName, student_lastName, student_class, student_conduct)
       VALUES (?, ?, ?, ?, 40)`, // Default conduct score of 40
      [firstName, middleName || null, lastName, className]
    );
    return result;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

// Select student with middle name consideration
export const selectStudent = async (firstName, middleName, lastName, className) => {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM student 
       WHERE student_firstName = ? 
       AND (student_middleName = ? OR (student_middleName IS NULL AND ? IS NULL))
       AND student_lastName = ? 
       AND student_class = ?`,
      [firstName, middleName || null, middleName || null, lastName, className]
    );
    return rows[0];
  } catch (error) {
    console.error('Error selecting student:', error);
    throw error;
  }
};

// Function to select a student by name (legacy function)
export const selectStudentByName = async (name) => {
  try {
    const [rows] = await connection.query(
      'SELECT * FROM student WHERE student_firstName = ?',
      [name]
    );
    return rows[0];
  } catch (error) {
    console.error('Error selecting student:', error);
    throw error;
  }
};

// Function to fetch all students
export const selectAllStudents = async () => {
  try {
    const [rows] = await connection.query('SELECT * FROM student');
    return rows;
  } catch (error) {
    console.error('Error fetching all students:', error);
    throw error;
  }
};

// Search students across all name fields
export const searchStudents = async (query) => {
  try {
    const searchTerm = `%${query}%`;
    const [rows] = await connection.query(
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
    return rows;
  } catch (error) {
    console.error('Error searching students:', error);
    throw error;
  }
};

// Get student by full name
export const getStudentByName = async (fullName) => {
  try {
    const nameParts = fullName.trim().split(/\s+/);
    
    let query = `
      SELECT * FROM student 
      WHERE 
        CONCAT(student_firstName, ' ', student_lastName) = ? OR
        CONCAT(student_firstName, ' ', COALESCE(student_middleName, ''), ' ', student_lastName) LIKE ?
    `;
    let params = [fullName, `%${fullName}%`];

    if (nameParts.length >= 2) {
      query += ` OR (student_firstName = ? AND student_lastName = ?)`;
      params.push(nameParts[0], nameParts[nameParts.length - 1]);
    }

    nameParts.forEach(part => {
      query += ` OR student_firstName LIKE ? OR student_lastName LIKE ? OR student_middleName LIKE ?`;
      params.push(`%${part}%`, `%${part}%`, `%${part}%`);
    });

    const [rows] = await connection.query(query, params);
    return rows[0];
  } catch (error) {
    console.error('Error getting student by name:', error);
    throw error;
  }
};

// Get all students
export const getAllStudents = async () => {
  try {
    const [rows] = await connection.query('SELECT * FROM student ORDER BY student_firstName, student_lastName');
    return rows;
  } catch (error) {
    console.error('Error getting all students:', error);
    throw error;
  }
};

// ====================== FAULT MANAGEMENT FUNCTIONS ====================== //

export const addFault = async (studentId, faultDescription, pointsDeducted = 0, createdBy) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO faults (student_id, fault_description, points_deducted, created_by)
       VALUES (?, ?, ?, ?)`,
      [studentId, faultDescription, pointsDeducted, createdBy]
    );
    return result;
  } catch (error) {
    console.error('Error adding fault:', error);
    throw error;
  }
};

export const deductConductScore = async (studentId, points) => {
  try {
    const [rows] = await connection.query(
      `SELECT student_conduct FROM student WHERE id = ?`,
      [studentId]
    );
    const currentConductScore = rows[0].student_conduct;
    const newConductScore = currentConductScore - points;

    await connection.query(
      `UPDATE student SET student_conduct = ? WHERE id = ?`,
      [newConductScore, studentId]
    );
  } catch (error) {
    console.error('Error deducting conduct score:', error);
    throw error;
  }
};

// ====================== REMOVAL REQUEST FUNCTIONS ====================== //

export const createRemovalRequest = async (faultId, studentId, requesterId, reason) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO removal_requests
       (fault_id, student_id, requester_id, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [faultId, studentId, requesterId, reason]
    );
    return result;
  } catch (error) {
    console.error('Error creating removal request:', error);
    throw error;
  }
};

export const getRemovalRequests = async (status = null, requesterId = null) => {
  try {
    let query = `
      SELECT r.*, s.student_firstName, s.student_lastName, 
             f.fault_description, f.points_deducted
      FROM removal_requests r
      JOIN student s ON r.student_id = s.id
      JOIN faults f ON r.fault_id = f.id
      WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (requesterId) {
      query += ' AND r.requester_id = ?';
      params.push(requesterId);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error getting removal requests:', error);
    throw error;
  }
};

export const updateRemovalRequest = async (requestId, status, resolvedBy) => {
  try {
    await connection.query(
      'UPDATE removal_requests SET status = ?, resolved_by = ? WHERE id = ?',
      [status, resolvedBy, requestId]
    );

    if (status === 'approved') {
      const [request] = await connection.query(
        'SELECT fault_id FROM removal_requests WHERE id = ?',
        [requestId]
      );
      
      await connection.query(
        'DELETE FROM faults WHERE id = ?',
        [request[0].fault_id]
      );
    }
  } catch (error) {
    console.error('Error updating removal request:', error);
    throw error;
  }
};

// ====================== OTP MANAGEMENT FUNCTIONS ====================== //

export async function storeOTP(userId, secret, expiresAt) {
  const expiresAtFormatted = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
  
  try {
    await connection.query(
      'INSERT IGNORE INTO users (user_id) VALUES (?)',
      [userId]
    );

    await connection.query(
      'DELETE FROM user_otps WHERE user_id = ?',
      [userId]
    );
    
    await connection.query(
      'INSERT INTO user_otps (user_id, otp_secret, expires_at) VALUES (?, ?, ?)',
      [userId, secret, expiresAtFormatted]
    );
    
    console.log(`Stored OTP for user ${userId}`);
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
}

export const getOTPSecret = async (userId) => {
  try {
    const [rows] = await connection.query(
      `SELECT otp_secret, expires_at FROM user_otps WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching OTP secret:', error);
    throw error;
  }
};

export const deleteOTP = async (userId) => {
  try {
    await connection.query(
      `DELETE FROM user_otps WHERE user_id = ?`,
      [userId]
    );
  } catch (error) {
    console.error('Error deleting OTP:', error);
    throw error;
  }
};

// ====================== DATABASE CONNECTION ====================== //

export { connection };