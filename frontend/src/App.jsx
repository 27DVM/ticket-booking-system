import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import SeatSelection from "./pages/SeatSelection";
import MyBookings from "./pages/MyBookings";

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/events"
        element={<Events />}
      />
      <Route
        path="/events/:eventId"
        element={<EventDetails />}
      />
      <Route
        path="/shows/:showId/seats"
        element={<SeatSelection />}
      />
      <Route
        path="/my-bookings"
        element={<MyBookings />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default App;