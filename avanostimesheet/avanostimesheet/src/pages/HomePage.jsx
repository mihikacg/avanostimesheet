import React from 'react';
import './HomePage.css';

const Home = ({ userName }) => {
  return (
    <div className="home">
      <h1 className="welcome-message">Welcome, {userName}!</h1>
      <div className="dashboard">
        <h2>-----------------------------</h2>
        <p>------------------------------</p>
      </div>
    </div>
  );
};

export default Home;