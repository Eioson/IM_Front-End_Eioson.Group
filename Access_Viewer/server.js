const express = require('express');
const ADODB = require('node-adodb');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

const dbPath = path.join(__dirname, 'database.accdb');
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
let connection;

try {
  connection = ADODB.connect(connectionString);
} catch (err) {
  console.error('[CRITICAL] Failed to initialize DB Driver:', err);
}

// 1. Health & System Integrity Check Endpoint
app.get('/api/health-check', async (req, res) => {
  let logs = [];
  
  if (!fs.existsSync(dbPath)) {
    logs.push('CRITICAL: Access Database file (database.accdb) was not found in root.');
    return res.status(500).json({ status: 'ERROR', message: 'Database file missing!', logs });
  }
  logs.push('OK: Database file located.');

  try {
    // Replace 'YourTableName' with the actual table name inside your MS Access file!
    const testQuery = await connection.query('SELECT TOP 1 * FROM [GROUP 4-2.accdb]');
    logs.push('OK: Successfully connected and queried table structure.');

    return res.json({ status: 'HEALTHY', message: 'All integrity checks passed successfully.', logs });
  } catch (err) {
    console.error('[ERROR] Health Check Query Failed:', err.message);
    logs.push(`CRITICAL: Database query error: ${err.message}`);
    return res.status(500).json({ status: 'ERROR', message: 'Database query failed.', logs });
  }
});

// 2. Data Endpoint
app.get('/api/data', async (req, res) => {
  try {
    // Replace 'YourTableName' with the actual table name inside your MS Access file!
    const data = await connection.query('SELECT * FROM [GROUP 4-2.accdb]');
    res.json({ success: true, data });
  } catch (err) {
    console.error('[ERROR] Failed to fetch data:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));