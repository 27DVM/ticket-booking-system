import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getShowSeats, holdSeats } from "../api/events";
import { confirmBooking } from "../api/bookings";
import { joinWaitlist } from "../api/waitlist";

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [heldSeatIds, setHeldSeatIds] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);

  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // FETCH SEATS
  // --------------------------------------------------

  const fetchSeats = async () => {
    try {
      setError("");

      const response = await getShowSeats(showId);

      console.log("Seats API response:", response);

      const seatList = Array.isArray(response)
        ? response
        : response.seats || [];

      setSeats(seatList);
    } catch (err) {
      console.error("Failed to load seats:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load seats. Please try again."
      );
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchSeats();
      } finally {
        setLoading(false);
      }
    };

    if (showId) {
      load();
    }
  }, [showId]);

  // --------------------------------------------------
  // SELECT / DESELECT SEAT
  // --------------------------------------------------

  const handleSeatClick = (seat) => {
    if (
      seat.status === "BOOKED" ||
      seat.status === "HELD" ||
      seat.status === "UNAVAILABLE"
    ) {
      return;
    }

    setSelectedSeats((previous) => {
      if (previous.includes(seat.id)) {
        return previous.filter((id) => id !== seat.id);
      }

      return [...previous, seat.id];
    });

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // HOLD SELECTED SEATS
  // --------------------------------------------------

  const handleHoldSeats = async () => {
    if (selectedSeats.length === 0) {
      return;
    }

    try {
      setHolding(true);
      setError("");
      setSuccess("");

      console.log("Holding seats:", selectedSeats);

      const response = await holdSeats(showId, selectedSeats);

      console.log("Hold seats response:", response);

      setHeldSeatIds(response.heldSeatIds || []);
      setHoldExpiresAt(response.holdExpiresAt || null);

      setSelectedSeats([]);

      await fetchSeats();

      setSuccess(
        "Seats held successfully. Complete your booking before the hold expires."
      );
    } catch (err) {
      console.error("Failed to hold seats:", err);

      setError(
        err.response?.data?.error ||
          "Unable to hold selected seats. Please try again."
      );
    } finally {
      setHolding(false);
    }
  };

  // --------------------------------------------------
  // CONFIRM BOOKING
  // --------------------------------------------------

  const handleConfirmBooking = async () => {
    if (heldSeatIds.length === 0) {
      return;
    }

    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      console.log("Confirming booking:", {
        showId,
        seatIds: heldSeatIds,
      });

      const response = await confirmBooking(showId, heldSeatIds);

      console.log("Booking confirmation response:", response);

      setBooking(response.booking);

      setHeldSeatIds([]);
      setHoldExpiresAt(null);

      await fetchSeats();

      setSuccess("Booking confirmed successfully!");
    } catch (err) {
      console.error("Failed to confirm booking:", err);

      setError(
        err.response?.data?.error ||
          "Unable to confirm booking. Please try again."
      );
    } finally {
      setConfirming(false);
    }
  };

  // --------------------------------------------------
  // JOIN WAITLIST
  // --------------------------------------------------

  const handleJoinWaitlist = async (categoryId, categoryName) => {
    if (!categoryId) {
      return;
    }

    try {
      setJoiningWaitlist(categoryId);
      setError("");
      setSuccess("");

      console.log("Joining waitlist:", {
        showId,
        categoryId,
      });

      const response = await joinWaitlist(showId, categoryId);

      console.log("Waitlist response:", response);

      setSuccess(
        `You have been added to the ${categoryName} waitlist.`
      );
    } catch (err) {
      console.error("Failed to join waitlist:", err);

      setError(
        err.response?.data?.error ||
          "Unable to join the waitlist. Please try again."
      );
    } finally {
      setJoiningWaitlist(null);
    }
  };

  // --------------------------------------------------
  // GROUP SEATS BY CATEGORY
  // --------------------------------------------------

  const categories = [];

  seats.forEach((seat) => {
    const categoryId = seat.categoryId;

    if (!categoryId) {
      return;
    }

    let category = categories.find(
      (item) => item.id === categoryId
    );

    if (!category) {
      category = {
        id: categoryId,
        name: seat.category?.name || "Seats",
        seats: [],
      };

      categories.push(category);
    }

    category.seats.push(seat);
  });

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">
          Loading seats...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Select Your Seats
          </h1>

          <p className="mt-2 text-gray-600">
            Choose your seats and continue to booking.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        {/* LEGEND */}

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Seat Status
          </h2>

          <div className="flex flex-wrap gap-6">

            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-gray-200" />
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
              <div className="h-5 w-5 rounded bg-yellow-400" />
              <span className="text-sm text-gray-600">
                Held
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-red-400" />
              <span className="text-sm text-gray-600">
                Booked
              </span>
            </div>

          </div>
        </div>

        {/* SCREEN */}

        <div className="mb-10">
          <div className="mx-auto max-w-3xl rounded-t-[50%] bg-gray-800 py-4 text-center text-sm font-bold tracking-widest text-white shadow">
            SCREEN
          </div>
        </div>

        {/* SEAT CATEGORIES */}

        {categories.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              No seats found for this show.
            </p>
          </div>
        ) : (
          <div className="space-y-8">

            {categories.map((category) => {

              const availableSeats = category.seats.filter(
                (seat) => seat.status === "AVAILABLE"
              );

              const hasAvailableSeats =
                availableSeats.length > 0;

              return (
                <div
                  key={category.id}
                  className="rounded-2xl bg-white p-8 shadow-sm"
                >

                  {/* CATEGORY HEADER */}

                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {category.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {availableSeats.length} available
                        {" "}out of{" "}
                        {category.seats.length} seats
                      </p>
                    </div>

                    {/* WAITLIST */}

                    {!hasAvailableSeats && (
                      <button
                        type="button"
                        onClick={() =>
                          handleJoinWaitlist(
                            category.id,
                            category.name
                          )
                        }
                        disabled={
                          joiningWaitlist === category.id
                        }
                        className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300"
                      >
                        {joiningWaitlist === category.id
                          ? "Joining..."
                          : "Join Waitlist"}
                      </button>
                    )}

                  </div>

                  {/* SEATS */}

                  <div className="flex flex-wrap justify-center gap-3">

                    {category.seats.map((seat) => {

                      const selected =
                        selectedSeats.includes(seat.id);

                      const unavailable =
                        seat.status === "BOOKED" ||
                        seat.status === "HELD" ||
                        seat.status === "UNAVAILABLE";

                      let seatClass =
                        "h-11 w-11 rounded-lg text-xs font-semibold transition ";

                      if (selected) {
                        seatClass +=
                          "bg-blue-600 text-white scale-105 shadow-md ";
                      } else if (
                        seat.status === "BOOKED"
                      ) {
                        seatClass +=
                          "bg-red-400 text-white cursor-not-allowed ";
                      } else if (
                        seat.status === "HELD"
                      ) {
                        seatClass +=
                          "bg-yellow-400 text-gray-900 cursor-not-allowed ";
                      } else if (
                        seat.status === "UNAVAILABLE"
                      ) {
                        seatClass +=
                          "bg-red-400 text-white cursor-not-allowed ";
                      } else {
                        seatClass +=
                          "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer ";
                      }

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={unavailable}
                          onClick={() =>
                            handleSeatClick(seat)
                          }
                          className={seatClass}
                          title={`${seat.label || `Seat ${seat.number}`}`}
                        >
                          {seat.label ||
                            seat.number ||
                            "S"}
                        </button>
                      );
                    })}

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* SELECTED SEATS */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Selected Seats
              </p>

              <p className="mt-1 font-semibold text-gray-900">

                {selectedSeats.length === 0
                  ? "No seats selected"
                  : seats
                      .filter((seat) =>
                        selectedSeats.includes(seat.id)
                      )
                      .map(
                        (seat) =>
                          seat.label ||
                          seat.number ||
                          seat.id
                      )
                      .join(", ")}

              </p>

            </div>

            <button
              type="button"
              onClick={handleHoldSeats}
              disabled={
                selectedSeats.length === 0 ||
                holding
              }
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {holding
                ? "Holding..."
                : "Hold Selected Seats"}
            </button>

          </div>

        </div>

        {/* HOLD INFORMATION */}

        {heldSeatIds.length > 0 && (
          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">

            <h2 className="text-lg font-bold text-yellow-900">
              Seats Held
            </h2>

            <p className="mt-2 text-sm text-yellow-800">
              Your selected seats are temporarily reserved
              for you.
            </p>

            {holdExpiresAt && (
              <p className="mt-2 text-sm font-semibold text-yellow-900">
                Hold expires at:{" "}
                {new Date(holdExpiresAt).toLocaleString()}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={confirming}
              className="mt-5 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
            >
              {confirming
                ? "Confirming..."
                : "Confirm Booking"}
            </button>

          </div>
        )}

        {/* BOOKING CONFIRMATION */}

        {booking && (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">

            <div className="text-center">

              <h2 className="text-2xl font-bold text-green-600">
                Booking Confirmed! 🎉
              </h2>

              <p className="mt-2 text-gray-600">
                Your seats have been successfully booked.
              </p>

            </div>

            <div className="mx-auto mt-8 max-w-md space-y-4">

              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-500">
                  Reference
                </span>

                <span className="font-semibold">
                  {booking.referenceCode}
                </span>
              </div>

              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-500">
                  Booking ID
                </span>

                <span className="max-w-[220px] break-all text-right font-semibold">
                  {booking.id}
                </span>
              </div>

              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-500">
                  Total Amount
                </span>

                <span className="font-semibold">
                  ₹{booking.totalAmount}
                </span>
              </div>

              <div className="flex justify-between pb-3">
                <span className="text-gray-500">
                  Seats
                </span>

                <span className="text-right font-semibold">
                  {booking.seats?.length || 0}
                </span>
              </div>

            </div>

            {/* QR CODE */}

            {booking.qrCode && (
              <div className="mt-8 text-center">

                <p className="mb-4 font-semibold text-gray-700">
                  Your Ticket QR Code
                </p>

                <img
                  src={booking.qrCode}
                  alt="Booking QR Code"
                  className="mx-auto h-56 w-56 rounded-lg border p-2"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Show this QR code when required.
                </p>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default SeatSelection;