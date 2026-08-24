import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../api/events";

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();

        console.log("Events API response:", data);

        // Backend may return an array directly or inside "events"
        const eventList = Array.isArray(data)
          ? data
          : data.events || [];

        setEvents(eventList);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.error ||
          "Unable to load events."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading events...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <h1 className="text-2xl font-bold text-gray-900">
            Ticket Booking
          </h1>

          <div className="flex items-center gap-4">

            <span className="text-sm text-gray-600">
              {JSON.parse(localStorage.getItem("user") || "{}").name}
            </span>

            <button
              onClick={() => navigate("/my-bookings")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              My Bookings
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
      <main className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Discover Events
          </h2>

          <p className="mt-2 text-gray-600">
            Choose an event and select your seats.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800">
              No events available
            </h3>

            <p className="mt-2 text-gray-500">
              There are currently no events to display.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {events.map((event) => (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >

                <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-6xl">
                    🎟️
                  </span>
                </div>

                <div className="p-6">

                  <h3 className="text-xl font-bold text-gray-900">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {event.venue && (
                    <p className="mt-4 text-sm text-gray-600">
                      📍 {event.venue.name}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      navigate(`/events/${event.id}`)
                    }
                    className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    View Shows
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}

      </main>
    </div>
  );
}

export default Events;