import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import { CheckCircle, XCircle } from 'lucide-react';

const Approve = () => {
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [projects, setProjects] = useState({});
  const [tasks, setTasks] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [loading, setLoading] = useState(true);
  const { employeeId, userRole, loading: contextLoading } = useUser();

  useEffect(() => {
    if (!contextLoading && employeeId) {
      fetchData();
    }
  }, [employeeId, contextLoading]);


const ActionButton = ({ onClick, label, color }) => {
  const baseClasses = "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer";
  const colorClasses = {
    green: "bg-green-100 text-green-800 hover:bg-green-200",
    red: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${colorClasses[color]}`}
    >
      {label}
    </button>
  );
};

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timesheetResponse, projectsResponse, tasksResponse] = await Promise.all([
        axios.get(`http://localhost:4000/approval-timesheet/${employeeId}`), 
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId) => {
    try {
      await axios.post(`http://localhost:4000/approve-timesheet/${entryId}`);
      fetchData(); // Refresh the data after approval
    } catch (error) {
      console.error('Error approving timesheet entry:', error);
    }
  };

  const handleReject = async (entryId) => {
    try {
      await axios.post(`http://localhost:4000/reject-timesheet/${entryId}`);
      fetchData(); // Refresh the data after rejection
    } catch (error) {
      console.error('Error rejecting timesheet entry:', error);
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
    let sortableItems = [...entries];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'Project_Name') {
          return projects[a.Project_ID].localeCompare(projects[b.Project_ID]);
        }
        if (sortConfig.key === 'Task_Name') {
          return tasks[a.Task_ID].localeCompare(tasks[b.Task_ID]);
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  };

  const pendingEntries = getSortedEntries(timesheetEntries.filter(entry => entry.Status === 'Pending'));
  const approvedEntries = getSortedEntries(timesheetEntries.filter(entry => entry.Status === 'Approved'));

  const renderTable = (entries, title, showApproveButton = false) => (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden min-h-[550px] mb-8">
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8 text-black">{title}</h1>
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                  Employee
                </th>
                <th onClick={() => requestSort('Project_Name')} className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider cursor-pointer">
                  Project Name
                </th>
                <th onClick={() => requestSort('Task_Name')} className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider cursor-pointer">
                  Task Name
                </th>
                <th onClick={() => requestSort('Hours')} className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider cursor-pointer">
                  Hours Worked
                </th>
                <th onClick={() => requestSort('Entry_Date')} className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider cursor-pointer">
                  Date
                </th>
                {showApproveButton && (
                  <th className="px-5 py-4 border-b-2 border-gray-200 text-left text-sm font-semibold text-black uppercase tracking-wider">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.TimeSheetE} className="hover:bg-gray-50">
                  <td className="px-5 py-5 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{`${entry.First_name} ${entry.Last_name}`}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{projects[entry.Project_ID] || 'Unknown Project'}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{tasks[entry.Task_ID] || 'Unknown Task'}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{entry.Hours}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{new Date(entry.Entry_Date).toLocaleDateString()}</p>
                  </td>
                  {showApproveButton && (
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <>
                        <ActionButton
                          onClick={() => handleApprove(entry.TimeSheetE)}
                          label="Approve"
                          color="green"
                        />
                        <span className="mx-1"></span>
                        <ActionButton
                          onClick={() => handleReject(entry.TimeSheetE)}
                          label="Reject"
                          color="red"
                        />
                      </>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (contextLoading || loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }


  return (
    <div className="class=max-w-screen-2xl mx-auto px-12 py-20 min-h-screen mt-5">
      {renderTable(pendingEntries, "Approval Requests", true)}
      {renderTable(approvedEntries, "Approved Requests")}
    </div>
  );
};

export default Approve;