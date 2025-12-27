import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const CreateEvent = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: '',
    location: '',
    start_date: '',
    end_date: '',
    capacity: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Language validation
    if (!formData.language.trim()) {
      newErrors.language = 'Language is required';
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Start date validation
    if (!formData.start_date) {
      newErrors.start_date = 'Start date and time is required';
    } else {
      const startDate = new Date(formData.start_date);
      const now = new Date();
      if (startDate <= now) {
        newErrors.start_date = 'Start date must be in the future';
      }
    }

    // End date validation
    if (!formData.end_date) {
      newErrors.end_date = 'End date and time is required';
    } else if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    // Capacity validation (optional but must be valid if provided)
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity < 1) {
        newErrors.capacity = 'Capacity must be at least 1';
      } else if (capacity > 10000) {
        newErrors.capacity = 'Capacity must be less than 10,000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        language: formData.language.trim(),
        location: formData.location.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      // Add capacity only if provided
      if (formData.capacity) {
        eventData.capacity = parseInt(formData.capacity);
      }

      const response = await axiosInstance.post('/events/', eventData);

      // Show success message
      setSuccessMessage('Event created successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        language: '',
        location: '',
        start_date: '',
        end_date: '',
        capacity: '',
      });

      // Redirect to event details after 2 seconds
      setTimeout(() => {
        navigate(`/events/${response.data.id}`);
      }, 2000);
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        const newErrors = {};

        // Map API errors to form fields
        Object.keys(errorData).forEach((key) => {
          if (Array.isArray(errorData[key])) {
            newErrors[key] = errorData[key][0];
          } else {
            newErrors[key] = errorData[key];
          }
        });

        setErrors(newErrors);
      } else {
        setErrors({
          general: 'Network error. Please check your connection and try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600">
            Fill in the details to create a new event
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg
              className="w-5 h-5 mr-3"
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
            <span>{successMessage} Redirecting...</span>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{errors.general}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Introduction to Web Development"
                disabled={loading}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Provide a detailed description of your event..."
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length} characters
              </p>
            </div>

            {/* Language and Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Language <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.language ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., English"
                  disabled={loading}
                />
                {errors.language && (
                  <p className="mt-1 text-sm text-red-600">{errors.language}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., New York, NY"
                  disabled={loading}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>
            </div>

            {/* Start and End Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor="end_date"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label
                htmlFor="capacity"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Capacity <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="10000"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 50"
                disabled={loading}
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Leave empty for unlimited capacity
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Creating Event...
                </span>
              ) : (
                'Create Event'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-events')}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
