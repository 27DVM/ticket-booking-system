import apiClient from "./client";

export const joinWaitlist = async (showId, categoryId) => {
  const response = await apiClient.post(
    `/events/shows/${showId}/waitlist`,
    {
      categoryId,
    }
  );

  return response.data;
};

export const getMyWaitlist = async () => {
  const response = await apiClient.get("/events/waitlist/my");
  return response.data;
};

export const claimWaitlistOffer = async (waitlistId) => {
  const response = await apiClient.post(
    `/events/waitlist/${waitlistId}/claim`
  );

  return response.data;
};