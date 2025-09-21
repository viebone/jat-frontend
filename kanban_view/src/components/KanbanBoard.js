import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Column from './Column';
import AddJob from './AddJob';
import EditJob from './EditJob';
import ListToolbar from './ListToolbar';
import ConfirmModal from './ConfirmModal';
import Header from './Header';

const stages = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

function KanbanBoard({ fetchCsrfToken }) {
  const [jobList, setJobList] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [nickname, setNickname] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authenticated state
  const [loading, setLoading] = useState(true); // Loading state to manage initial load
  const [error, setError] = useState(null); // Error state to track network issues
  const apiUrl = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();

  // Fetch user details with useCallback to avoid re-creation on each render
  const fetchUserDetails = useCallback(() => {
    console.log('Fetching user details...'); // Debugging log
    axios.get(`${apiUrl}/api/user-details`, { 
      withCredentials: true,
      headers:{
        'Content-Type': 'application/json',
      },
     })
      .then(response => {
        console.log('User details fetched successfully:', response.data); // Debugging success log
        setNickname(response.data.nickname); // Set user nickname
        setIsAuthenticated(true); // Mark user as authenticated
        setLoading(false); // Stop loading after user details are fetched
      })
      .catch(error => {
        console.error('Error fetching user details:', error); // Debugging error log
        if (error.response && error.response.status === 401) {
          navigate('/login'); // Redirect to login if unauthenticated
        } else if (error.message === 'Network Error') {
          setError('Cannot connect to the server. Please check your connection.');
        } else {
          setError('Unable to connect to the server. Please try again later.');
        }
        setLoading(false); // Stop loading even on error
      });
  }, [apiUrl, navigate]);

  // Fetch jobs only if the user is authenticated
  const fetchJobs = useCallback((filters = {}) => {
    console.log('Fetching jobs with filters:', filters); // Debugging log
    setActiveFilters(filters);
    const queryParams = new URLSearchParams(filters).toString();
    axios.get(`${apiUrl}/api/jobs?${queryParams}`, { withCredentials: true })
      .then(response => {
        console.log('Jobs fetched successfully:', response.data); // Debugging success log
        if (Array.isArray(response.data)) {
          setJobList(response.data);
          setFilteredJobs(response.data);
        } else {
          setJobList([]);
          setFilteredJobs([]);
        }
      })
      .catch(error => {
        console.error('Error fetching job data:', error); // Debugging error log
        if (error.response && error.response.status === 401) {
          navigate('/login'); // Redirect to login if unauthenticated
        } else if (error.message === 'Network Error') {
          setError('Cannot connect to the server. Please check your connection.');
        } else {
          setError('Unable to fetch job data. Please try again later.');
        }
      });
  }, [apiUrl, navigate]);

  const handleLogout = () => {
    console.log('Logging out...'); // Debugging log
    axios.post(`${apiUrl}/logout`, {}, { withCredentials: true })
      .then(() => {
        console.log('Logout successful'); // Debugging success log
        window.location.href = '/'; // Redirect on logout
      })
      .catch(error => {
        console.error('Error logging out:', error); // Debugging error log
      });
  };

  // Load user details on component mount
  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Fetch jobs if the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
    }
  }, [fetchJobs, isAuthenticated]);

  const handleFilter = (filters) => {
    fetchJobs(filters);
  };

  const handleDrop = (jobId, newStage) => {
    console.log('Handling job drop...', jobId, newStage); // Debugging log
    const updatedJob = jobList.find(job => job.id === jobId);
    if (updatedJob) {
      updatedJob.status = newStage;
      axios.put(`${apiUrl}/api/jobs/${jobId}`, { status: newStage }, { withCredentials: true })
        .then(() => {
          console.log('Job updated successfully'); // Debugging success log
          setJobList(prevJobs =>
            prevJobs.map(job =>
              job.id === jobId ? { ...job, status: newStage } : job
            )
          );
          setFilteredJobs(prevJobs =>
            prevJobs.map(job =>
              job.id === jobId ? { ...job, status: newStage } : job
            )
          );
        })
        .catch(error => console.error('Error updating job:', error)); // Debugging error log
    } else {
      console.error('Job not found:', jobId); // Debugging error log
    }
  };

  const handleJobAdded = () => {
    fetchJobs(); // Refetch jobs after adding a new job
    setIsAddModalOpen(false);
  };

  const handleJobEdited = () => {
    fetchJobs(); // Refetch jobs after editing
    setIsEditModalOpen(false);
  };

  const handleDeleteJob = (jobId) => {
    setShowConfirmModal(true);
    setJobToDelete(jobId);
  };

  const confirmDelete = () => {
    console.log('Deleting job...', jobToDelete); // Debugging log
    axios.delete(`${apiUrl}/api/jobs/${jobToDelete}`, { withCredentials: true })
      .then(() => {
        console.log('Job deleted successfully'); // Debugging success log
        setJobList(prevJobs => prevJobs.filter(job => job.id !== jobToDelete));
        setFilteredJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete));
        setShowConfirmModal(false);
        setJobToDelete(null);
      })
      .catch(error => console.error('Error deleting job:', error)); // Debugging error log
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setJobToDelete(null);
  };

  // If still loading user details, display loading message
  if (loading) {
    console.log('Loading...'); // Debugging log
    return <div>Loading...</div>;
  }

  // **Early Return for Error State**
  if (error) {
    console.log('Rendering error:', error); // Debugging log
    return <div className="text-red-500">{error}</div>;  // Red text for error
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Header nickname={nickname} onLogout={handleLogout} />

      <ListToolbar
        onAddNewJob={() => setIsAddModalOpen(true)}
        filters={activeFilters}
        onFilter={handleFilter}
        onReset={() => fetchJobs({})}
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-lg mx-auto max-h-screen overflow-y-auto pb-4">
            <h2 className="text-xl font-bold mb-4">Add New Job</h2>
            <AddJob onJobAdded={handleJobAdded} />
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsAddModalOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-lg mx-auto max-h-screen overflow-y-auto pb-4">
            <h2 className="text-xl font-bold mb-4">Edit Job</h2>
            {jobToEdit && <EditJob job={jobToEdit} onJobEdited={handleJobEdited} fetchCsrfToken={fetchCsrfToken} />}
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsEditModalOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <DndProvider backend={HTML5Backend}>
        <div className="flex space-x-4 overflow-x-auto">
          {stages.map(stage => (
            <Column
              key={stage}
              stage={stage}
              jobs={(filteredJobs || []).filter(job => job.status === stage)}
              onDrop={handleDrop}
              onEdit={job => {
                setJobToEdit(job);
                setIsEditModalOpen(true);
              }}
              onDelete={handleDeleteJob}
            />
          ))}
        </div>
      </DndProvider>

      <ConfirmModal
        show={showConfirmModal}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        message="Are you sure you want to delete this job?"
      />
    </div>
  );
}

export default KanbanBoard;
