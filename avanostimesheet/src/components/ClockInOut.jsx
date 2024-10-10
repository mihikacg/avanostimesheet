import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HourInput from './HourInput';
import { UserProvider, useUser } from '../UserContext';

const ClockInOut = () => {
  const [selectedDate, setSelectedDate] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { employeeId, loading } = useUser();
  console.log('Employee ID:', employeeId);


  // const projectOptions = ['Project A', 'Project B', 'Project C'];
  // const taskOptions = ['Task 1', 'Task 2', 'Task 3'];

  useEffect(() => {
      // Fetch projects
      fetch('http://localhost:4000/projects')
      .then(response => response.json()) // Parse JSON data from the response
      .then(data => {
        const projectList = data.map(project => ({
          id: project.Project_ID,        // Assuming this is the field from your API response
          name: project.Project_Name     // Assuming this is the field from your API response
        }));
        setProjects(projectList);         // Set the state with the processed data
      })
      .catch(error => console.error('Error fetching projects:', error));
    
    
      // Fetch tasks
      fetch('http://localhost:4000/tasks')
      .then(response => response.json())
      .then(data => {
        const taskList = data.map(task => ({
          id: task.Task_ID,               // Assuming this is the field from your API response
          name: task.Task_Name            // Assuming this is the field from your API response
        }));
        setTasks(taskList);               // Set the state with the processed data
      })
      .catch(error => console.error('Error fetching tasks:', error));
  }, []);

    // Update the week dates when selectedDate changes
    useEffect(() => {
      updateWeekDates(selectedDate);
    }, [selectedDate]);

    

      
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
      id: tableData.length + 1,
      projectName: '',
      task: '',
      mon: '0',
      tue: '0',
      wed: '0',
      thu: '0',
      fri: '0',
      status: 'Pending'
    };
    setTableData([...tableData, newRow]);
    setEditingRow(newRow.id);
  };

  const handleEdit = (id) => {
    setEditingRow(id);
    setError('');
  };

  const fetchTimesheetEntries = async () => {
    try {
      const response = await fetch('http://localhost:4000/timesheet');
      if (!response.ok) {
        throw new Error('Failed to fetch timesheet entries');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      return [];
    }
  };

  const handleSave = async (id) => {
    const rowToSave = tableData.find(row => row.id === id);
    
    if (!rowToSave.projectName || !rowToSave.task) {
      setError('Project Name and Task must be selected before saving.');
      return;
    }
  
    try {
      const project = projects.find(p => p.name === rowToSave.projectName);
      const task = tasks.find(t => t.name === rowToSave.task);
      const weekStart = selectedDate.toISOString().split('T')[0];
      
      // Fetch all timesheet entries and get the count
      const allEntries = await fetchTimesheetEntries();
      const currentCount = allEntries.length;
  
      // First, create entries without TimeSheetE and filter
      const filteredEntries = weekDates
        .map((date, index) => ({
          Project_ID: project.id,
          Task_ID: task.id,
          Week_Start: weekStart,
          Entry_Date: date.toISOString().split('T')[0],
          Hours: parseFloat(rowToSave[['mon', 'tue', 'wed', 'thu', 'fri'][index]]),
          Employee_ID: employeeId,
          Comments: rowToSave.comments || '',
          Status: 'Pending'
        }))
        .filter(entry => entry.Hours > 0);
  
      // Now add TimeSheetE to filtered entries
      const entries = filteredEntries.map((entry, index) => ({
        ...entry,
        TimeSheetE: currentCount + index + 1
      }));
  
      if (entries.length === 0) {
        setError('No entries to save. Please enter hours greater than 0.');
        return;
      }
  
      console.log('Sending to server:', JSON.stringify(entries, null, 2));
  
      const response = await fetch('http://localhost:4000/timesheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entries)
      });
  
      if (response.ok) {
        console.log('Timesheet saved successfully.');
        setEditingRow(null);
        setError('');
      } else {
        const errorText = await response.text();
        console.error('Error saving timesheet:', response.statusText, errorText);
        setError('Error saving timesheet: ' + errorText);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error saving timesheet: ' + error.message);
    }
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted data:', tableData);
  };

  return (
    <div className="className=max-w-screen-2xl mx-auto px-12 py-20 min-h-screen mt-5">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden min-h-[750px]">
        <div className="p-8">
          {/* Conditionally render content based on loading or employeeId */}
          {loading ? (
            <div>Loading...</div> 
          ) : !employeeId ? (
            <div className="flex items-center justify-center h-full">
              <h2 className="text-3xl font-bold text-black mt-20">Please select a user in the Navbar</h2>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-8 text-black">Clock In/Out</h1>
              <h1 className="text-4xl font-bold mb-8 text-black">{employeeId}</h1> 

              {/* ... rest of your ClockInOut component code */}
            </>
          )} 
          {/* <h1 className="text-4xl font-bold mb-8 text-black">Clock In/Out</h1>
          <h1 className="text-4xl font-bold mb-8 text-black">{employeeId}</h1> */}
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

          {error && <div className="text-red-500 mb-4">{error}</div>}

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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-black bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 whitespace-nowrap border border-black">
                        {editingRow === row.id ? (
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
                        ) : (
                          row.projectName || 'Not selected'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border border-black">
                        {editingRow === row.id ? (
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
                        ) : (
                          row.task || 'Not selected'
                        )}
                      </td>
                      {['mon', 'tue', 'wed', 'thu', 'fri'].map((day, index) => (
                        <td key={index} className="px-6 py-4 whitespace-nowrap border border-black">
                          {editingRow === row.id ? (
                            <HourInput
                              value={row[day]}
                              onChange={(value) => handleInputChange(row.id, day, value.toString())}
                            />
                          ) : (
                            row[day]
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap border border-black">
                        Pending
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border border-black">
                        {editingRow === row.id ? (
                          <button
                            onClick={() => handleSave(row.id)}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(row.id)}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                          >
                            Edit
                          </button>
                        )}
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
              >
                Add Row
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;