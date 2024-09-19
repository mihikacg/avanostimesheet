import React from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/dashboard';

function App() {
  return (
    <div className="bg-custom-orange min-h-screen">
      <Navbar />
      <Dashboard />
  </div>
  );
}

export default App;