import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "time_record",
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T = unknown>(sql: string, values?: unknown[]) {
  const [rows] = await pool.execute(sql, values);
  return rows as T;
}
