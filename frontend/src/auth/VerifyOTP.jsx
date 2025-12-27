import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axios";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: emailFromState,
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow digits for OTP and limit to 6 characters
    if (name === "otp") {
      const numericValue = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setError(""); // Clear error on input change
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // Validation
    if (formData.otp.length !== 6) {
      setError("OTP must be 6 digits");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/api/auth/verify-email/",
        formData
      );

      // Show success message
      setSuccessMessage(
        response.data.message || "Email verified successfully!"
      );

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login", {
          state: { email: formData.email, verified: true },
        });
      }, 2000);
    } catch (err) {
      // Handle API errors
      if (err.response?.data) {
        const errorData = err.response.data;

        // Handle validation errors
        if (errorData.otp) {
          setError(errorData.otp[0] || errorData.otp);
        } else if (errorData.email) {
          setError(errorData.email[0] || errorData.email);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError("Verification failed. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const response = await axiosInstance.post("/auth/resend-otp/", {
        email: formData.email,
      });

      setResendMessage(response.data.message || "OTP resent successfully!");

      // Clear resend message after 5 seconds
      setTimeout(() => {
        setResendMessage("");
      }, 5000);
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        setError(errorData.error || errorData.detail || "Failed to resend OTP");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        {/* Resend Message */}
        {resendMessage && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{resendMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          {/* OTP Field */}
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              required
              maxLength={6}
              pattern="\d{6}"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="000000"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500 text-center">
              Enter the 6-digit code
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.otp.length !== 6}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              loading || formData.otp.length !== 6
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:scale-95"
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
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading}
            className={`text-sm font-semibold ${
              resendLoading
                ? "text-gray-400 cursor-not-allowed"
                : "text-green-600 hover:text-green-700"
            }`}
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </div>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
