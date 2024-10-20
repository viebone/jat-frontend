import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';  // Import BrowserRouter
import Register from './components/Register';
import Login from './components/Login';
import KanbanBoard from './components/KanbanBoard';
import axios from 'axios'; // Import axios for HTTP requests

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';  // Use a fallback URL if env var is missing

// Define fetchCsrfToken function here
const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/get-csrf-token`, { withCredentials: true });
    return response.data.csrf_token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);  // Loading state to check auth status
  const [isRegister, setIsRegister] = useState(false); // Toggle for login/register view
  const [authError, setAuthError] = useState(null);  // Track errors if authentication fails

  // Handle successful registration
  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Check authentication status on page load/refresh
  useEffect(() => {
    axios.get(`${apiUrl}/api/user-details`, { withCredentials: true })
      .then(response => {
        if (response.status === 200 && response.data.nickname) {
          setIsAuthenticated(true);  // User is authenticated
        } else {
          setIsAuthenticated(false); // User is not authenticated
        }
        setLoading(false);  // Stop loading after check
      })
      .catch(error => {
        setIsAuthenticated(false);
        setLoading(false);
        setAuthError('Please log in to access the application.'); // Set error if authentication fails
      });
  }, []);

  // Fetch the CSRF token after authentication status is confirmed
  useEffect(() => {
    const setAxiosDefaults = async () => {
      const csrfToken = await fetchCsrfToken();
      if (csrfToken) {
        // Set Axios default headers to include the CSRF token for all requests
        axios.defaults.headers.common['X-CSRFToken'] = csrfToken;
      } else {
        console.error("CSRF token could not be fetched.");
      }
    };

    if (isAuthenticated) {
      setAxiosDefaults();  // Fetch and set CSRF token after authentication is confirmed
    }
  }, [isAuthenticated]);  // Refetch CSRF only if user is authenticated

  if (loading) {
    return <div>Loading...</div>;  // Show loading while checking auth status
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        {isAuthenticated ? (
          // Show KanbanBoard when authenticated
          <div className="w-full max-w-full h-full overflow-y-auto">
            <KanbanBoard fetchCsrfToken={fetchCsrfToken} />
          </div>
        ) : (
          // Show login/register form if not authenticated
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            {authError && <div className="text-red-500 mb-4">{authError}</div>}
            <div className="flex justify-between mb-4">
              <h1 className="text-2xl font-bold">
                {isRegister ? 'Register' : 'Login'}
              </h1>
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-600 hover:underline"
              >
                {isRegister ? 'Switch to Login' : 'Switch to Register'}
              </button>
            </div>
            
            {isRegister ? (
              <Register onRegisterSuccess={handleRegisterSuccess} fetchCsrfToken={fetchCsrfToken} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
