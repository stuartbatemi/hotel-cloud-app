const express = require("express");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/guests — create a guest record (used when a booking is made,
// whether by the guest themself on the website or by front-desk for a walk-in).
router.post("/", async (req, res) => {
  const { full_name, email, phone, nationality, firebase_uid } = req.body;
  if (!full_name) {
    return res.status(400).json({ error: "full_name is required" });
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO guests (full_name, email, phone, nationality, firebase_uid) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [full_name, email || null, phone || null, nationality || null, firebase_uid || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Could not create guest" });
  }
});

// GET /api/guests — staff-only directory search, e.g. /api/guests?search=John
router.get("/", requireAuth, async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : "%";
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email, phone, nationality, created_at FROM guests WHERE full_name ILIKE $1 ORDER BY created_at DESC LIMIT 100",
      [search]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch guests" });
  }
});

module.exports = router;
