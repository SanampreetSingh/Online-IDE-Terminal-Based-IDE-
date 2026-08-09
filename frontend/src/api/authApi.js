import axiosInstance from './axiosInstance';

export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

export const sendOtp = async (data) => {
  const response = await axiosInstance.post('/auth/send-otp', data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await axiosInstance.post('/auth/forgot-password', data);
  return response.data;
};

export const googleLogin = async (token) => {
  const response = await axiosInstance.post('/auth/google', { token });
  return response.data;
};

export const fetchMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};
