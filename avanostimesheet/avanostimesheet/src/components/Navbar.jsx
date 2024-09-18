import React from 'react';
import './NavBar.css';
import logo from '../assets/Avanos logo.png';

const NavBar = ({ onChangeUser }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logo} alt="Avanos Logo" className="navbar-logo-image" />
          <span className="navbar-logo-text">Time Sheet</span>
        </div>
        <div className="nav-menu">
          <a href="/" className="nav-link">Home</a>
          <a href="/add-time" className="nav-link">Add Time</a>
        
          <button onClick={onChangeUser} className="nav-link change-user-btn">Change User</button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;