import React, { useState, useEffect } from 'react';
import NavBar from './components/Navbar';
import NameSelectionModal from './components/nameSelectionModal';
import Home from './pages/Homepage';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  const handleSelectName = (name) => {
    setUserName(name);
    localStorage.setItem('userName', name);
    setIsModalOpen(false);
  };

  const handleChangeUser = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="App">
      <NavBar onChangeUser={handleChangeUser} />
      <div className="content">
        <NameSelectionModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectName={handleSelectName}
        />
        {userName && <Home userName={userName} />}
      </div>
    </div>
  );
}

export default App;