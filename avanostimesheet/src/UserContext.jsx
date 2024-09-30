import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [userRole, setUserRole] = useState(null);

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
    <UserContext.Provider value={{ selectedUser, employeeId, userRole, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);