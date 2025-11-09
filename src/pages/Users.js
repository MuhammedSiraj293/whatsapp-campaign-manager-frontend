// frontend/src/pages/Users.js

import React, { useState, useEffect, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FaTrash } from 'react-icons/fa';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the "Add New User" form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer'); // Default role for new users

  const { user: loggedInUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await authFetch('/users');
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return alert('Please fill out all fields.');
    }
    try {
      const data = await authFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      if (data.success) {
        alert('User created successfully!');
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setRole('viewer');
        fetchUsers(); // Refresh the user list
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await authFetch(`/users/${userId}`, { method: 'DELETE' });
      alert('User deleted successfully.');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      alert(error.message);
    }
  };

  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5";
  // const labelStyle = "block mb-2 text-sm font-medium text-gray-400";
  const buttonStyle = "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center";

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen w-full p-4 md:p-8">
      {/* Create User Form */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="bg-[#202d33] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} required />
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputStyle}>
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className={buttonStyle}>Create User</button>
          </form>
        </div>
      </div>

      {/* Existing Users List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Existing Users</h2>
        {isLoading ? (<p className="text-center text-gray-400">Loading users...</p>) : (
          <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-[#2a3942]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 text-sm text-gray-300">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-sm">
                      {/* Prevent an admin from deleting themselves */}
                      {loggedInUser._id !== user._id && (
                        <button onClick={() => handleDeleteUser(user._id)} className="text-red-500 hover:text-red-400">
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}