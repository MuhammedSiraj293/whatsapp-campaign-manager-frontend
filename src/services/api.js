// frontend/src/services/api.js

import { API_URL } from '../config';

/**
 * A wrapper around the native fetch function that automatically adds the
 * authentication token to the request headers.
 * @param {string} endpoint - The API endpoint to call (e.g., '/campaigns').
 * @param {object} options - The options for the fetch request (e.g., method, body).
 * @returns {Promise<object>} The JSON response from the API.
 */
export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'An API error occurred.');
  }

  return response.json();
};


/**
 * A special function for file uploads that also adds the auth token.
 * @param {string} endpoint - The API endpoint for the upload.
 * @param {File} file - The file to upload.
 * @returns {Promise<object>} The JSON response from the API.
 */
export const uploadFile = async (endpoint, file) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'File upload failed.');
  }
  
  return response.json();
};