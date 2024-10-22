import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HourInput from './HourInput';
import { useUser } from '../UserContext';
import EditTime from './Edittime';
import axios from 'axios';

const ClockInOut = () => {
  const [selectedDate, setSelectedDate] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { employeeId, loading } = useUser();
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  useEffect(() => {
    updateWeekDates(selectedDate);
    fetchTimesheetEntries();
  }, [selectedDate, employeeId]);

  const fetchProjects = async () => {
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
  };

  const fetchTasks = async () => {
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
  };

  const fetchTimesheetEntries = async () => {
    if (!employeeId) return;
    try {
      const weekStart = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:4000/timesheet/${employeeId}`, {
        params: { weekStart }
      });
      setTimesheetEntries(response.data);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      setError('Failed to fetch timesheet entries');
    }
  };

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const updateWeekDates = (date) => {
    const monday = getMonday(date);
    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      weekDays.push(currentDate);
    }
    setWeekDates(weekDays);
    setTableData([]); // Clear the table when week changes
  };

  const handleDateChange = (date) => {
    setSelectedDate(getMonday(date));
  };

  const isMonday = (date) => date.getDay() === 1;

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleInputChange = (id, field, value) => {
    setTableData((prevData) =>
      prevData.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    const newRow = {
      id: Date.now(), // Use timestamp as unique ID
      projectName: '',
      task: '',
      mon: '0',
      tue: '0',
      wed: '0',
      thu: '0',
      fri: '0'
    };
    setTableData([...tableData, newRow]);
  };

  const validateRow = (row) => {
    if (!row.projectName && !row.task) {
      return 'Project Name and Task must be selected.';
    }else if (!row.projectName) {
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
  };

  const getRowError = (row) => {
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
};

  const deleteRow = (id) => {
    setTableData(tableData.filter(row => row.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tableData.length === 0) {
      setError('Please add at least one row before submitting.');
      return;
    }

    // Validate all rows
    for (const row of tableData) {
      const validationError = validateRow(row);
      if (validationError) {
        setError(`Error: ${validationError}`);
        return;
      }
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
            Status: 'Pending'
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
        fetchTimesheetEntries(); // Refresh the displayed entries
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      setError('Failed to submit timesheet: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="class=max-w-screen-2xl mx-auto px-12 py-20 min-h-screen mt-5">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden min-h-[750px]">
        <div className="p-8">
          {loading ? (
            <div>Loading...</div> 
          ) : !employeeId ? (
            <div className="flex items-center justify-center h-full">
              <h2 className="text-3xl font-bold text-black mt-20">Please select a user in the Navbar</h2>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-8 text-black">Clock In/Out</h1>

              <div className="mb-6">
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

              {error && (<div className="bg-red-50 border border-red-200 rounded-md px-4 py-2 mb-4"><p className="text-red-800 font-medium">{error}</p> </div>)}

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
                
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addRow}
                    className="mr-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    disabled={submitting}
                  >
                    Add Row
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit All'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      <EditTime 
        selectedDate={selectedDate} 
        timesheetEntries={timesheetEntries}
        fetchTimesheetEntries={fetchTimesheetEntries}
      />
    </div>
  );
};

export default ClockInOut;