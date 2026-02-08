import axios from "axios";


const api = axios.create({
  //baseURL: window.location.origin,
  baseURL: "http://localhost:80",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },

  withCredentials: true,
});

export default api;
