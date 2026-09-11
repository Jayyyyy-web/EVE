import api from './axios';

export const getEngines = () => api.get('/parts/engines').then((res) => res.data);
