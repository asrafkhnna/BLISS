import { Pool } from 'pg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    
    await pool.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
