import axios from "axios";
import type { AxiosInstance } from "axios";

console.log("arriver");

const api: AxiosInstance = axios.create({
  // baseURL: window.location.origin,
  baseURL: "http://localhost:8000/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

export default api;
