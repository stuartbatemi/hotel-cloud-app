const express = require("express");
const { pool } = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/invoices — finance/front-desk generates a bill for a reservation.
router.post("/", requireAuth, requireRole("front_desk", "finance", "management"), async (req, res) => {
  const { reservation_id, amount, payment_method } = req.body;
  if (!reservation_id || !amount) {
    return res.status(400).json({ error: "reservation_id and amount are required" });
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO invoices (reservation_id, amount, payment_method) VALUES ($1, $2, $3) RETURNING id",
      [reservation_id, amount, payment_method || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Could not create invoice" });
  }
});

// PATCH /api/invoices/:id/pay — mark an invoice as paid, with a payment reference.
router.patch("/:id/pay", requireAuth, requireRole("front_desk", "finance", "management"), async (req, res) => {
  const { payment_reference } = req.body;
  try {
    await pool.query(
      "UPDATE invoices SET paid = TRUE, payment_reference = $1 WHERE id = $2",
      [payment_reference || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update invoice" });
  }
});

// GET /api/invoices — finance/management view, most recent first.
router.get("/", requireAuth, requireRole("finance", "management"), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.id, i.amount, i.payment_method, i.payment_reference, i.paid, i.created_at,
             r.check_in, r.check_out, g.full_name AS guest_name
      FROM invoices i
      JOIN reservations r ON r.id = i.reservation_id
      JOIN guests g ON g.id = r.guest_id
      ORDER BY i.created_at DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch invoices" });
  }
});

module.exports = router;
