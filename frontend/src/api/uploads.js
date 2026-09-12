import api, { API_ORIGIN } from './axios';

// Turns a model path into the correct full URL depending on where it's
// actually hosted:
// - "/uploads/..." -> user-uploaded files live on the BACKEND, so prefix
//   with the backend's origin regardless of what origin the frontend runs on.
// - "/assets/..." (or anything else relative) -> built-in models bundled
//   with the frontend itself, served from the frontend's own origin, so
//   leave the path as-is.
// - Full "http..." URLs are already absolute and left untouched.
export function toFullModelUrl(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  if (relativePath.startsWith('/uploads/')) return `${API_ORIGIN}${relativePath}`;
  return relativePath;
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
