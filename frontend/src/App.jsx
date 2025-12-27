import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth Pages
import Signup from './auth/Signup';
import VerifyOTP from './auth/VerifyOTP';
import Login from './auth/Login';

// Seeker Pages
import EventList from './seeker/EventList';
import EventDetails from './seeker/EventDetails';
import MyEnrollments from './seeker/MyEnrollments';

// Facilitator Pages
import CreateEvent from './facilitator/CreateEvent';
import MyEvents from './facilitator/MyEvents';
import EditEvent from './facilitator/EditEvent';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/login" element={<Login />} />

            {/* Seeker Protected Routes */}
            <Route
              path="/events"
              element={
                <ProtectedRoute requiredRole="seeker">
                  <EventList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-enrollments"
              element={
                <ProtectedRoute requiredRole="seeker">
                  <MyEnrollments />
                </ProtectedRoute>
              }
            />

            {/* Facilitator Protected Routes */}
            <Route
              path="/my-events"
              element={
                <ProtectedRoute requiredRole="facilitator">
                  <MyEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-event"
              element={
                <ProtectedRoute requiredRole="facilitator">
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-event/:id"
              element={
                <ProtectedRoute requiredRole="facilitator">
                  <EditEvent />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 Not Found */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a
                      href="/login"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-block"
                    >
                      Go to Login
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
