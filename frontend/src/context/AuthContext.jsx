import { createContext, useState, useEffect, useContext } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

// AuthProvider component to wrap the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout function: Clear all auth data (defined early to use in useEffect)
  const logout = () => {
    // Clear state
    setUser(null);
    setAccessToken(null);

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const restoreAuthState = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');

        if (storedUser && storedAccessToken) {
          setUser(JSON.parse(storedUser));
          setAccessToken(storedAccessToken);
        }
      } catch (error) {
        // Clear corrupted data
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // logout is stable, only runs on mount

  // Login function: Store user data and tokens
  const login = (userData, tokens) => {
    const { access, refresh } = tokens;
    const userInfo = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
    };

    // Update state
    setUser(userInfo);
    setAccessToken(access);

    // Persist to localStorage
    localStorage.setItem('user', JSON.stringify(userInfo));
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!accessToken;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is a seeker
  const isSeeker = () => {
    return hasRole('seeker');
  };

  // Check if user is a facilitator
  const isFacilitator = () => {
    return hasRole('facilitator');
  };

  // Update user data (e.g., after profile update)
  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Context value
  const value = {
    user,
    accessToken,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isSeeker,
    isFacilitator,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
