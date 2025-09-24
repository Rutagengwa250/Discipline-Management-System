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

export const createAdmin = async (adminName, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await connection.query(`INSERT INTO administrator(admin_name, admin_password) VALUES (?, ?)`, [adminName, hashedPassword]);
    return user[0];
  } catch (error) {
    console.log(error);
  }
};

export const selectAdmin = async (adminName) => {
  try {
    const [rows] = await connection.query(`SELECT * FROM administrator WHERE admin_name = ?`, [adminName]);
    return rows[0];
  } catch (error) {
    console.log(error);
  }
};
