import api from './client';

export const updateProfile = (payload) => api.patch('/users/profile', payload).then((r) => r.data);
export const changePassword = (payload) => api.patch('/users/password', payload).then((r) => r.data);

export const uploadAvatar = (formData) =>
  api
    .post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);

// Absolute URL for an avatar image (served by the API, cacheable).
export const avatarUrl = (userId) => `${import.meta.env.VITE_API_URL || '/api/v1'}/users/${userId}/avatar`;
