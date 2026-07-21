// frontend/src/pages/Users.js

import React, { useState, useEffect, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FaTrash, FaEdit, FaTimes } from 'react-icons/fa';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the "Add New User" form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer'); // Default role for new users

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('viewer');
  const [editAssignedWabas, setEditAssignedWabas] = useState([]);
  const [editAssignedContactLists, setEditAssignedContactLists] = useState([]);
  const [editPassword, setEditPassword] = useState('');

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

  const fetchOptions = async () => {
    try {
      const [wabaData, contactListData] = await Promise.all([
        authFetch('/waba/accounts'),
        authFetch('/contacts/lists')
      ]);
      if (wabaData.success) {
        setWabaAccounts(wabaData.data);
      }
      if (contactListData.success) {
        setContactLists(contactListData.data);
      }
    } catch (error) {
      console.error('Error fetching assignment options:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOptions();
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

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditAssignedWabas((user.assignedWabas || []).map(w => w._id || w));
    setEditAssignedContactLists((user.assignedContactLists || []).map(c => c._id || c));
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editName,
        email: editEmail,
        role: editRole,
        assignedWabas: editAssignedWabas,
        assignedContactLists: editAssignedContactLists
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      const data = await authFetch(`/users/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (data.success) {
        alert('User updated successfully!');
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleWabaAssignment = (wabaId) => {
    if (editAssignedWabas.includes(wabaId)) {
      setEditAssignedWabas(editAssignedWabas.filter(id => id !== wabaId));
    } else {
      setEditAssignedWabas([...editAssignedWabas, wabaId]);
    }
  };

  const toggleContactListAssignment = (listId) => {
    if (editAssignedContactLists.includes(listId)) {
      setEditAssignedContactLists(editAssignedContactLists.filter(id => id !== listId));
    } else {
      setEditAssignedContactLists([...editAssignedContactLists, listId]);
    }
  };

  const inputStyle = "bg-[#2c3943] border border-gray-700 text-neutral-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5";
  const buttonStyle = "text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors duration-150";

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
          <div className="bg-[#202d33] rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
            <table className="min-w-full">
              <thead className="bg-[#2a3942]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Assignments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 capitalize">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === 'admin' ? 'bg-red-900/40 text-red-300 border border-red-800' :
                        user.role === 'manager' ? 'bg-amber-900/40 text-amber-300 border border-amber-800' :
                        'bg-blue-900/40 text-blue-300 border border-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.role === 'admin' ? (
                        <span className="text-xs text-gray-500 italic">All Access (Admin)</span>
                      ) : (
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          <div>
                            <span className="text-xs font-bold text-gray-300">WABA: </span>
                            <span className="text-xs">{user.assignedWabas?.map(w => w.accountName).join(', ') || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-300">Lists: </span>
                            <span className="text-xs">{user.assignedContactLists?.map(c => c.name).join(', ') || 'None'}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEditModal(user)} className="text-emerald-500 hover:text-emerald-400 p-1">
                          <FaEdit className="size-4" />
                        </button>
                        {loggedInUser._id !== user._id && (
                          <button onClick={() => handleDeleteUser(user._id)} className="text-red-500 hover:text-red-400 p-1">
                            <FaTrash className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl mx-auto my-6 z-10 px-4">
            <div className="relative flex flex-col w-full bg-[#202d33] border border-gray-700 rounded-lg shadow-2xl outline-none focus:outline-none text-neutral-200">
              
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-gray-700 rounded-t">
                <h3 className="text-xl font-semibold text-white">
                  Edit User & Assignments
                </h3>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-white float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <FaTimes className="size-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleUpdateUser}>
                <div className="relative p-6 flex-auto max-h-[60vh] overflow-y-auto space-y-4">
                  
                  {/* Basic Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-400">Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputStyle} required />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-400">Email</label>
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputStyle} required />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-400">User Role</label>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={inputStyle}>
                      <option value="viewer">Viewer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Password Reset (Optional) */}
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-400">Change Password (optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  {/* Assignments - only if NOT admin */}
                  {editRole !== 'admin' && (
                    <div className="space-y-4 pt-2 border-t border-gray-700/50">
                      
                      {/* WABA Accounts */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-2">Assign WABA Accounts</h4>
                        {wabaAccounts.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No WABA accounts configured yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#182229] p-3 rounded-lg border border-gray-700/50 max-h-[140px] overflow-y-auto">
                            {wabaAccounts.map((account) => (
                              <label key={account._id} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-800/40 p-1.5 rounded transition-colors text-sm">
                                <input
                                  type="checkbox"
                                  checked={editAssignedWabas.includes(account._id)}
                                  onChange={() => toggleWabaAssignment(account._id)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-[#2c3943] border-gray-700 size-4 cursor-pointer"
                                />
                                <span className="text-gray-300 capitalize">{account.accountName}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contact Lists */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-2">Assign Contact Lists</h4>
                        {contactLists.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No contact lists found.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#182229] p-3 rounded-lg border border-gray-700/50 max-h-[140px] overflow-y-auto">
                            {contactLists.map((list) => (
                              <label key={list._id} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-800/40 p-1.5 rounded transition-colors text-sm">
                                <input
                                  type="checkbox"
                                  checked={editAssignedContactLists.includes(list._id)}
                                  onChange={() => toggleContactListAssignment(list._id)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-[#2c3943] border-gray-700 size-4 cursor-pointer"
                                />
                                <span className="text-gray-300">{list.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-4 border-t border-gray-700 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border border-gray-600 hover:bg-neutral-800 text-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={buttonStyle}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}