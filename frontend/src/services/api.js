import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    config.headers =
      config.headers || {};

    if (token) {
      if (
        typeof config.headers.set ===
        "function"
      ) {
        config.headers.set(
          "Authorization",
          `Bearer ${token}`
        );
      } else {
        config.headers.Authorization =
          `Bearer ${token}`;
      }

      console.log(
        "API AUTH:",
        config.method?.toUpperCase(),
        config.url,
        "TOKEN: YES"
      );
    } else {
      console.warn(
        "API AUTH:",
        config.method?.toUpperCase(),
        config.url,
        "TOKEN: NO"
      );

      if (
        typeof config.headers.delete ===
        "function"
      ) {
        config.headers.delete(
          "Authorization"
        );
      } else {
        delete config.headers.Authorization;
      }
    }

    if (
      config.data instanceof FormData
    ) {
      if (
        typeof config.headers.delete ===
        "function"
      ) {
        config.headers.delete(
          "Content-Type"
        );
      } else {
        delete config.headers["Content-Type"];
      }
    } else {
      if (
        typeof config.headers.set ===
        "function"
      ) {
        config.headers.set(
          "Content-Type",
          "application/json"
        );
      } else {
        config.headers["Content-Type"] =
          "application/json";
      }
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error?.response?.status;

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unknown API error";

    console.error(
      "API ERROR:",
      status,
      message
    );

    console.error(
      "API ERROR URL:",
      error?.config?.url
    );

    return Promise.reject(error);
  }
);

export default api;