import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component to guard routes that require authentication
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.requiredRole - Optional role required (e.g., 'seeker', 'facilitator')
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check role if requiredRole is specified
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
            <br />
            Required role: <span className="font-semibold">{requiredRole}</span>
            <br />
            Your role: <span className="font-semibold">{user?.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return children;
};

export default ProtectedRoute;
