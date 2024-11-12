import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Pencil, Trash2, X } from 'lucide-react';

const EditTime = React.memo(({ selectedDate, employeeId, onEntriesUpdate }) => {
  // State declarations
  const [localEntries, setLocalEntries] = useState([]);
  const [projects, setProjects] = useState({});
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Data fetching functions
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/projects');
      const projectMap = response.data.reduce((acc, project) => {
        acc[project.Project_ID] = project.Project_Name;
        return acc;
      }, {});
      setProjects(projectMap);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/tasks');
      const taskMap = response.data.reduce((acc, task) => {
        acc[task.Task_ID] = task.Task_Name;
        return acc;
      }, {});
      setTasks(taskMap);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!employeeId || !selectedDate) return;
    
    try {
      const response = await axios.get(`http://localhost:4000/timesheet/${employeeId}`, {
        params: { weekStart: selectedDate }
      });
      setLocalEntries(response.data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }, [employeeId, selectedDate]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchEntries()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchTasks, fetchEntries]);
  // Effects
  useEffect(() => {
    if (isInitialLoad) {
      const loadStaticData = async () => {
        try {
          await Promise.all([fetchProjects(), fetchTasks()]);
        } catch (err) {
          setError('Failed to load initial data');
        }
        setIsInitialLoad(false);
      };
      loadStaticData();
    }
  }, [isInitialLoad, fetchProjects, fetchTasks]);

  useEffect(() => {
    if (employeeId && selectedDate) {
      const loadData = async () => {
        setLoading(true);
        try {
          await fetchAllData();
        } catch (err) {
          console.error('Error loading data:', err);
          setError('Failed to load data');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [employeeId, selectedDate, fetchAllData]);

  useEffect(() => {
    if (onEntriesUpdate) {
      fetchEntries();
    }
  }, [onEntriesUpdate, fetchEntries]);

  // Calculation functions
  const calculateTotalHours = useCallback((entries = [], currentEditingEntry = null) => {
    return entries.reduce((total, entry) => {
      if (currentEditingEntry && entry.TimeSheetEntry_ID === currentEditingEntry.TimeSheetEntry_ID) {
        return total + (parseFloat(currentEditingEntry.Hours) || 0);
      }
      if (entry.Status === 'Rejected' || entry.TimeSheetEntry_ID === editingEntry?.TimeSheetEntry_ID) {
        return total;
      }
      return total + (parseFloat(entry.Hours) || 0);
    }, 0);
  }, [editingEntry]);

  // Event handlers
  const handleEdit = useCallback((entry) => {
    setEditingEntry({ ...entry });
    setError(null); // Clear any existing errors when starting to edit
  }, []);

  const handleCancel = useCallback(() => {
    setEditingEntry(null);
    setError(null); // Clear any errors when cancelling
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'Hours') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setError('Hours must be greater than 0');
        return;
      }
      setError(null);
    }
    
    setEditingEntry(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    try {
      const hours = parseFloat(editingEntry.Hours);
      
      if (isNaN(hours) || hours <= 0) {
        setError('Hours must be greater than 0');
        return;
      }

      const otherEntriesHours = calculateTotalHours(localEntries);
      const totalHours = otherEntriesHours + hours;

      if (totalHours > 40) {
        setError('Total hours for the week cannot exceed 40');
        return;
      }

      await axios.put(`http://localhost:4000/timesheet/${editingEntry.TimeSheetEntry_ID}`, editingEntry);
      setEditingEntry(null);
      await fetchEntries();
      if (onEntriesUpdate) onEntriesUpdate();
      setError(null);
    } catch (err) {
      console.error('Error saving entry:', err);
      setError(err.response?.data?.message || 'Failed to save entry');
    }
  };

  const handleDelete = async (entryId) => {
    try {
      await axios.delete(`http://localhost:4000/timesheet/${entryId}`);
      await fetchEntries();
      if (onEntriesUpdate) onEntriesUpdate();
      setError(null);
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError(err.response?.data?.message || 'Failed to delete entry');
    }
  };
  // Conditional renders
  if (loading && isInitialLoad) {
    return (
      <div className="mt-8 bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="text-center py-4 text-gray-500">Loading timesheet entries...</div>
        </div>
      </div>
    );
  }


  if (!localEntries.length) {
    return (
      <div className="mt-8 bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-4xl font-bold mb-8 text-black">Edit Existing Entries</h2>
          <div className="text-center py-4 text-gray-500">No entries found for this period.</div>
        </div>
      </div>
    );
  }

  // Main render - Component Header and Table Header
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
              {localEntries.map((entry) => (
                <tr key={entry.TimeSheetEntry_ID}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingEntry?.TimeSheetEntry_ID === entry.TimeSheetEntry_ID ? (
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
                    ) : (projects[entry.Project_ID] || 'Unknown Project')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingEntry?.TimeSheetEntry_ID === entry.TimeSheetEntry_ID ? (
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
                    ) : (tasks[entry.Task_ID] || 'Unknown Task')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingEntry?.TimeSheetEntry_ID === entry.TimeSheetEntry_ID ? (
                      <input
                        type="number"
                        name="Hours"
                        value={editingEntry.Hours}
                        onChange={handleInputChange}
                        min="1"
                        step="1"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    ) : entry.Hours || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.Entry_Date ? new Date(entry.Entry_Date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${entry.Status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        entry.Status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {entry.Status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(entry.Status === 'Pending' || entry.Status === 'InProgress') && (
                      editingEntry?.TimeSheetEntry_ID === entry.TimeSheetEntry_ID ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={handleSave} 
                            className="text-green-600 hover:text-green-900"
                            disabled={!!error}
                          >
                            Save
                          </button>
                          <button 
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-4">
                          <button 
                            onClick={() => handleEdit(entry)} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.TimeSheetEntry_ID)} 
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )
                    )}
                    {(entry.Status !== 'Pending' && entry.Status !== 'InProgress') && (
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
}, (prevProps, nextProps) => {
  return prevProps.selectedDate === nextProps.selectedDate &&
         prevProps.employeeId === nextProps.employeeId &&
         prevProps.onEntriesUpdate === nextProps.onEntriesUpdate;
});

export default EditTime;  