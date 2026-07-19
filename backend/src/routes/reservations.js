const express = require("express");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/reservations — staff view of all reservations, most recent first,
// joined with guest name and room number so the dashboard needs no extra calls.
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.check_in, r.check_out, r.status, r.booking_source,
             g.full_name AS guest_name, g.phone AS guest_phone,
             rm.room_number, rm.room_type, rm.rate_per_night
      FROM reservations r
      JOIN guests g ON g.id = r.guest_id
      JOIN rooms rm ON rm.id = r.room_id
      ORDER BY r.created_at DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch reservations" });
  }
});

// POST /api/reservations — create a booking.
// Rejects the request if the room is already booked for an overlapping date range,
// which is the double-booking problem the whole system exists to prevent.
router.post("/", async (req, res) => {
  const { guest_id, room_id, check_in, check_out, booking_source } = req.body;
  if (!guest_id || !room_id || !check_in || !check_out) {
    return res.status(400).json({ error: "guest_id, room_id, check_in and check_out are required" });
  }
  if (new Date(check_out) <= new Date(check_in)) {
    return res.status(400).json({ error: "check_out must be after check_in" });
  }

  try {
    const { rows: overlaps } = await pool.query(
      `SELECT id FROM reservations
       WHERE room_id = $1
         AND status IN ('confirmed','checked_in')
         AND check_in < $2 AND check_out > $3`,
      [room_id, check_out, check_in]
    );
    if (overlaps.length > 0) {
      return res.status(409).json({ error: "Room is already booked for those dates" });
    }

    const { rows } = await pool.query(
      "INSERT INTO reservations (guest_id, room_id, check_in, check_out, booking_source) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [guest_id, room_id, check_in, check_out, booking_source || "website"]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Could not create reservation" });
  }
});

// PATCH /api/reservations/:id/check-in — front-desk checks the guest in;
// flips the room to "occupied" in the same transaction.
router.patch("/:id/check-in", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT room_id FROM reservations WHERE id = $1", [req.params.id]);
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reservation not found" });
    }
    await client.query("UPDATE reservations SET status = 'checked_in' WHERE id = $1", [req.params.id]);
    await client.query("UPDATE rooms SET status = 'occupied' WHERE id = $1", [rows[0].room_id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Could not check in reservation" });
  } finally {
    client.release();
  }
});

// PATCH /api/reservations/:id/check-out — front-desk checks the guest out;
// flips the room to "cleaning" so housekeeping picks it up next.
router.patch("/:id/check-out", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT room_id FROM reservations WHERE id = $1", [req.params.id]);
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reservation not found" });
    }
    await client.query("UPDATE reservations SET status = 'checked_out' WHERE id = $1", [req.params.id]);
    await client.query("UPDATE rooms SET status = 'cleaning' WHERE id = $1", [rows[0].room_id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Could not check out reservation" });
  } finally {
    client.release();
  }
});

module.exports = router;
