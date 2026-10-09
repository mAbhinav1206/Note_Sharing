import api from './client';

/* ---------- public ---------- */
export const browseNotes = (params) => api.get('/notes', { params }).then((r) => r.data);
export const getNote = (id) => api.get(`/notes/${id}`).then((r) => r.data);
export const getTopNotes = (params) => api.get('/notes/top', { params }).then((r) => r.data);

/* ---------- student ---------- */
export const getMyNotes = (params) => api.get('/notes/mine', { params }).then((r) => r.data);
export const getMyNote = (id) => api.get(`/notes/mine/${id}`).then((r) => r.data);

// FormData upload - let axios set the multipart boundary itself.
export const createNote = (formData, onUploadProgress) =>
  api
    .post('/notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress, // used by the progress bar
    })
    .then((r) => r.data);

export const updateNote = (id, payload) => api.patch(`/notes/${id}`, payload).then((r) => r.data);
export const deleteNote = (id) => api.delete(`/notes/${id}`).then((r) => r.data);

/**
 * Downloads a note as a file:
 *  1. ask the API for the file bytes (cookie auth)
 *  2. create a temporary object URL and click a hidden link
 * The file never has a public URL - it only comes from this endpoint.
 */
export const downloadNote = async (id, fileName) => {
  const response = await api.get(`/notes/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || 'note');
  document.body.appendChild(link);
  link.click();
  // Clean up a moment later: revoking/removing immediately can cancel the
  // download in some browsers (Firefox/Safari).
  setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 1000);
  return true;
};

/* ---------- ratings ---------- */
export const getRatings = (noteId) => api.get(`/ratings/note/${noteId}`).then((r) => r.data);
export const rateNote = (noteId, payload) =>
  api.post(`/ratings/note/${noteId}`, payload).then((r) => r.data);
export const deleteRating = (noteId) => api.delete(`/ratings/note/${noteId}`).then((r) => r.data);

/* ---------- reports ---------- */
export const reportNote = (payload) => api.post('/reports', payload).then((r) => r.data);
export const getMyReports = () => api.get('/reports/mine').then((r) => r.data);
