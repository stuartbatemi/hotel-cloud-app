require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pingDatabase } = require("./config/db");
const roomsRouter = require("./routes/rooms");
const guestsRouter = require("./routes/guests");
const reservationsRouter = require("./routes/reservations");
const invoicesRouter = require("./routes/invoices");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Health check — also confirms the database connection is alive.
// Visit this first after deploying, before wiring up the frontend.
app.get("/api/health", async (req, res) => {
  try {
    const dbOk = await pingDatabase();
    res.json({ status: "ok", database: dbOk ? "connected" : "unreachable" });
  } catch (err) {
    const detail = {
      message: err.message || null,
      code: err.code || null,
      name: err.name || null,
      nested: Array.isArray(err.errors)
        ? err.errors.map((e) => ({ message: e.message, code: e.code }))
        : undefined,
    };
    res.status(500).json({ status: "error", database: "unreachable", detail });
  }
});

app.use("/api/rooms", roomsRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/invoices", invoicesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Hotel backend listening on port ${PORT}`);
});
