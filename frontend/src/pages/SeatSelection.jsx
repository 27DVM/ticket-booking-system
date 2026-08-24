import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getShowSeats, holdSeats } from "../api/events";

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSeats = async () => {
      try {
        const data = await getShowSeats(showId);

        console.log("Seats API response:", data);

        const seatList = Array.isArray(data)
          ? data
          : data.seats || [];

        setSeats(seatList);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.error ||
          "Unable to load seats."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSeats();
  }, [showId]);

  const toggleSeat = (seat) => {
    // Don't allow selection of unavailable seats
    if (
      seat.status &&
      !["AVAILABLE", "available"].includes(seat.status)
    ) {
      return;
    }

    setSelectedSeats((current) => {
      const alreadySelected = current.some(
        (selected) => selected.id === seat.id
      );

      if (alreadySelected) {
        return current.filter(
          (selected) => selected.id !== seat.id
        );
      }

      return [...current, seat];
    });
  };

  const isSelected = (seatId) => {
    return selectedSeats.some(
      (seat) => seat.id === seatId
    );
  };
  const handleHoldSeats = async () => {
  if (selectedSeats.length === 0) {
    return;
  }

  try {
    setError("");

    const seatIds = selectedSeats.map((seat) => seat.id);

    console.log("Holding seats:", seatIds);

    const response = await holdSeats(showId, seatIds);

    console.log("Hold seats response:", response);

    // Refresh seats from backend
    const updatedSeats = await getShowSeats(showId);

    const seatList = Array.isArray(updatedSeats)
      ? updatedSeats
      : updatedSeats.seats || [];

    setSeats(seatList);
    setSelectedSeats([]);

    alert("Seats held successfully!");
  } catch (err) {
    console.error("Hold seats error:", err);

    setError(
      err.response?.data?.error ||
      "Unable to hold seats."
    );
  }
};
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading seats...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">

          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 font-medium hover:underline"
          >
            ← Back
          </button>

        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold text-gray-900">
          Select Your Seats
        </h1>

        <p className="mt-2 text-gray-600">
          Choose the seats you want to book.
        </p>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-6 rounded-xl bg-white p-5 shadow-sm">

          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gray-200 border" />
            <span className="text-sm text-gray-600">
              Available
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-600" />
            <span className="text-sm text-gray-600">
              Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-red-400" />
            <span className="text-sm text-gray-600">
              Unavailable
            </span>
          </div>

        </div>

        {/* Screen */}
        <div className="mt-10">

          <div className="mx-auto max-w-2xl rounded-t-[50%] bg-gray-800 py-3 text-center text-sm font-semibold text-white">
            SCREEN
          </div>

        </div>

        {/* Seats */}
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">

          {seats.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No seats found for this show.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">

              {seats.map((seat) => {

                const selected = isSelected(seat.id);

                const unavailable =
                  seat.status &&
                  !["AVAILABLE", "available"].includes(
                    seat.status
                  );

                let seatClass =
                  "h-10 w-10 rounded-lg text-xs font-semibold transition ";

                if (selected) {
                  seatClass +=
                    "bg-blue-600 text-white scale-105 ";
                } else if (unavailable) {
                  seatClass +=
                    "bg-red-400 text-white cursor-not-allowed ";
                } else {
                  seatClass +=
                    "bg-gray-200 text-gray-700 hover:bg-gray-300 ";
                }

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => toggleSeat(seat)}
                    className={seatClass}
                    title={`Seat ${seat.seatNumber || seat.number || seat.id}`}
                  >
                    {seat.seatNumber ||
                      seat.number ||
                      seat.label ||
                      "S"}
                  </button>
                );
              })}

            </div>
          )}

        </div>

        {/* Selection summary */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Selected Seats
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {selectedSeats.length === 0
                  ? "No seats selected"
                  : selectedSeats
                      .map(
                        (seat) =>
                          seat.seatNumber ||
                          seat.number ||
                          seat.label ||
                          seat.id
                      )
                      .join(", ")}
              </p>
            </div>

            <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={handleHoldSeats}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold disabled:bg-gray-300"
            >
                Hold Selected Seats
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}

export default SeatSelection;
