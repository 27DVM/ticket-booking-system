import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvents } from "../api/events";

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await getEvents();

        const events = Array.isArray(data)
          ? data
          : data.events || [];

        const selectedEvent = events.find(
          (item) => item.id === eventId
        );

        if (!selectedEvent) {
          setError("Event not found.");
          return;
        }

        setEvent(selectedEvent);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.error ||
          "Unable to load event."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading event...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={() => navigate("/events")}
              className="text-blue-600 font-medium"
            >
              ← Back to Events
            </button>
          </div>
        </nav>

        <div className="flex items-center justify-center py-20">
          <div className="rounded-xl bg-red-100 px-6 py-4 text-red-700">
            {error}
          </div>
        </div>
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

          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Logout
          </button>

        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Back button */}
        <button
          onClick={() => navigate("/events")}
          className="mb-6 text-blue-600 font-medium hover:underline"
        >
          ← Back to Events
        </button>

        {/* Event information */}
        <div className="rounded-2xl bg-white shadow-sm p-8 mb-8">

          <div className="h-48 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-6">
            <span className="text-7xl">
              🎬
            </span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900">
            {event.title}
          </h2>

          <p className="mt-3 text-gray-600">
            {event.description}
          </p>

          {event.venue && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">
                📍 {event.venue.name}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {event.venue.address}
              </p>
            </div>
          )}

        </div>

        {/* Shows */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-5">
            Available Shows
          </h3>

          {event.shows?.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">
                No shows are currently available.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">

              {event.shows?.map((show) => {

                const date = new Date(show.dateTime);

                return (
                  <div
                    key={show.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-sm text-gray-500">
                          Date
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {date.toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Time
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {date.toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="mt-4">
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {show.status}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/shows/${show.id}/seats`)
                      }
                      className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      Choose Seats
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default EventDetails;