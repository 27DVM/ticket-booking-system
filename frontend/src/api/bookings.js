import apiClient from "./client";

export const confirmBooking = async (showId, seatIds) => {
  const response = await apiClient.post("/bookings/confirm", {
    showId,
    seatIds,
  });

  return response.data;
};

export const getMyBookings = async () => {
  const response = await apiClient.get("/bookings/my-bookings");
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await apiClient.post(
    `/bookings/${bookingId}/cancel`
  );

  return response.data;
};