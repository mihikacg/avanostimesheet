import React, { useState, useEffect } from 'react';
import './NameSelectionModal.css';

const NameSelectionModal = ({ isOpen, onClose, onSelectName }) => {
  const [selectedName, setSelectedName] = useState('');
  
  // Example list of names - replace with your actual list
  const names = ['x','y','z'];

  useEffect(() => {
    // Reset selected name when modal opens
    if (isOpen) {
      setSelectedName('');
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