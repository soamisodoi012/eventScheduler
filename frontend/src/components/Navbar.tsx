import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Event Scheduler</Link>

        <div className="flex space-x-4 relative">
          {isAuthenticated ? (
            <>
              <Link to="/" className="hover:text-gray-300">Calendar</Link>
              <Link to="/list" className="hover:text-gray-300">Upcoming Events</Link>

              <div className="relative">
                <button 
                  onClick={toggleDropdown}
                  className="hover:text-gray-300 flex items-center"
                >
                  <span className="mr-2">👤</span>
                  Profile
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 bg-gray-700 text-white mt-2 rounded shadow-lg min-w-[160px] z-10">
                    <Link 
                      to="/change-password"
                      className="block px-4 py-2 hover:bg-gray-600"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Change Password
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="hover:text-gray-300">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
