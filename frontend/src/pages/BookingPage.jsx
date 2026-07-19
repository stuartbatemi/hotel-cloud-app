import { useEffect, useState } from "react";
import { api } from "../api";

export default function BookingPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    room_id: "", check_in: "", check_out: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      setRooms(await api.getRooms());
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const guest = await api.createGuest({
        full_name: form.full_name, email: form.email, phone: form.phone,
      });
      await api.createReservation({
        guest_id: guest.id,
        room_id: Number(form.room_id),
        check_in: form.check_in,
        check_out: form.check_out,
        booking_source: "website",
      });
      setMessage({ type: "success", text: "Booking confirmed! We look forward to hosting you." });
      setForm({ full_name: "", email: "", phone: "", room_id: "", check_in: "", check_out: "" });
      loadRooms();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Book a Room</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Full name
          <input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label>
          Room
          <select required value={form.room_id} onChange={(e) => update("room_id", e.target.value)}>
            <option value="">Select a room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id} disabled={r.status !== "available"}>
                {r.room_number} — {r.room_type} — {Number(r.rate_per_night).toLocaleString()} TZS/night
                {r.status !== "available" ? ` (${r.status})` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <label>
            Check-in
            <input type="date" required value={form.check_in} onChange={(e) => update("check_in", e.target.value)} />
          </label>
          <label>
            Check-out
            <input type="date" required value={form.check_out} onChange={(e) => update("check_out", e.target.value)} />
          </label>
        </div>
        <button type="submit" disabled={loading}>{loading ? "Booking..." : "Confirm booking"}</button>
      </form>
      {message && <p className={message.type === "error" ? "msg-error" : "msg-success"}>{message.text}</p>}

      <h3>Room availability</h3>
      <table>
        <thead><tr><th>Room</th><th>Type</th><th>Rate / night</th><th>Status</th></tr></thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id}>
              <td>{r.room_number}</td>
              <td>{r.room_type}</td>
              <td>{Number(r.rate_per_night).toLocaleString()} TZS</td>
              <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
