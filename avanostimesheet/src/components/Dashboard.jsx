import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

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
    const fetchProjects = async () => {
      setLoading(true);
      // try {
      //   const response = await axios.get('http://localhost:4000/projects');
      //   const projectsList = response.data.map(project => ({
      //     name: project.Project_Name,
      //     id: project.Project_ID,
      //     desc: project.Project_Desc, // Make sure this field exists in your API response
      //     type: project.Project_Type
      //   }));
      //   setProjects(projectsList);
      //   setLoading(false);
      // } 
      try {
        // Simulating an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockProjects = [
          { id: 1, name: 'Project Alpha', hours: 20, date: '2024-09-18' },
          { id: 2, name: 'Project Beta', hours: 15, date: '2024-09-11' },
          { id: 3, name: 'Project Gamma', hours: 30, date: '2024-09-4' },
          { id: 4, name: 'Project Delta', hours: 10, date: '2024-09-5' },
          { id: 5, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 6, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 7, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 8, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 9, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 10, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 11, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 12, name: 'Project Epsilon', hours: 25, date: '2024-09-17' },
          { id: 13, name: 'Project Epsilon', hours: 25, date: '2024-09-17' }
        ];
        setProjects(mockProjects);
      } 
      catch (err) {
        setError('Failed to fetch projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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

  const filteredProjects = projects.filter(project => {
    const projectDate = new Date(project.date);
    const weekDates = getWeekDates(selectedWeek.year, selectedWeek.week);
    return projectDate >= weekDates.start && projectDate <= weekDates.end;
  });

  const totalHours = filteredProjects.reduce((sum, project) => sum + project.hours, 0);

  if (loading) {
    return <div className="text-center py-20 text-black text-xl">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500 text-xl">{error}</div>;
  }

  const currentWeekDates = getWeekDates(selectedWeek.year, selectedWeek.week);

  return (
    <div className="className=max-w-screen-2xl mx-auto px-12 py-20 min-h-screen mt-5">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden min-h-[750px]">
        <div className="p-8">
          <h1 className="text-4xl font-bold mb-8 text-black">Dashboard</h1>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
            <div className="relative w-full lg:w-auto" ref={dropdownRef}>
              <button 
                onClick={toggleDropdown}
                className="flex items-center justify-between w-full lg:w-80 px-5 py-3 text-lg text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{formatDateRange(currentWeekDates.start, currentWeekDates.end)}</span>
                <ChevronDown className="w-6 h-6 ml-2" />
              </button>
              {isDropdownOpen && (
                <div 
                  className={`absolute z-10 w-full lg:w-80 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto max-h-80 ${
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
            <div className="text-2xl font-bold text-black">
              Total Hours: {totalHours}
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
                    Hours Worked
                  </th>
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{project.name}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{project.hours} hours</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-base">
                      <p className="text-black whitespace-no-wrap">{new Date(project.date).toLocaleDateString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;