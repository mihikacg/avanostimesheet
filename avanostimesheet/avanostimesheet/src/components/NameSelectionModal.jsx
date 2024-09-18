import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios if using it
import './NameSelectionModal.css';

const NameSelectionModal = ({ isOpen, onClose, onSelectName }) => {
  const [selectedName, setSelectedName] = useState('');
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch names when modal opens
      const fetchNames = async () => {
        try {
          const response = await axios.get('http://localhost:4000/users');
          const namesList = response.data.map(user => user.name);
          setNames(namesList);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching names:', error);
          setLoading(false);
        }
      };

      fetchNames();
      setSelectedName(''); // Reset selected name
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedName) {
      onSelectName(selectedName);
      onClose();
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome! Please select your name:</h2>
        <form onSubmit={handleSubmit}>
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            required
          >
            <option value="">Select a name</option>
            {names.map((name, index) => (
              <option key={index} value={name}>{name}</option>
            ))}
          </select>
          <button type="submit">Confirm</button>
        </form>
      </div>
    </div>
  );
};

export default NameSelectionModal;
