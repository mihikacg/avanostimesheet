import React, { useState, useEffect } from "react";
import { UserProvider, useUser } from './UserContext';
import Navbar from "./components/Navbar";
import Dashboard from "./components/dashboard";
import ClockInOut from "./components/ClockInOut";
import Approve from "./components/Approve";

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { selectedUser, userRole } = useUser();

  useEffect(() => {
    if (currentView === 'approve' && userRole !== 'A') {
      setCurrentView('dashboard');
    }
  }, [selectedUser, userRole]); 

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="bg-custom-orange min-h-screen flex flex-col">
      <Navbar 
        onDashboardClick={() => handleNavigation('dashboard')}
        onClockInOutClick={() => handleNavigation('clockInOut')}
        onApproveClick={() => handleNavigation('approve')}
      />
      <div className="flex-grow pt-20 px-4">
        {!selectedUser ? (
          <div className="flex items-center justify-center h-full">
            <h2 className="text-3xl font-bold text-black mt-20">Please select a user</h2>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'clockInOut' && <ClockInOut />}
            {currentView === 'approve' && userRole === 'A' && <Approve />}
          </>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;