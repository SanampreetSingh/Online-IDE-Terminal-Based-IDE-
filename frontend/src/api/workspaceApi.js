import axiosInstance from './axiosInstance';

export const startWorkspace = async () => {
  const response = await axiosInstance.post('/workspace/start');
  return response.data;
};

export const stopWorkspace = async () => {
  const response = await axiosInstance.post('/workspace/stop');
  return response.data;
};

export const getWorkspaceStatus = async () => {
  const response = await axiosInstance.get('/workspace/status');
  return response.data;
};
