import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import { Menu, X, ChevronDown } from "lucide-react";

// Reusable status badge component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    InProgress: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

// Reusable action button component
const ActionButton = ({ onClick, label, color }) => {
  const colorStyles = {
    green: 'bg-green-100 text-green-800 hover:bg-green-200',
    red: 'bg-red-100 text-red-800 hover:bg-red-200'
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full cursor-pointer ${colorStyles[color]}`}
    >
      {label}
    </button>
  );
};

// Table header component
const TableHeader = ({ onSort, showActions }) => {
  const headers = [
    { id: 'employee', label: 'Employee', sortable: false },
    { id: 'project', label: 'Project', sortKey: 'Project_ID' },
    { id: 'task', label: 'Task', sortKey: 'Task_ID' },
    { id: 'hours', label: 'Hours', sortKey: 'Hours' },
    { id: 'date', label: 'Date', sortKey: 'Entry_Date' },
    { id: 'status', label: 'Status', sortKey: 'Status' }
  ];

  return (
    <tr className="bg-gray-100">
      {headers.map(header => (
        <th
          key={header.id}
          onClick={() => header.sortable !== false && onSort(header.sortKey)}
          className={`px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-black uppercase tracking-wider ${
            header.sortable !== false ? 'cursor-pointer hover:bg-gray-200' : ''
          }`}
        >
          {header.label}
        </th>
      ))}
      {showActions && (
        <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-black uppercase tracking-wider">
          Actions
        </th>
      )}
    </tr>
  );
};

// Table row component
const TableRow = ({ entry, showActions, onApprove, onReject }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-5 border-b border-gray-200">
        <p className="text-sm text-gray-900 whitespace-nowrap">
          {`${entry.First_name} ${entry.Last_name}`}
        </p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200">
        <p className="text-sm text-gray-900 whitespace-nowrap">{entry.Project_Name}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200">
        <p className="text-sm text-gray-900 whitespace-nowrap">{entry.Task_Name}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200">
        <p className="text-sm text-gray-900 whitespace-nowrap">{entry.Hours}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200">
        <p className="text-sm text-gray-900 whitespace-nowrap">
          {formatDate(entry.Entry_Date)}
        </p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200">
        <StatusBadge status={entry.Status} />
      </td>
      {showActions && entry.Status === 'InProgress' && (
        <td className="px-5 py-5 border-b border-gray-200 space-x-2">
          <ActionButton
            onClick={() => onApprove(entry.TimeSheetEntry_ID)}
            label="Approve"
            color="green"
          />
          <ActionButton
            onClick={() => onReject(entry.TimeSheetEntry_ID)}
            label="Reject"
            color="red"
          />
        </td>
      )}
      {showActions && entry.Status !== 'InProgress' && (
        <td className="px-5 py-5 border-b border-gray-200">
          <span className="text-sm text-gray-500">No actions available</span>
        </td>
      )}
    </tr>
  );
};

// Main TimesheetTable component
const TimesheetTable = ({ entries, title, showActions, onApprove, onReject, onSort }) => (
  <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8">
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">
          Total Entries: {entries.length}
        </p>
      </div>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full leading-normal">
          <thead>
            <TableHeader onSort={onSort} showActions={showActions} />
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <TableRow
                  key={entry.TimeSheetEntry_ID}
                  entry={entry}
                  showActions={showActions}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={showActions ? 8 : 7}
                  className="px-5 py-10 text-center text-gray-500 bg-gray-50"
                >
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Main Approve component
const Approve = () => {
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { employeeId, loading: contextLoading } = useUser();

  useEffect(() => {
    if (!contextLoading && employeeId) {
      fetchData();
    }
  }, [employeeId, contextLoading]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:4000/approval-timesheet/${employeeId}`);
      setTimesheetEntries(response.data);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
      setError('Failed to load timesheet data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timeSheetEntryId) => {
    try {
      const response = await axios.post(`http://localhost:4000/approve-timesheet/${timeSheetEntryId}`);
      if (response.data.success) {
        await fetchData();
      } else {
        setError('Failed to approve timesheet entry. Please try again.');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      setError('Error approving timesheet. Please try again.');
    }
  };

  const handleReject = async (timeSheetEntryId) => {
    try {
      const response = await axios.post(`http://localhost:4000/reject-timesheet/${timeSheetEntryId}`);
      if (response.data.success) {
        await fetchData();
      } else {
        setError('Failed to reject timesheet entry. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      setError('Error rejecting timesheet. Please try again.');
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedEntries = (entries) => {
    if (!sortConfig.key) return entries;

    return [...entries].sort((a, b) => {
      let valueA = a[sortConfig.key];
      let valueB = b[sortConfig.key];

      // Handle special cases like dates and names
      if (sortConfig.key === 'Entry_Date') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }

      if (valueA < valueB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  };

  if (contextLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const inProgressEntries = getSortedEntries(
    timesheetEntries.filter(entry => entry.Status === 'InProgress')
  );
  
  const approvedEntries = getSortedEntries(
    timesheetEntries.filter(entry => entry.Status === 'Approved')
  );

  const rejectedEntries = getSortedEntries(
    timesheetEntries.filter(entry => entry.Status === 'Rejected')
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <TimesheetTable
        entries={inProgressEntries}
        title="In Progress Requests"
        showActions={true}
        onApprove={handleApprove}
        onReject={handleReject}
        onSort={requestSort}
      />
      
      <TimesheetTable
        entries={approvedEntries}
        title="Approved Requests"
        showActions={false}
        onSort={requestSort}
      />

      <TimesheetTable
        entries={rejectedEntries}
        title="Rejected Requests"
        showActions={false}
        onSort={requestSort}
      />
    </div>
  );
};

export default Approve;