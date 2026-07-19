const express = require("express");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/rooms — list all rooms with their current status.
// Public-readable so the booking site can show availability without login.
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, room_number, room_type, rate_per_night, status FROM rooms ORDER BY room_number"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch rooms" });
  }
});

// PATCH /api/rooms/:id/status — housekeeping/front-desk update room status.
// Requires a valid Firebase-authenticated staff account.
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["available", "occupied", "cleaning", "maintenance"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
  }

  try {
    await pool.query("UPDATE rooms SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update room status" });
  }
});

module.exports = router;
