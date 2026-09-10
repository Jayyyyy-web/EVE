import api, { API_ORIGIN } from './axios';

// Turns the relative path the backend returns (e.g. "/uploads/models/x.glb")
// into a full URL pointing at the backend, regardless of what origin the
// frontend itself is served from.
export function toFullModelUrl(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  return `${API_ORIGIN}${relativePath}`;
}

export async function uploadModelFile(file, onProgress) {
  const formData = new FormData();
  formData.append('model', file);

  const res = await api.post('/uploads/model', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return res.data.url; // relative path
}

export async function importModelFromUrl(url) {
  const res = await api.post('/uploads/model-from-url', { url });
  return res.data.url; // relative path
}
