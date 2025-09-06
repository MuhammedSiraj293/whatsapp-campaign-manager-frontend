// frontend/src/services/api.js

import { API_URL } from '../config';

export const uploadRecipientsFile = async (file, campaignId) => {
  // We use FormData to send files to the backend
  const formData = new FormData();
  formData.append('file', file); // 'file' must match the key in our multer middleware

  try {
    // The campaignId is now part of the URL
    const response = await fetch(`${API_URL}/api/recipients/upload/${campaignId}`, {
      method: 'POST',
      body: formData, // NOTE: No 'Content-Type' header is needed; the browser sets it automatically for FormData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'File upload failed.');
    }

    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};