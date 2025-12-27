import { Link } from 'react-router-dom';

const EventCard = ({ event, showEnrollButton = false, onEnroll, enrolling = false }) => {
  const {
    id,
    title,
    description,
    location,
    language,
    start_date,
    end_date,
    capacity,
    available_spots,
    is_full,
    facilitator_name,
    enrolled_count,
  } = event;

  // Format dates
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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <p className="text-blue-100 text-sm">by {facilitator_name}</p>
      </div>

      {/* Card Body */}
      <div className="px-6 py-4">
        {/* Description */}
        <p className="text-gray-700 mb-4 line-clamp-3">{description}</p>

        {/* Details Grid */}
        <div className="space-y-3 mb-4">
          {/* Location */}
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-blue-500"
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
            <span className="text-sm">{location}</span>
          </div>

          {/* Language */}
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-purple-500"
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
            <span className="text-sm">{language}</span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-green-500"
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
            <span className="text-sm">
              {formatDate(start_date)} at {formatTime(start_date)}
            </span>
          </div>

          {/* Capacity */}
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-orange-500"
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
            <span className="text-sm">
              {enrolled_count}/{capacity} enrolled
              {is_full ? (
                <span className="ml-2 text-red-600 font-semibold">• Full</span>
              ) : (
                <span className="ml-2 text-green-600 font-semibold">
                  • {available_spots} spots left
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Link
            to={`/events/${id}`}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center font-semibold hover:bg-gray-200 transition-colors"
          >
            View Details
          </Link>

          {showEnrollButton && (
            <button
              onClick={() => onEnroll(id)}
              disabled={is_full || enrolling}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                is_full
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : enrolling
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}
            >
              {enrolling ? 'Enrolling...' : is_full ? 'Event Full' : 'Enroll Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
