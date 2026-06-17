import { useState } from 'react';
import { getUploadSignature } from '../services/api';

/**
 * Custom hook for uploading images directly to Cloudinary
 * using the backend-signed upload flow (zero server CPU).
 *
 * Usage:
 *   const { upload, uploading, error } = useCloudinaryUpload();
 *   const secureUrl = await upload(file);
 */
export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Uploads an image file directly to Cloudinary.
   * @param {File} file - The image file from an <input type="file"> element.
   * @returns {Promise<string>} The secure_url of the uploaded image on Cloudinary's CDN.
   */
  async function upload(file) {
    setUploading(true);
    setError(null);

    try {
      // Step 1: Get a cryptographic signature from our secure C# backend
      const { timestamp, signature, apiKey, cloudName } = await getUploadSignature();

      // Step 2: Build FormData and send the file DIRECTLY to Cloudinary (bypasses our server)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', apiKey);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type header — the browser sets the correct
        // multipart/form-data boundary automatically when using FormData.
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `Cloudinary upload failed (${response.status})`);
      }

      const data = await response.json();

      // Step 3: Return the permanent CDN URL
      return data.secure_url;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
