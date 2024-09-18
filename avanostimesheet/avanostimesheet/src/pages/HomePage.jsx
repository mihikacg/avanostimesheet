import React, { useState } from 'react';
import DatePicker from 'react-datepicker'; // If using react-datepicker
import 'react-datepicker/dist/react-datepicker.css'; // If using react-datepicker
import './HomePage.css';
import NavBar from '../components/Navbar';


const Home = ({ userName }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="home">
      <h1 className="welcome-message">Welcome, {userName}!</h1>
      <div className="dashboard">
        <h2>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h2>
        <p>Please select a date below to log your hours.</p>
        <div className="date-picker-wrapper">
          <DatePicker
            id="MM/dd/YYYY"
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            className="date-picker"
            placeholderText="Select Date"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
