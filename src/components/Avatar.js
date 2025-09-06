// frontend/src/components/Avatar.js

import React from 'react';

// A predefined list of nice, soft colors for the avatars
const colors = [
  '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac', 
  '#4299e1', '#667eea', '#9f7aea', '#ed64a6'
];

// A simple hashing function to pick a color based on the contact's ID (phone number)
const getColor = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

// Function to get the initials from a name or phone number
const getInitials = (name, contactId) => {
  if (name && name.trim() !== '') {
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }
  // Fallback to the first two digits of the phone number if no name
  return contactId.substring(0, 2);
};

export default function Avatar({ name, contactId }) {
  const initials = getInitials(name, contactId);
  const backgroundColor = getColor(contactId);

  const style = {
    backgroundColor: backgroundColor,
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginRight: '1rem', // Equivalent to mr-4 in Tailwind
  };

  return (
    <div style={style}>
      {initials}
    </div>
  );
}