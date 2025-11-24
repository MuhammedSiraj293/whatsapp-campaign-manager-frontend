// frontend/src/services/socket.js

import { io } from 'socket.io-client';
import { API_URL } from '../config'; // Import your backend URL

// Create a new socket connection to your backend server
const socket = io(API_URL, {
  // We can add authentication options here later if needed
});

// Log events for debugging purposes
socket.on('connect', () => {
  console.log('📡 Connected to Socket.IO server!');
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from Socket.IO server.');
});

export default socket;