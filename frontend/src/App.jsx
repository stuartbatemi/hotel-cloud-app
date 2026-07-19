import { useState } from "react";
import BookingPage from "./pages/BookingPage";
import StaffDashboard from "./pages/StaffDashboard";

export default function App() {
  const [tab, setTab] = useState("booking");

  return (
    <div className="app">
      <header>
        <h1>Bahari Hotel</h1>
        <nav>
          <button className={tab === "booking" ? "active" : ""} onClick={() => setTab("booking")}>
            Guest Booking
          </button>
          <button className={tab === "staff" ? "active" : ""} onClick={() => setTab("staff")}>
            Staff Dashboard
          </button>
        </nav>
      </header>
      <main>
        {tab === "booking" ? <BookingPage /> : <StaffDashboard />}
      </main>
    </div>
  );
}
