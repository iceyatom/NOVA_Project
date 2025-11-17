const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 3000;

app.get("/", async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    await connection.query("SELECT 1");
    await connection.end();
    res.send("✅ AWS Connection Successful");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to connect to AWS database");
  }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
