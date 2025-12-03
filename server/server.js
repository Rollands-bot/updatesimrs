// server.js
const express = require('express');
const app = express();
const db = require('./db'); // ini asumsi lo punya koneksi ke database

app.use(express.json());

// contoh route /transactions
app.get('/transactions', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT t.*, v.patient_id, v.doctor, v.created_at AS visit_created_at, p.name AS patient_name
      FROM transactions t
      JOIN visits v ON t.visit_id = v.id
      JOIN patients p ON v.id = v.patient_id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal fetch transaksi' });
  }
});

// contoh route /visits biar React lo jalan
app.get('/visits', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT v.*, p.name AS patient_name
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      ORDER BY v.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal fetch visits' });
  }
});

// server listen
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
