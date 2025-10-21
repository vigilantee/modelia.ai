import axios, { AxiosError } from "axios";
import type {
  AuthResponse,
  Generation,
  CreateGenerationRequest,
} from "../types";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", {
      email,
      password,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  async getMe(): Promise<{ user: any }> {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const generationService = {
  async create(
    data: CreateGenerationRequest
  ): Promise<{ generation: Generation }> {
    const formData = new FormData();
    formData.append("image", data.image);
    formData.append("prompt", data.prompt);

    const response = await api.post<{ generation: Generation }>(
      "/generations",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async getById(id: number): Promise<{ generation: Generation }> {
    const response = await api.get<{ generation: Generation }>(
      `/generations/${id}`
    );
    return response.data;
  },

  async getRecent(): Promise<{ generations: Generation[] }> {
    const response = await api.get<{ generations: Generation[] }>(
      "/generations/recent"
    );
    return response.data;
  },
};

export default api;
