import axios from "axios";

export default axios.create({
  baseURL: "https://recyclingapi-265759442746.us-west2.run.app/", 
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false
});