import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isSeeker, isFacilitator, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide navbar on login/signup pages
  const hideNavbarPaths = ['/login', '/signup', '/verify-otp'];
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;
  }

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on link click
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="text-2xl font-bold hover:text-blue-200 transition-colors"
          >
            Events Platform
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated() ? (
            <>
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-6">
                {/* Seeker Links */}
                {isSeeker() && (
                  <>
                    <Link
                      to="/events"
                      className="hover:text-blue-200 transition-colors"
                    >
                      Events
                    </Link>
                    <Link
                      to="/my-enrollments"
                      className="hover:text-blue-200 transition-colors"
                    >
                      My Enrollments
                    </Link>
                  </>
                )}

                {/* Facilitator Links */}
                {isFacilitator() && (
                  <>
                    <Link
                      to="/my-events"
                      className="hover:text-blue-200 transition-colors"
                    >
                      My Events
                    </Link>
                    <Link
                      to="/create-event"
                      className="hover:text-blue-200 transition-colors"
                    >
                      Create Event
                    </Link>
                  </>
                )}

                {/* User Info & Logout */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
                    {user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </>
          ) : (
            // Not authenticated - show login/signup
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="hover:text-blue-200 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isAuthenticated() && isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {/* Seeker Links */}
              {isSeeker() && (
                <>
                  <Link
                    to="/events"
                    onClick={closeMobileMenu}
                    className="hover:text-blue-200 transition-colors py-2"
                  >
                    Events
                  </Link>
                  <Link
                    to="/my-enrollments"
                    onClick={closeMobileMenu}
                    className="hover:text-blue-200 transition-colors py-2"
                  >
                    My Enrollments
                  </Link>
                </>
              )}

              {/* Facilitator Links */}
              {isFacilitator() && (
                <>
                  <Link
                    to="/my-events"
                    onClick={closeMobileMenu}
                    className="hover:text-blue-200 transition-colors py-2"
                  >
                    My Events
                  </Link>
                  <Link
                    to="/create-event"
                    onClick={closeMobileMenu}
                    className="hover:text-blue-200 transition-colors py-2"
                  >
                    Create Event
                  </Link>
                </>
              )}

              {/* User Info */}
              <div className="pt-3 border-t border-blue-500">
                <p className="text-sm text-blue-200 mb-3">{user?.email}</p>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
