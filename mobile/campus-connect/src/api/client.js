import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Point this at your backend. On a physical device / Expo Go this must be
// your computer's LAN IP (not localhost), e.g. "http://192.168.1.20:3000".
// On Android emulator use "http://10.0.2.2:3000". On iOS simulator
// "http://localhost:3000" works fine.
const developmentHost = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || developmentHost).replace(/\/$/, "");

const TOKEN_KEY = "campus_connect_jwt";

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach the bearer token to every outgoing request.
client.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages so screens can just read err.message.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Something went wrong. Please try again.";
    const normalized = new Error(message);
    normalized.status = err.response?.status;
    normalized.code = err.response?.data?.error?.code;
    return Promise.reject(normalized);
  }
);

export default client;
