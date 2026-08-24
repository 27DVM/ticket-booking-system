import apiClient from "./client";

export const getEvents = async () => {
  const response = await apiClient.get("/events");
  return response.data;
};

export const getShowSeats = async (showId) => {
  const response = await apiClient.get(`/events/shows/${showId}/seats`);
  return response.data;
};

export const holdSeats = async (showId, seatIds) => {
  const response = await apiClient.post(
    `/events/shows/${showId}/hold`,
    {
      seatIds,
    }
  );

  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await apiClient.post("/events", eventData);
  return response.data;
};

export const createShow = async (eventId, showData) => {
  const response = await apiClient.post(
    `/events/${eventId}/shows`,
    showData
  );

  return response.data;
};

export const getEventRevenue = async (eventId) => {
  const response = await apiClient.get(
    `/events/${eventId}/revenue`
  );

  return response.data;
};