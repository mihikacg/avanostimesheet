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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel } from "@azure/msal-browser";

/**
 * Configuration object to be passed to MSAL instance on creation. 
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md 
 */

export const msalConfig = {
    auth: {
        clientId: "72c39591-8c13-446e-b850-cc5152f2bee9",
        authority: "https://login.microsoftonline.com/966f5947-4ca3-4c16-a15b-ef064533c7e0",
        redirectUri: "http://localhost:3000",
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {	
        loggerOptions: {	
            loggerCallback: (level, message, containsPii) => {	
                if (containsPii) {		
                    return;		
                }		
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        return;
                }	
            }	
        }	
    }
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit: 
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
    scopes: ["User.Read"]
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
