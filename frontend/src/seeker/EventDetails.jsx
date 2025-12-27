import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import Loader from '../components/Loader';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSeeker } = useAuth();

  // State management
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Fetch event details
  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/events/${id}/`);
      setEvent(response.data);

      // Check if user is already enrolled
      if (isSeeker()) {
        try {
          const enrollmentsResponse = await axiosInstance.get('/events/enrollments/my-enrollments/');
          const enrolled = enrollmentsResponse.data.results.some(
            (enrollment) => enrollment.event.id === parseInt(id)
          );
          setIsEnrolled(enrolled);
        } catch (err) {
          // Silent fail for enrollment check
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Event not found.');
      } else {
        setError('Failed to load event details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  // Handle enrollment
  const handleEnroll = async () => {
    setEnrolling(true);
    setError('');

    try {
      await axiosInstance.post(`/events/${id}/enroll/`);
      setIsEnrolled(true);
      
      // Refresh event data to update enrollment count
      const response = await axiosInstance.get(`/events/${id}/`);
      setEvent(response.data);

      // Show success message
      alert('Successfully enrolled in the event!');
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.detail) {
          setError(errorData.detail);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          setError('Failed to enroll. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  // Calculate duration
  const calculateDuration = () => {
    if (!event) return '';
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours} hours`;
    } else {
      return `${minutes} minutes`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800 font-medium"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-10">
            <h1 className="text-4xl font-bold text-white mb-3">
              {event.title}
            </h1>
            <p className="text-blue-100 text-lg">
              Facilitated by <span className="font-semibold">{event.facilitator_name}</span>
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">About This Event</h2>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Location */}
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3 mr-4">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Location</h3>
                  <p className="text-lg text-gray-800">{event.location}</p>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3 mr-4">
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
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Language</h3>
                  <p className="text-lg text-gray-800">{event.language}</p>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3 mr-4">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Start Date & Time</h3>
                  <p className="text-lg text-gray-800">{formatDate(event.start_date)}</p>
                  <p className="text-md text-gray-600">{formatTime(event.start_date)}</p>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3 mr-4">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">End Date & Time</h3>
                  <p className="text-lg text-gray-800">{formatDate(event.end_date)}</p>
                  <p className="text-md text-gray-600">{formatTime(event.end_date)}</p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3 mr-4">
                  <svg
                    className="w-6 h-6 text-yellow-600"
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
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Duration</h3>
                  <p className="text-lg text-gray-800">{calculateDuration()}</p>
                </div>
              </div>

              {/* Capacity */}
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3 mr-4">
                  <svg
                    className="w-6 h-6 text-orange-600"
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
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Capacity</h3>
                  <p className="text-lg text-gray-800">
                    {event.enrolled_count} / {event.capacity} enrolled
                  </p>
                  {event.is_full ? (
                    <p className="text-red-600 font-semibold">Event Full</p>
                  ) : (
                    <p className="text-green-600 font-semibold">
                      {event.available_spots} spots available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enrollment Section - Only for Seekers */}
            {isSeeker() && (
              <div className="border-t border-gray-200 pt-6">
                {isEnrolled ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-6 h-6 text-green-600 mr-3"
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
                      <span className="text-green-700 font-semibold text-lg">
                        You are enrolled in this event
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/enrollments')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      View My Enrollments
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={event.is_full || enrolling}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                      event.is_full
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : enrolling
                        ? 'bg-blue-400 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {enrolling ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Enrolling...
                      </span>
                    ) : event.is_full ? (
                      'Event Full - Cannot Enroll'
                    ) : (
                      'Enroll in This Event'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
