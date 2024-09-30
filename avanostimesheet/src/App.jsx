import React, { useState } from "react";
import { UserProvider, useUser } from './UserContext';
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import ClockInOut from "./components/ClockInOut";

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { selectedUser } = useUser();

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="bg-custom-orange min-h-screen flex flex-col">
      <Navbar 
        onDashboardClick={() => handleNavigation('dashboard')}
        onClockInOutClick={() => handleNavigation('clockInOut')}
      />
      <div className="flex-grow pt-20 px-4"> {/* Padding for fixed navbar */}
        {!selectedUser ? (
          <div className="flex items-center justify-center h-full">
            <h2 className="text-3xl font-bold text-black mt-20">Please select a user</h2>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'clockInOut' && <ClockInOut />}
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