import React, { useState, useEffect } from 'react';

const HourInput = ({ value, onChange }) => {
    const handleIncrement = () => {
      const newValue = Math.min(24, parseFloat(value) + 1);
      onChange(newValue.toFixed(1));
    };
  
    const handleDecrement = () => {
      const newValue = Math.max(0, parseFloat(value) - 1);
      onChange(newValue.toFixed(1));
    };
  
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          className="px-2 py-1 bg-black text-white rounded-l"
        >
          -
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= 0 && val <= 24) {
              onChange(val.toFixed(1));
            }
          }}
          className="w-16 text-center border-t border-b"
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="px-2 py-1 bg-black text-white rounded-r"
        >
          +
        </button>
      </div>
    );
  };
  export default HourInput;