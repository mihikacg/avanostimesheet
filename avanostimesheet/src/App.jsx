import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './UserContext';
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import ClockInOut from "./components/ClockInOut";
import Approve from "./components/Approve";

import { useIsAuthenticated } from '@azure/msal-react';
import { SignInButton } from './components/SignInButton';
import { SignOutButton } from './components/SignOutButton';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./UserContext"; // assuming msalConfig is properly set up

const msalInstance = new PublicClientApplication(msalConfig);


const AppContent = () => {
  const { selectedUser, userRole, loading } = useUser();
  const navigate = useNavigate();
  // const isAuthenticated = useIsAuthenticated();
  const isAuthenticated = true;
  
  const handleNavigation = (view) => {
    switch(view) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'clockInOut':
        navigate('/clock-in-out');
        break;
      case 'approve':
        if (userRole === 'A') {
          navigate('/approve');
        } else {
          navigate('/dashboard');
        }
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Wait for user data to load before making routing decisions
  if (loading) {
    return (
      <div className="bg-custom-orange min-h-screen flex flex-col">
        <Navbar
          onDashboardClick={() => handleNavigation('dashboard')}
          onClockInOutClick={() => handleNavigation('clockInOut')}
          onApproveClick={() => handleNavigation('approve')}
        />
        <div className="flex-grow pt-20 px-4">
          <div className="flex items-center justify-center h-full">
            <h2 className="text-3xl font-bold text-black mt-20">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-custom-orange min-h-screen flex flex-col">
      <Navbar
        onDashboardClick={() => handleNavigation('dashboard')}
        onClockInOutClick={() => handleNavigation('clockInOut')}
        onApproveClick={() => handleNavigation('approve')}
      />
      <div className="flex-grow pt-20 px-4">
        {/* FIX ME */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl text-black mt-60">Welcome to the Avanos Timesheet System. </h2>
            <h3 className="text-3xl font-bold text-black mt-10">  Please sign in to continue. </h3>
            {/* <h3 className="text-3xl font-bold text-black mt-10">  {String(isAuthenticated)} </h3> */}
          </div>
        ) : (
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clock-in-out" element={<ClockInOut />} />
            <Route 
              path="/approve" 
              element={
                loading ? (
                  <div className="flex items-center justify-center h-full">
                    <h2 className="text-3xl font-bold text-black mt-20">Loading...</h2>
                  </div>
                ) : userRole === 'A' ? (
                  <Approve />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
    </MsalProvider>
  );
};

export default App;