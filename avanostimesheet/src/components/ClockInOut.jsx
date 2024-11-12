import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HourInput from './HourInput';
import { useUser } from '../UserContext';
import EditTime from './Edittime';
import axios from 'axios';

const ClockInOut = () => {
  // =========== State Declarations ===========
  const { employeeId, loading } = useUser();
  const [selectedDate, setSelectedDate] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // =========== Helper Functions ===========
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const isMonday = (date) => date.getDay() === 1;

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // =========== Calculation Functions ===========
  const calculateExistingHours = useCallback((entries) => {
    return entries
      .filter(entry => entry.Status !== 'Rejected')
      .reduce((total, entry) => total + (parseFloat(entry.Hours) || 0), 0);
  }, []);

  const calculateCurrentHours = useCallback((data) => {
    return data.reduce((total, row) => {
      return total + ['mon', 'tue', 'wed', 'thu', 'fri'].reduce((dayTotal, day) => {
        return dayTotal + (parseFloat(row[day]) || 0);
      }, 0);
    }, 0);
  }, []);

  // =========== Data Fetching Functions ===========
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/projects');
      const projectList = response.data.map(project => ({
        id: project.Project_ID,
        name: project.Project_Name
      }));
      setProjects(projectList);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/tasks');
      const taskList = response.data.map(task => ({
        id: task.Task_ID,
        name: task.Task_Name
      }));
      setTasks(taskList);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    }
  }, []);

  const fetchTimesheetEntries = useCallback(async () => {
    if (!employeeId || !selectedDate) return;
    
    try {
      const weekStart = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:4000/timesheet/${employeeId}`, {
        params: { weekStart }
      });
      setTimesheetEntries(response.data || []);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      setError('Failed to fetch timesheet entries');
    }
  }, [employeeId, selectedDate]);

  // =========== Update Functions ===========
  const updateWeekDates = useCallback((date) => {
    const monday = getMonday(date);
    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      weekDays.push(currentDate);
    }
    setWeekDates(weekDays);
    setTableData([]); // Clear the table when week changes
  }, []);

  // =========== Validation Functions ===========
  const validateRow = useCallback((row) => {
    if (!row.projectName && !row.task) {
      return 'Project Name and Task must be selected.';
    } else if (!row.projectName) {
      return 'Project Name must be selected.';
    } else if (!row.task) {
      return 'Task must be selected.';
    }
    
    const hasHours = ['mon', 'tue', 'wed', 'thu', 'fri'].some(
      day => parseFloat(row[day]) > 0
    );
    
    if (!hasHours) {
      return 'At least one day must have hours greater than 0';
    }
    
    return null;
  }, []);

  const getRowError = useCallback((row) => {
    if (!row.projectName || !row.task) {
      return 'Project Name and Task must be selected.';
    }
    
    const hasHours = ['mon', 'tue', 'wed', 'thu', 'fri'].some(
      day => parseFloat(row[day]) > 0
    );
    
    if (!hasHours) {
      return 'At least one day must have hours greater than 0.';
    }
    
    return null;
  }, []);

  // =========== Event Handlers ===========
  const handleDateChange = useCallback((date) => {
    setSelectedDate(getMonday(date));
    setError('');
    setSuccessMessage('');
  }, []);

  const handleInputChange = useCallback((id, field, value) => {
    setTableData((prevData) => {
      const newData = prevData.map((row) => 
        row.id === id ? { ...row, [field]: value } : row
      );
      
      const existingHours = calculateExistingHours(timesheetEntries);
      const currentHours = calculateCurrentHours(newData);
      const totalHours = existingHours + currentHours;

      if (totalHours > 40) {
        setError('Total hours for the week cannot exceed 40 hours');
      } else if (error === 'Total hours for the week cannot exceed 40 hours') {
        setError('');
      }
      
      return newData;
    });
  }, [calculateExistingHours, calculateCurrentHours, timesheetEntries, error]);

  const addRow = useCallback(() => {
    setError('');
    setSuccessMessage('');

    const existingHours = calculateExistingHours(timesheetEntries);
    const currentHours = calculateCurrentHours(tableData);

    if (existingHours + currentHours >= 40) {
      setError('Cannot add more rows. Total hours would exceed 40 hours per week.');
      return;
    }

    const newRow = {
      id: Date.now(),
      projectName: '',
      task: '',
      mon: '0',
      tue: '0',
      wed: '0',
      thu: '0',
      fri: '0'
    };
    setTableData(prev => [...prev, newRow]);
  }, [calculateExistingHours, calculateCurrentHours, timesheetEntries, tableData]);

  const deleteRow = useCallback((id) => {
    setTableData(prevData => {
      const newData = prevData.filter(row => row.id !== id);
      
      if (error === 'Total hours for the week cannot exceed 40 hours') {
        const existingHours = calculateExistingHours(timesheetEntries);
        const currentHours = calculateCurrentHours(newData);
        if (existingHours + currentHours <= 40) {
          setError('');
        }
      }
      
      return newData;
    });
  }, [calculateExistingHours, calculateCurrentHours, timesheetEntries, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tableData.length === 0) {
      setError('Please add at least one row before submitting.');
      return;
    }

    for (const row of tableData) {
      const rowError = getRowError(row);
      if (rowError) {
        setError(rowError);
        return;
      }
    }

    const existingHours = calculateExistingHours(timesheetEntries);
    const currentHours = calculateCurrentHours(tableData);
    if (existingHours + currentHours > 40) {
      setError('Total hours for the week cannot exceed 40 hours');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const weekStart = selectedDate.toISOString().split('T')[0];
      
      const allEntries = tableData.flatMap(row => {
        const project = projects.find(p => p.name === row.projectName);
        const task = tasks.find(t => t.name === row.task);
        
        return weekDates.map((date, index) => {
          const hours = parseFloat(row[['mon', 'tue', 'wed', 'thu', 'fri'][index]]);
          if (hours <= 0) return null;
  
          return {
            Project_ID: project.id,
            Task_ID: task.id,
            Week_Start: weekStart,
            Entry_Date: date.toISOString().split('T')[0],
            Hours: hours,
            Employee_ID: employeeId,
            Comments: row.comments || '',
            Status: 'InProgress'
          };
        }).filter(entry => entry !== null);
      });
  
      if (allEntries.length === 0) {
        setError('No valid entries to submit. Please enter hours greater than 0.');
        return;
      }
  
      const response = await axios.post('http://localhost:4000/timesheet', allEntries);
      
      if (response.status === 201) {
        setTableData([]); // Clear the form
        setError('');
        setSuccessMessage('Timesheet entries submitted successfully!');
        
        // Fetch updated entries immediately
        await fetchTimesheetEntries();
        
        // Force EditTime to refresh
        setForceUpdate(prev => prev + 1); // Add this state at the top of your component
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      setError('Failed to submit timesheet: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // =========== Memoized Values ===========
  const editTimeProps = useMemo(() => ({
    selectedDate: selectedDate.toISOString().split('T')[0],
    employeeId,
    onEntriesUpdate: fetchTimesheetEntries,
    key: forceUpdate // Add this to force re-mount
  }), [selectedDate, employeeId, fetchTimesheetEntries, forceUpdate]);

  // =========== Effects ===========
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchProjects(), fetchTasks()]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [fetchProjects, fetchTasks]);

  useEffect(() => {
    updateWeekDates(selectedDate);
    fetchTimesheetEntries();
  }, [selectedDate, employeeId, updateWeekDates, fetchTimesheetEntries]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
    return (
      <div className="class=max-w-screen-2xl mx-auto px-12 py-20 min-h-screen mt-5 space-y-8">
        {/* New top white box for date picker and hours */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Week:</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  filterDate={isMonday}
                  dateFormat="MMMM d, yyyy"
                  className="form-input px-4 py-2 border rounded-md"
                  showPopperArrow={false}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600">Entered Hours</span>
                    <div className="flex items-center mt-1">
                      <span className="text-lg font-bold text-black">
                        {calculateExistingHours(timesheetEntries).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">hrs</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600">Current Hours</span>
                    <div className="flex items-center mt-1">
                      <span className="text-lg font-bold text-blue-600">
                        {calculateCurrentHours(tableData).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">hrs</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600">Total Hours</span>
                    <div className="flex items-center mt-1">
                      <span className={`text-lg font-bold ${(calculateExistingHours(timesheetEntries) + calculateCurrentHours(tableData)) > 40 ? 'text-red-600' : 'text-green-600'}`}>
                        {(calculateExistingHours(timesheetEntries) + calculateCurrentHours(tableData)).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">hrs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Main Clock In/Out box */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden min-h-[400px]">
        <div className="p-8 flex flex-col h-full">
          <h1 className="text-4xl font-bold mb-8 text-black">Clock In/Out</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2 mb-4">
              <p className="text-green-800 font-medium flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </p>
            </div>
          )}
  
            <form onSubmit={handleSubmit}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-black bg-gray-50">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-black bg-gray-50">
                        Task
                      </th>
                      {weekDates.map((date, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-black bg-gray-50">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index]} {formatDate(date)}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-black bg-gray-50">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr key={row.id}>
                        <td className="px-6 py-4 whitespace-nowrap border border-black">
                          <select
                            value={row.projectName}
                            onChange={(e) => handleInputChange(row.id, 'projectName', e.target.value)}
                            className="form-select w-full"
                          >
                            <option value="">Select Project</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.name}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border border-black">
                          <select
                            value={row.task}
                            onChange={(e) => handleInputChange(row.id, 'task', e.target.value)}
                            className="form-select w-full"
                          >
                            <option value="">Select Task</option>
                            {tasks.map((task) => (
                              <option key={task.id} value={task.name}>
                                {task.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        {['mon', 'tue', 'wed', 'thu', 'fri'].map((day, index) => (
                          <td key={index} className="px-6 py-4 whitespace-nowrap border border-black">
                            <HourInput
                              value={row[day]}
                              onChange={(value) => handleInputChange(row.id, day, value.toString())}
                            />
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap border border-black">
                          <button
                            type="button"
                            onClick={() => deleteRow(row.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
  
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={addRow}
                  className="mr-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  disabled={submitting}
                >
                  Add Entry
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
        {employeeId && selectedDate && (
          <EditTime
            key={`${employeeId}-${selectedDate.toISOString()}-${forceUpdate}`}
            {...editTimeProps}
          />
        )}
      </div>
    );
  };
  
  export default React.memo(ClockInOut);