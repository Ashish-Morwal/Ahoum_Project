import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';

const EventList = () => {
  const navigate = useNavigate();
  
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [error, setError] = useState('');
  
  // Filters and search
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Available filter options (will be populated from API responses)
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Fetch events
  const fetchEvents = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
      };

      // Add filters only if they have values
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (locationFilter) {
        params.location = locationFilter;
      }
      if (languageFilter) {
        params.language = languageFilter;
      }

      const response = await axiosInstance.get('/api/events/', { params });
      
      setEvents(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
      setCurrentPage(page);

      // Extract unique locations and languages for filter dropdowns
      const locations = [...new Set(response.data.results.map(e => e.location))];
      const languages = [...new Set(response.data.results.map(e => e.language))];
      setAvailableLocations(locations);
      setAvailableLanguages(languages);

    } catch (err) {
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchEvents(1);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents(1); // Reset to page 1 on new search
  };

  // Handle filter changes
  const handleLocationChange = (e) => {
    setLocationFilter(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguageFilter(e.target.value);
  };

  // Apply filters
  const applyFilters = () => {
    fetchEvents(1); // Reset to page 1 when applying filters
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setLocationFilter('');
    setLanguageFilter('');
    fetchEvents(1);
  };

  // Handle enrollment
  const handleEnroll = async (eventId) => {
    setEnrolling(eventId);
    setError('');

    try {
      await axiosInstance.post(`/api/events/${eventId}/enroll/`);
      
      // Refresh events to update enrollment status
      fetchEvents(currentPage);
      
      // Show success message
      alert('Successfully enrolled in the event!');
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.detail) {
          alert(errorData.detail);
        } else if (errorData.error) {
          alert(errorData.error);
        } else {
          alert('Failed to enroll. Please try again.');
        }
      } else {
        alert('Network error. Please check your connection.');
      }
    } finally {
      setEnrolling(null);
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchEvents(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Upcoming Events
          </h1>
          <p className="text-gray-600">
            Discover and enroll in exciting events near you
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search events by title, description, or location..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={languageFilter}
                onChange={handleLanguageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Languages</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition-all"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 active:scale-95 transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {events.length} of {totalCount} event{totalCount !== 1 ? 's' : ''}
            </div>
          )}
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
            <Loader />
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
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
              No Events Found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters to find more events.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Events Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showEnrollButton={true}
                  onEnroll={handleEnroll}
                  enrolling={enrolling === event.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-4 py-2 rounded-lg font-semibold ${
                            page === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventList;
