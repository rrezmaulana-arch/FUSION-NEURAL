/**
 * Project: FUSION NEURAL
 * MediaUploader.ts — Upload media ke Imgbb dan dapatkan public URL.
 * Gratis unlimited, no credit card. URL stabil untuk Instagram API.
 */

export interface UploadResult {
  url: string;
  filename: string;
  type: 'image' | 'video';
}

/**
 * Convert File object ke base64 string.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Hapus prefix "data:image/jpeg;base64,"
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload gambar ke Imgbb API.
 * Gratis unlimited, no credit card, direct URL.
 * https://api.imgbb.com/
 */
async function uploadToImgbb(base64: string, filename?: string): Promise<UploadResult> {
  const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_IMGBB_API_KEY belum di-set. Daftar gratis di https://api.imgbb.com');
  }

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('image', base64);
  if (filename) {
    formData.append('name', filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40));
  }

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Imgbb upload gagal (${res.status})`);
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Imgbb upload gagal');
  }

  return {
    url: data.data.url,
    filename: data.data.image.filename,
    type: 'image',
  };
}

/**
 * Upload File object — auto-convert ke base64 lalu upload ke Imgbb.
 * Hanya mendukung image (Imgbb tidak support video).
 * Untuk video, gunakan backend self-host sebagai fallback.
 */
export async function uploadMediaFile(file: File): Promise<UploadResult> {
  const isVideo = file.type.startsWith('video/');

  if (isVideo) {
    // Video: upload ke backend (Imgbb tidak support video)
    return uploadToBackend(file);
  }

  // Image: upload ke Imgbb
  const base64 = await fileToBase64(file);
  const name = file.name.replace(/\.[^.]+$/, ''); // hapus ext
  return uploadToImgbb(base64, name);
}

/**
 * Upload base64 image string langsung ke Imgbb.
 * Dipakai oleh Image Studio (FLUX.1 AI output).
 */
export async function uploadBase64Image(
  base64: string,
  mimeType: string = 'image/jpeg',
  filename?: string,
): Promise<UploadResult> {
  return uploadToImgbb(base64, filename);
}

/**
 * Fallback: upload video ke backend server.
 * Dipakai jika file adalah video (Imgbb tidak support).
 */
async function uploadToBackend(file: File): Promise<UploadResult> {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8001';

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiUrl}/api/media/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload gagal' }));
    throw new Error(err.detail || `Upload gagal (${res.status})`);
  }

  const data = await res.json();
  return {
    url: data.url,
    filename: data.filename,
    type: data.type,
  };
}
