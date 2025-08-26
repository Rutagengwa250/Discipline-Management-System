import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createPool({
  host: process.env.mysql_host,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  database: process.env.mysql_database,
}).promise();

export const createStudent = async (student_firstName,student_lastName ,className) => {
  try {
    const user = await connection.query(`INSERT INTO student(student_firstName,student_lastName, student_class) VALUES (?, ?,?)`, [student_firstName,student_lastName, className]);
    return user[0];
  } catch (error) {
    console.log(error);
  }
};

export const selectStudent = async (student_firstName, student_lastName, student_className) => {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM student WHERE student_firstName = ? AND student_lastName = ? AND student_class = ?`,
      [student_firstName, student_lastName, student_className]
    );
    return rows[0];  // This will return the first matching student or undefined if no match
  } catch (error) {
    console.log(error);
  }
};

