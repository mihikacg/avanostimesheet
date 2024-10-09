import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import { useUser } from '../UserContext'; // Adjust the import path as needed

const Dashboard = () => {
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [projects, setProjects] = useState({});
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const { employeeId } = useUser(); // Get the employee ID from the user context

  function getCurrentWeek() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return { year: now.getFullYear(), week: weekNumber };
  }

  function getWeekDates(year, week) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const startDate = new Date(simple);
    if (dow <= 4)
      startDate.setDate(simple.getDate() - simple.getDay() + 1);
    else
      startDate.setDate(simple.getDate() + 8 - simple.getDay());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return { start: startDate, end: endDate };
  }

  function formatDateRange(start, end) {
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${start.getFullYear()}`;
  }

  const weekOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentWeek = getCurrentWeek().week;

    for (let year = currentYear; year > currentYear - 5; year--) {
      const maxWeeks = year === currentYear ? currentWeek : 52;

      for (let week = maxWeeks; week >= 1; week--) {
        const dates = getWeekDates(year, week);
        options.push({
          value: `${year}-${week}`,
          label: formatDateRange(dates.start, dates.end)
        });
      }
    }

    return options;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const weekDates = getWeekDates(selectedWeek.year, selectedWeek.week);
        const weekStartDate = weekDates.start.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        const [timesheetResponse, projectsResponse, tasksResponse] = await Promise.all([
          axios.get(`http://localhost:4000/timesheet/${employeeId}`, {
            params: { weekStart: weekStartDate }
          }),
          axios.get('http://localhost:4000/projects'),
          axios.get('http://localhost:4000/tasks')
        ]);

        setTimesheetEntries(timesheetResponse.data);
        
        const projectMap = projectsResponse.data.reduce((acc, project) => {
          acc[project.Project_ID] = project.Project_Name;
          return acc;
        }, {});
        setProjects(projectMap);

        const taskMap = tasksResponse.data.reduce((acc, task) => {
          acc[task.Task_ID] = task.Task_Name;
          return acc;
        }, {});
        setTasks(taskMap);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchData();
    }
  }, [selectedWeek, employeeId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownPosition(spaceBelow < 200 ? 'top' : 'bottom');
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const changeWeek = (yearWeek) => {
    const [year, week] = yearWeek.split('-').map(Number);
    setSelectedWeek({ year, week });
    setIsDropdownOpen(false);
  };

  const { approvedHours, pendingHours,rejectedHours} = useMemo(() => {
    return timesheetEntries.reduce((acc, entry) => {
      if (entry.Status === 'Approved') {
        acc.approvedHours += entry.Hours;
      }  if (entry.Status === 'Pending') {
        acc.pendingHours += entry.Hours;
      }else if (entry.Status === 'Rejected') {
        acc.rejectedHours += entry.Hours;
      }
      return acc;
    }, { approvedHours: 0, pendingHours: 0,rejectedHours:0 });
  }, [timesheetEntries]);

  if (loading) {
    return <div className="text-center py-20 text-black text-xl">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500 text-xl">{error}</div>;
  }

  const currentWeekDates = getWeekDates(selectedWeek.year, selectedWeek.week);

  return (
    <div className="class=max-w-screen-2xl mx-auto px-12 py-20 min-h-screen mt-5">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden min-h-[750px]">
        <div className="p-8">
          <h1 className="text-4xl font-bold mb-8 text-black">Dashboard</h1>
          
          <div className="mb-8">
            <div className="relative w-full lg:w-80" ref={dropdownRef}>
              <button 
                onClick={toggleDropdown}
                className="flex items-center justify-between w-full px-5 py-3 text-lg text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{formatDateRange(currentWeekDates.start, currentWeekDates.end)}</span>
                <ChevronDown className="w-6 h-6 ml-2" />
              </button>
              {isDropdownOpen && (
                <div 
                  className={`absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto max-h-80 ${
                    dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                  }`}
                >
                  {weekOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => changeWeek(option.value)}
                      className="block w-full text-left px-5 py-3 text-base text-black hover:bg-gray-100"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full leading-normal">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {timesheetEntries.map((entry) => (
                  <tr key={entry.TimeSheetE} className="hover:bg-gray-50">
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{projects[entry.Project_ID] || 'Unknown Project'}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{tasks[entry.Task_ID] || 'Unknown Task'}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{entry.Hours} hours</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{new Date(entry.Entry_Date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className={`whitespace-no-wrap ${entry.Status === 'Approved' ? 'text-green-500' : entry.Status === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {entry.Status}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan="5" className="px-5 py-3 border-b border-gray-200 text-base">
                    <div className="flex justify-center items-center">
                      <p className="text-black">
                        Approved: <span className="font-semibold text-green-500">{approvedHours} hours</span>
                        <span className="mx-2">|</span>
                        Pending: <span className="font-semibold text-yellow-500">{pendingHours} hours</span>
                        <span className="mx-2">|</span>
                        Rejected: <span className="font-semibold text-red-500">{rejectedHours} hours</span>
                      </p>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;