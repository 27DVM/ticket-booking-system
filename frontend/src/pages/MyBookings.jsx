import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookings";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    try {
      const data = await getMyBookings();
      console.log("My bookings API response:", data);

      const bookingList = Array.isArray(data) ? data : data.bookings || [];
      setBookings(bookingList);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      await loadBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statusStyles = {
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1
            className="text-2xl font-bold text-gray-900 cursor-pointer"
            onClick={() => navigate("/events")}
          >
            Ticket Booking
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {JSON.parse(localStorage.getItem("user") || "{}").name}
            </span>

            <button
              onClick={() => navigate("/events")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Events
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Bookings</h2>
          <p className="mt-2 text-gray-600">
            View your booking history and manage upcoming bookings.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800">
              No bookings yet
            </h3>
            <p className="mt-2 text-gray-500">
              Browse events and book your first seat.
            </p>
            <button
              onClick={() => navigate("/events")}
              className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {booking.event?.title}
                    </h3>
                    {booking.event?.dateTime && (
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(booking.event.dateTime).toLocaleString(
                          "en-IN",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        )}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[booking.status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-gray-500">Reference</p>
                    <p className="font-medium text-gray-900">
                      {booking.referenceCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Seats</p>
                    <p className="font-medium text-gray-900">
                      {booking.seats?.map((s) => s.label).join(", ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">
                      {booking.seats?.[0]?.category || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium text-gray-900">
                      ₹{booking.totalAmount}
                    </p>
                  </div>
                </div>

                {booking.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId === booking.id
                      ? "Cancelling..."
                      : "Cancel Booking"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default MyBookings;