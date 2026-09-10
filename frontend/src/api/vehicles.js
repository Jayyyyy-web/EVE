import api from './axios';

export const getVehicles = () => api.get('/vehicles').then((res) => res.data);

export const getVehicle = (id) => api.get(`/vehicles/${id}`).then((res) => res.data);

export const createVehicle = (data) => api.post('/vehicles', data).then((res) => res.data);

export const updateVehicle = (id, data) =>
  api.put(`/vehicles/${id}`, data).then((res) => res.data);

export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`).then((res) => res.data);
