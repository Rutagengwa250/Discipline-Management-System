import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
}).promise();

// Function to create a user (admin or teacher)
// Updated getUserByEmail to work with username
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

// Updated createUser function
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
// Function to select a student by name
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

// Function to add fault with points deducted
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

// Function to deduct conduct score
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
// OTP-related functions
export async function storeOTP(userId, secret, expiresAt) {
  // Convert expiresAt to MySQL DATETIME format
  const expiresAtFormatted = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
  
  try {
    // First ensure the user exists in users table
    await connection.query(
      'INSERT IGNORE INTO users (user_id) VALUES (?)',
      [userId]
    );

    // Delete any existing OTPs for this user
    await connection.query(
      'DELETE FROM user_otps WHERE user_id = ?',
      [userId]
    );
    
    // Store new OTP
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
export { connection };