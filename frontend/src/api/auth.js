import apiClient from "./client";

export const register = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

export const login = async (email, password) => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};