import api from './client';

export const getCourses = () => api.get('/courses').then((r) => r.data);
export const getSubjects = (params) => api.get('/subjects', { params }).then((r) => r.data);
export const getCategories = () => api.get('/categories').then((r) => r.data);

/* ---------- admin CRUD ---------- */
export const createCourse = (payload) => api.post('/courses', payload).then((r) => r.data);
export const updateCourse = (id, payload) => api.patch(`/courses/${id}`, payload).then((r) => r.data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`).then((r) => r.data);

export const createSubject = (payload) => api.post('/subjects', payload).then((r) => r.data);
export const updateSubject = (id, payload) => api.patch(`/subjects/${id}`, payload).then((r) => r.data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`).then((r) => r.data);

export const createCategory = (payload) => api.post('/categories', payload).then((r) => r.data);
export const updateCategory = (id, payload) => api.patch(`/categories/${id}`, payload).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);
