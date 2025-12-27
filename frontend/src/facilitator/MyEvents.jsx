import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Loader from '../components/Loader';

const MyEvents = () => {
  const navigate = useNavigate();

  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  // Fetch facilitator's events
  const fetchMyEvents = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get('/api/events/mine/');
      setEvents(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load your events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Handle delete event
  const handleDelete = async (eventId, eventTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${eventTitle}"?\n\nThis action cannot be undone and all enrollments will be removed.`
    );

    if (!confirmed) return;

    setDeleting(eventId);
    setError('');

    try {
      await axiosInstance.delete(`/api/events/${eventId}/delete/`);
      
      // Remove event from list
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      
      alert('Event deleted successfully!');
    } catch (err) {
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        alert('Failed to delete event. Please try again.');
      }
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

  // Calculate stats
  const totalEvents = events.length;
  const totalEnrollments = events.reduce((sum, event) => sum + event.enrolled_count, 0);
  const upcomingEvents = events.filter(
    (event) => new Date(event.start_date) >= new Date()
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              My Events
            </h1>
            <p className="text-gray-600">
              Manage and monitor your events
            </p>
          </div>
          <Link
            to="/create-event"
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Event
          </Link>
        </div>

        {/* Stats Cards */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-800">{totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-800">{upcomingEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-800">{totalEnrollments}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
        ) : events.length === 0 ? (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Events Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't created any events. Start by creating your first event!
            </p>
            <Link
              to="/create-event"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Event
            </Link>
          </div>
        ) : (
          /* Events List */
          <div className="space-y-6">
            {events.map((event) => {
              const isPast = new Date(event.start_date) < new Date();
              const isDeleting = deleting === event.id;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      {/* Event Details */}
                      <div className="flex-1 mb-4 lg:mb-0">
                        {/* Title and Status */}
                        <div className="flex items-start mb-3">
                          <h3 className="text-2xl font-bold text-gray-800 mr-3">
                            {event.title}
                          </h3>
                          {isPast ? (
                            <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                              Past
                            </span>
                          ) : event.is_full ? (
                            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                              Full
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Event Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {/* Date */}
                          <div className="flex items-center text-gray-600">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{formatDate(event.start_date)}</span>
                          </div>

                          {/* Time */}
                          <div className="flex items-center text-gray-600">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{formatTime(event.start_date)}</span>
                          </div>

                          {/* Location */}
                          <div className="flex items-center text-gray-600">
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
                          <div className="flex items-center text-gray-600">
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
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                              />
                            </svg>
                            <span>{event.language}</span>
                          </div>
                        </div>
                      </div>

                      {/* Enrollment Stats and Actions */}
                      <div className="lg:ml-6 flex flex-col items-start lg:items-end">
                        {/* Enrollment Stats */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 w-full lg:w-48">
                          <div className="text-center mb-3">
                            <div className="text-3xl font-bold text-blue-600">
                              {event.enrolled_count}
                            </div>
                            <div className="text-xs text-gray-600">Total Enrollments</div>
                          </div>
                          <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                            <div>
                              <div className="font-semibold text-gray-700">
                                {event.capacity || '∞'}
                              </div>
                              <div className="text-xs text-gray-500">Capacity</div>
                            </div>
                            <div>
                              <div className="font-semibold text-green-600">
                                {event.available_spots !== null ? event.available_spots : '∞'}
                              </div>
                              <div className="text-xs text-gray-500">Available</div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full lg:w-auto">
                          <Link
                            to={`/events/${event.id}`}
                            className="flex-1 lg:flex-initial px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center font-semibold hover:bg-gray-200 transition-colors text-sm"
                          >
                            View
                          </Link>
                          <Link
                            to={`/edit-event/${event.id}`}
                            className="flex-1 lg:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id, event.title)}
                            disabled={isDeleting}
                            className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                              isDeleting
                                ? 'bg-red-400 text-white cursor-wait'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {isDeleting ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
