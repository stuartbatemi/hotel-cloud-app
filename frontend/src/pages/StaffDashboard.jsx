import { useEffect, useState } from "react";
import { api, setDevRole } from "../api";

// Until Phase 4 (Firebase Auth) is wired in, this dropdown stands in for
// "which staff member is signed in" so you can test role-based access
// (e.g. only finance/management can view invoices).
const ROLES = ["front_desk", "housekeeping", "finance", "management"];

export default function StaffDashboard() {
  const [role, setRole] = useState("front_desk");
  const [reservations, setReservations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setDevRole(role);
    loadReservations();
    if (role === "finance" || role === "management") loadInvoices();
    else setInvoices([]);
  }, [role]);

  async function loadReservations() {
    try {
      setReservations(await api.getReservations());
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function loadInvoices() {
    try {
      setInvoices(await api.getInvoices());
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function handleCheckIn(id) {
    try {
      await api.checkIn(id);
      loadReservations();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function handleCheckOut(id) {
    try {
      await api.checkOut(id);
      loadReservations();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function handleBill(reservationId, nights, rate) {
    try {
      await api.createInvoice({ reservation_id: reservationId, amount: nights * rate, payment_method: "mobile_money" });
      setMessage({ type: "success", text: "Invoice created." });
      if (role === "finance" || role === "management") loadInvoices();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <div className="card">
      <h2>Staff Dashboard</h2>
      <label>
        Signed in as (dev only — replaced by real Firebase sign-in later)
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      {message && <p className={message.type === "error" ? "msg-error" : "msg-success"}>{message.text}</p>}

      <h3>Reservations</h3>
      <table>
        <thead>
          <tr><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {reservations.map((r) => {
            const nights = Math.max(1, Math.round((new Date(r.check_out) - new Date(r.check_in)) / 86400000));
            return (
              <tr key={r.id}>
                <td>{r.guest_name}<br /><small>{r.guest_phone}</small></td>
                <td>{r.room_number} ({r.room_type})</td>
                <td>{r.check_in.slice(0, 10)}</td>
                <td>{r.check_out.slice(0, 10)}</td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td className="actions">
                  {r.status === "confirmed" && <button onClick={() => handleCheckIn(r.id)}>Check in</button>}
                  {r.status === "checked_in" && <button onClick={() => handleCheckOut(r.id)}>Check out</button>}
                  <button onClick={() => handleBill(r.id, nights, r.rate_per_night)}>Generate invoice</button>
                </td>
              </tr>
            );
          })}
          {reservations.length === 0 && <tr><td colSpan="6">No reservations yet.</td></tr>}
        </tbody>
      </table>

      {(role === "finance" || role === "management") && (
        <>
          <h3>Invoices</h3>
          <table>
            <thead><tr><th>Guest</th><th>Amount</th><th>Method</th><th>Paid</th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.guest_name}</td>
                  <td>{Number(inv.amount).toLocaleString()} TZS</td>
                  <td>{inv.payment_method || "—"}</td>
                  <td>{inv.paid ? "Yes" : "No"}</td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan="4">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
