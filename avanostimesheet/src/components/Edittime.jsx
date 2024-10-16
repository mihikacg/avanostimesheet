import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import { Pencil, Trash2, X } from 'lucide-react';

const EditTime = ({ selectedDate, timesheetEntries, fetchTimesheetEntries }) => {
  const [projects, setProjects] = useState({});
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const { employeeId } = useUser();

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:4000/projects');
      const projectMap = response.data.reduce((acc, project) => {
        acc[project.Project_ID] = project.Project_Name;
        return acc;
      }, {});
      setProjects(projectMap);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:4000/tasks');
      const taskMap = response.data.reduce((acc, task) => {
        acc[task.Task_ID] = task.Task_Name;
        return acc;
      }, {});
      setTasks(taskMap);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry({ ...entry });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:4000/timesheet/${editingEntry.TimeSheetE}`, editingEntry);
      setEditingEntry(null);
      fetchTimesheetEntries(); // Use the function passed from parent to refresh data
      setError(null);
    } catch (err) {
      console.error('Error saving entry:', err);
      setError(`Failed to save entry: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (entryId) => {
    if (!entryId) {
      setError("Cannot delete this entry. Invalid entry ID.");
      return;
    }

    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`http://localhost:4000/timesheet/${entryId}`);
        fetchTimesheetEntries(); // Use the function passed from parent to refresh data
        setError(null);
      } catch (err) {
        console.error('Error deleting entry:', err);
        setError(`Failed to delete entry: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleInputChange = (e) => {
    setEditingEntry({ ...editingEntry, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="text-center py-4 text-black">Loading existing entries...</div>;
  }

  return (
    <div className="mt-8 bg-white shadow-xl rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-4xl font-bold mb-8 text-black">Edit Existing Entries</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold mr-1">Error:</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timesheetEntries.map((entry) => (
                <tr key={entry.TimeSheetE}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingEntry?.TimeSheetE === entry.TimeSheetE ? (
                      <select
                        name="Project_ID"
                        value={editingEntry.Project_ID}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {Object.entries(projects).map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    ) : projects[entry.Project_ID]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingEntry?.TimeSheetE === entry.TimeSheetE ? (
                      <select
                        name="Task_ID"
                        value={editingEntry.Task_ID}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {Object.entries(tasks).map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    ) : tasks[entry.Task_ID]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingEntry?.TimeSheetE === entry.TimeSheetE ? (
                      <input
                        type="number"
                        name="Hours"
                        value={editingEntry.Hours}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    ) : entry.Hours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.Entry_Date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${entry.Status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        entry.Status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {entry.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {entry.Status === 'Pending' && (
                      editingEntry?.TimeSheetE === entry.TimeSheetE ? (
                        <>
                          <button onClick={handleSave} className="text-green-600 hover:text-green-900 mr-2">
                            Save
                          </button>
                          <button onClick={() => setEditingEntry(null)} className="text-gray-600 hover:text-gray-900">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(entry)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleDelete(entry.TimeSheetE)} className="text-red-600 hover:text-red-900">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )
                    )}
                    {entry.Status !== 'Pending' && (
                      <X size={18} className="text-gray-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditTime;