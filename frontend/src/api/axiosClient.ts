import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('medtrack_access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medtrack_access_token');
      localStorage.removeItem('medtrack_user');
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (Array.isArray(response?.message)) {
      return response.message.join(', ');
    }

    return response?.message ?? response?.error ?? error.message;
  }

  return error instanceof Error ? error.message : 'Something went wrong';
}

export default axiosClient;
