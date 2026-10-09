import api from './client';

/* ---------- dashboard ---------- */
export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data);

// CSV downloads (cookie auth + blob) so the browser can save the file.
export const exportCsv = async (type) => {
  const response = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/* ---------- notes moderation ---------- */
export const adminListNotes = (params) => api.get('/admin/notes', { params }).then((r) => r.data);
export const approveNote = (id) => api.patch(`/admin/notes/${id}/approve`).then((r) => r.data);
export const rejectNote = (id, payload) =>
  api.patch(`/admin/notes/${id}/reject`, payload).then((r) => r.data);
export const adminDeleteNote = (id) => api.delete(`/admin/notes/${id}`).then((r) => r.data);

/* ---------- users ---------- */
export const adminListUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);
export const setUserStatus = (id, status) =>
  api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

/* ---------- reports ---------- */
export const adminListReports = (params) => api.get('/admin/reports', { params }).then((r) => r.data);
export const reviewReport = (id, payload) =>
  api.patch(`/admin/reports/${id}`, payload).then((r) => r.data);
