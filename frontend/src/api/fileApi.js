import axiosInstance from './axiosInstance';

export const getFileTree = async () => {
  const response = await axiosInstance.get('/files/tree');
  return response.data;
};

export const readFile = async (path) => {
  const response = await axiosInstance.get(`/files/read?path=${encodeURIComponent(path)}`);
  return response.data;
};

export const writeFile = async (path, content) => {
  const response = await axiosInstance.post('/files/write', { path, content });
  return response.data;
};

export const createEntry = async (path, type = 'file') => {
  const response = await axiosInstance.post('/files/create', { path, type });
  return response.data;
};

export const deleteEntry = async (path) => {
  const response = await axiosInstance.delete(`/files/delete?path=${encodeURIComponent(path)}`);
  return response.data;
};

export const renameEntry = async (oldPath, newPath) => {
  const response = await axiosInstance.put('/files/rename', { oldPath, newPath });
  return response.data;
};
