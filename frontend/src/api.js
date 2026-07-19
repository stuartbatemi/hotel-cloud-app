const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// devRole simulates a signed-in staff member's role while DEV_SKIP_AUTH=true
// on the backend. Once Firebase Auth is wired in (Phase 4), this is replaced
// by sending the real Firebase ID token instead.
let devRole = "front_desk";
export function setDevRole(role) {
  devRole = role;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-dev-role": devRole,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getRooms: () => request("/rooms"),
  updateRoomStatus: (id, status) =>
    request(`/rooms/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  createGuest: (guest) => request("/guests", { method: "POST", body: JSON.stringify(guest) }),

  getReservations: () => request("/reservations"),
  createReservation: (reservation) =>
    request("/reservations", { method: "POST", body: JSON.stringify(reservation) }),
  checkIn: (id) => request(`/reservations/${id}/check-in`, { method: "PATCH" }),
  checkOut: (id) => request(`/reservations/${id}/check-out`, { method: "PATCH" }),

  createInvoice: (invoice) => request("/invoices", { method: "POST", body: JSON.stringify(invoice) }),
  getInvoices: () => request("/invoices"),
};
