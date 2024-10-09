import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Load user data from localStorage on initial render
    const storedUser = localStorage.getItem('selectedUser');
    const storedEmployeeId = localStorage.getItem('employeeId');
    const storedUserRole = localStorage.getItem('userRole');
    if (storedUser && storedEmployeeId && storedUserRole) {
      setSelectedUser(storedUser);
      setEmployeeId(storedEmployeeId);
      setUserRole(storedUserRole);
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:4000/users');
        const usersList = response.data.map(user => ({
          name: `${user.Last_name}, ${user.First_name}`,
          id: user.Employee_ID,
          role: user.User_Role // Make sure this field exists in your API response
        }));
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const setUser = (user, id, role) => {
    setSelectedUser(user);
    setEmployeeId(id);
    setUserRole(role);
    // Save to localStorage
    localStorage.setItem('selectedUser', user);
    localStorage.setItem('employeeId', id);
    localStorage.setItem('userRole', role);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setEmployeeId(null);
    setUserRole(null);
    localStorage.removeItem('selectedUser');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('userRole');
  };

  return (
    <UserContext.Provider value={{ selectedUser, employeeId, userRole, setUser, clearUser, loading, users }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);