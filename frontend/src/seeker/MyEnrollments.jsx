import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Loader from '../components/Loader';

const MyEnrollments = () => {
  // State management
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'

  // Fetch enrollments
  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get('/events/enrollments/my-enrollments/');
      setEnrollments(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load your enrollments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  // Filter enrollments by date
  const now = new Date();
  const upcomingEnrollments = enrollments.filter(
    (enrollment) => new Date(enrollment.event.start_date) >= now
  );
  const pastEnrollments = enrollments.filter(
    (enrollment) => new Date(enrollment.event.start_date) < now
  );

  // Get current list based on active tab
  const currentEnrollments = activeTab === 'upcoming' ? upcomingEnrollments : pastEnrollments;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format enrollment date
  const formatEnrollmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            My Enrollments
          </h1>
          <p className="text-gray-600">
            View and manage your event enrollments
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Upcoming Events
              {upcomingEnrollments.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                  {upcomingEnrollments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Past Events
              {pastEnrollments.length > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {pastEnrollments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader size="large" />
          </div>
        ) : currentEnrollments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {activeTab === 'upcoming' ? 'No Upcoming Enrollments' : 'No Past Enrollments'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming'
                ? "You haven't enrolled in any upcoming events yet."
                : "You don't have any past event enrollments."}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/events"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Events
              </Link>
            )}
          </div>
        ) : (
          /* Enrollments List */
          <div className="space-y-4">
            {currentEnrollments.map((enrollment) => {
              const { event } = enrollment;
              const isPast = activeTab === 'past';

              return (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Date Badge */}
                    <div className={`flex-shrink-0 ${isPast ? 'bg-gray-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'} text-white p-6 md:w-32 flex flex-col items-center justify-center text-center`}>
                      <div className="text-3xl font-bold">
                        {new Date(event.start_date).getDate()}
                      </div>
                      <div className="text-sm font-semibold uppercase">
                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs">
                        {new Date(event.start_date).getFullYear()}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 mb-4 md:mb-0">
                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {event.title}
                          </h3>

                          {/* Facilitator */}
                          <p className="text-sm text-gray-600 mb-3">
                            by <span className="font-semibold">{event.facilitator_name}</span>
                          </p>

                          {/* Event Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {/* Time */}
                            <div className="flex items-center text-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>{formatTime(event.start_date)}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center text-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 text-purple-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span>{event.location}</span>
                            </div>

                            {/* Language */}
                            <div className="flex items-center text-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                />
                              </svg>
                              <span>{event.language}</span>
                            </div>

                            {/* Enrolled Date */}
                            <div className="flex items-center text-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 text-orange-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-xs">
                                Enrolled on {formatEnrollmentDate(enrollment.enrolled_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0 md:ml-6">
                          <Link
                            to={`/events/${event.id}`}
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator for Upcoming Events */}
                  {!isPast && (
                    <div className="bg-green-50 border-t border-green-200 px-6 py-2">
                      <p className="text-sm text-green-700 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-semibold">Confirmed</span>
                        <span className="mx-2">•</span>
                        <span>Starting {formatDate(event.start_date)}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && enrollments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Enrollment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {enrollments.length}
                </div>
                <div className="text-sm text-gray-600">Total Enrollments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {upcomingEnrollments.length}
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {pastEnrollments.length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnrollments;
