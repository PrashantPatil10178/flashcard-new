import axios from "axios";

const api = axios.create({
  baseURL: "https://tools.easylearning.live",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
