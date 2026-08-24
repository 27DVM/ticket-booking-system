import apiClient from "./client";

export const joinWaitlist = async (showId, categoryId) => {
  const response = await apiClient.post(
    `/waitlist/shows/${showId}/waitlist`,
    {
      categoryId,
    }
  );

  return response.data;
};