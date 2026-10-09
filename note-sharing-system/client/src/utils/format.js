/** Small formatting helpers used across the UI. */

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

/** File extension from a filename -> drives the icon colour. */
export const getFileType = (fileName = '') => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return { ext, label: 'PDF', color: '#dc3545' };
  if (['doc', 'docx'].includes(ext)) return { ext, label: 'DOC', color: '#2b579a' };
  if (['ppt', 'pptx'].includes(ext)) return { ext, label: 'PPT', color: '#d24726' };
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return { ext, label: 'IMG', color: '#198754' };
  return { ext, label: (ext || 'FILE').toUpperCase(), color: '#6c757d' };
};
