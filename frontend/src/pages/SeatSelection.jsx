import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getShowSeats, holdSeats } from "../api/events";
import { confirmBooking } from "../api/bookings";

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

  const [error, setError] = useState("");

  // --------------------------------------------------
  // FETCH SEATS
  // --------------------------------------------------

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    if (showId) {
      fetchSeats();
    }
  }, [showId]);

  // --------------------------------------------------
  // SELECT / DESELECT SEAT
  // --------------------------------------------------

  const handleSeatClick = (seat) => {
    // Do not allow already booked/unavailable seats
    if (
      seat.status === "BOOKED" ||
      seat.status === "HELD" ||
      seat.status === "UNAVAILABLE"
    ) {
      return;
    }

    setSelectedSeats((previous) => {
      const alreadySelected = previous.includes(seat.id);

      if (alreadySelected) {
        return previous.filter((id) => id !== seat.id);
      }

      return [...previous, seat.id];
    });

    setError("");
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

      console.log("Holding seats:", selectedSeats);

      const response = await holdSeats(showId, selectedSeats);

      console.log("Hold seats response:", response);

      setHeldSeatIds(response.heldSeatIds || []);
      setHoldExpiresAt(response.holdExpiresAt || null);

      setSelectedSeats([]);

      // Refresh seats so their current status is displayed
      const seatsResponse = await getShowSeats(showId);

      const seatList = Array.isArray(seatsResponse)
        ? seatsResponse
        : seatsResponse.seats || [];

      setSeats(seatList);
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

      console.log("Confirming booking:", {
        showId,
        seatIds: heldSeatIds,
      });

      const response = await confirmBooking(showId, heldSeatIds);

      console.log("Booking confirmation response:", response);

      // THIS IS THE IMPORTANT PART
      // Store the returned booking so the confirmation
      // section inside the return() gets displayed.
      setBooking(response.booking);

      setHeldSeatIds([]);
      setHoldExpiresAt(null);

      // Refresh seats after successful booking
      const seatsResponse = await getShowSeats(showId);

      const seatList = Array.isArray(seatsResponse)
        ? seatsResponse
        : seatsResponse.seats || [];

      setSeats(seatList);
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
      <div className="mx-auto max-w-5xl">

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>

        {/* PAGE HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Select Your Seats
          </h1>

          <p className="mt-1 text-gray-600">
            Choose the seats you want to book.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* LEGEND */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-6 text-sm">

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-gray-400 bg-white" />
              <span>Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-blue-600" />
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-red-500" />
              <span>Unavailable</span>
            </div>

          </div>
        </div>

        {/* SCREEN */}
        <div className="mb-8 flex justify-center">
          <div className="w-2/3 rounded-b-[50%] rounded-t-[50%] bg-gray-800 py-3 text-center text-xs font-semibold text-white">
            SCREEN
          </div>
        </div>

        {/* SEAT MAP */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">

            {seats.map((seat) => {

              const isSelected = selectedSeats.includes(seat.id);

              const isUnavailable =
                seat.status === "BOOKED" ||
                seat.status === "HELD" ||
                seat.status === "UNAVAILABLE";

              let seatClass =
                "bg-gray-200 text-gray-700 hover:bg-blue-100";

              if (isSelected) {
                seatClass =
                  "bg-blue-600 text-white";
              } else if (isUnavailable) {
                seatClass =
                  "cursor-not-allowed bg-red-400 text-white";
              }

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => handleSeatClick(seat)}
                  className={`h-10 rounded-lg text-xs font-semibold transition ${seatClass}`}
                  title={
                    isUnavailable
                      ? "Seat unavailable"
                      : `Seat ${seat.label}`
                  }
                >
                  {seat.label || "S"}
                </button>
              );
            })}

          </div>
        </div>

        {/* SELECTED SEATS / HOLD */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Selected Seats
              </p>

              {selectedSeats.length === 0 ? (
                <p className="mt-1 text-sm text-gray-700">
                  No seats selected
                </p>
              ) : (
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedSeats.length} seat(s) selected
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={
                selectedSeats.length === 0 || holding
              }
              onClick={handleHoldSeats}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {holding
                ? "Holding..."
                : "Hold Selected Seats"}
            </button>

          </div>

          {/* HELD SEATS */}
          {heldSeatIds.length > 0 && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">

              <p className="font-semibold text-blue-800">
                Seats Held Successfully
              </p>

              <p className="mt-1 text-sm text-blue-700">
                {heldSeatIds.length} seat(s) are currently held for you.
              </p>

              {holdExpiresAt && (
                <p className="mt-1 text-sm text-blue-700">
                  Hold expires at:{" "}
                  {new Date(holdExpiresAt).toLocaleTimeString()}
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={confirming}
                className="mt-4 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {confirming
                  ? "Confirming..."
                  : "Confirm Booking"}
              </button>

            </div>
          )}
        </div>

        {/* ==================================================
            BOOKING CONFIRMATION
            IMPORTANT: THIS IS INSIDE return()
            ================================================== */}

        {booking && (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg">

            <div className="text-center">

              {/* SUCCESS MESSAGE */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl text-green-600">
                  ✓
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-green-600">
                Booking Confirmed!
              </h2>

              <p className="mt-2 text-gray-600">
                Your seats have been successfully booked.
              </p>

              {/* BOOKING DETAILS */}
              <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-200 p-5">

                {/* REFERENCE */}
                <div className="flex items-center justify-between border-b pb-4">
                  <span className="text-gray-500">
                    Reference Code
                  </span>

                  <span className="font-bold text-gray-900">
                    {booking.referenceCode}
                  </span>
                </div>

                {/* BOOKING ID */}
                <div className="flex items-start justify-between border-b py-4">
                  <span className="text-gray-500">
                    Booking ID
                  </span>

                  <span className="ml-4 max-w-[220px] break-all text-right text-sm font-semibold text-gray-900">
                    {booking.id}
                  </span>
                </div>

                {/* TOTAL */}
                <div className="flex items-center justify-between border-b py-4">
                  <span className="text-gray-500">
                    Total Amount
                  </span>

                  <span className="font-bold text-gray-900">
                    ₹{booking.totalAmount}
                  </span>
                </div>

                {/* SEATS */}
                <div className="flex items-start justify-between pt-4">
                  <span className="text-gray-500">
                    Seats
                  </span>

                  <span className="ml-4 text-right font-semibold text-gray-900">
                    {booking.seats?.join(", ") || "N/A"}
                  </span>
                </div>

              </div>

              {/* QR CODE */}
              {booking.qrCode && (
                <div className="mt-8">

                  <p className="mb-4 text-lg font-semibold text-gray-800">
                    Your Ticket QR Code
                  </p>

                  <div className="flex justify-center">
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                      <img
                        src={booking.qrCode}
                        alt="Booking QR Code"
                        className="h-56 w-56"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    Show this QR code at the venue.
                  </p>

                </div>
              )}

              {/* BACK TO EVENTS */}
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="mt-8 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Back to Events
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SeatSelection;