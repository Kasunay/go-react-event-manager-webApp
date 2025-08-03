// In AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router'; // Make sure this is 'react-router-dom' if you're using it

const API_BASE_URL = 'http://localhost:8080';

interface User {
  email: string;
  isEmailVerified: boolean;
  userId: string; // Assuming these are from your backend's /api/auth/me
  fullName: string;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  // --- MODIFIED: login now takes email and password ---
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  currentUser: User | null;
  isAdmin: () => boolean;
  isCreator: () => boolean;
  isStaff: () => boolean; // Assuming you want to check for staff as well
  isVerified: () => boolean;
  isLoading: boolean; // Add isLoading here
  
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: async () => { }, // Async empty function
  logout: () => { },
  signup: async () => { },
  forgotPassword: async () => { },
  currentUser: null,
  isAdmin: () => false,
  isCreator: () => false,
  isStaff: () => false,
  isVerified: () => false,
  isLoading: true, // Default to true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize loading state

  // --- Helper function to check login status, called on mount and after login ---
  const checkLoginStatus = async () => {
    setIsLoading(true); // Start loading
    try {
      // Use environment variable for base URL
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const userData: User = await res.json(); // Type assertion for safety
        setIsLoggedIn(true);
        setCurrentUser(userData);
        console.log(userData)
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (err) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      console.error("Failed to check login status:", err);
      // toast.error("Failed to check login status."); // Optional: inform user about initial check failure
    } finally {
      setIsLoading(false); // End loading
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []); // Run once on component mount

  const isAdmin = () => currentUser?.role === 'admin';
  const isCreator = () => currentUser?.role === 'creator';
  const isStaff = () => currentUser?.role === 'staff'; 
  const isVerified = () => currentUser?.isEmailVerified === true;

  // --- MODIFIED LOGIN FUNCTION ---
   const login = async (email: string, password: string) => {
    setIsLoading(true); // Indicate submission in progress
    try {
      const res = await fetch(`${API_BASE_URL}/login`, { // Assuming your login endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for sending the cookie
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Make sure to throw the exact error message from the backend
        throw new Error(errorData.error || errorData.message || 'Login failed. Please check your credentials.');
      }

      await checkLoginStatus(); // This will update isLoggedIn and currentUser

    } catch (err: any) {
      console.error('Login failed:', err);
      throw err; // Re-throw to allow LoginPage to catch and display error
    } finally {
      setIsLoading(false); // End loading
    }
  };


  const logout = async () => {
    setIsLoading(true); // Indicate logout in progress
    try {
      await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' }); // Assuming '/logout' endpoint
      navigate('/'); // Or '/login'
      setIsLoggedIn(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Failed to logout cleanly', err);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setIsLoading(true); // Set loading true during signup
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        // Adjust endpoint as needed
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Signup failed");
      }

      const data = await response.json();
      console.log("Signup successful:", data);
      // Optionally, you might automatically log in the user after signup,
      // or redirect them to a page informing them to verify their email.
      // For now, we'll just log success and let the SignupPage handle navigation.
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send password reset email");
      }

      // Success - no need to do anything else, the email has been sent
    } catch (error) {
      console.error("Forgot password failed:", error);
      throw error; // Re-throw to allow ForgotPasswordPage to catch and display error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, currentUser, isAdmin, isCreator, isVerified, isLoading, signup, forgotPassword, isStaff }}>
      {/* You can show a global loading spinner here if isLoading is true */}
      {isLoading && !isLoggedIn && (
        // Only show a full page loader on initial load if not logged in
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 9999 }}>
          Loading authentication...
        </div>
      )}
      {!isLoading || isLoggedIn ? children : null} {/* Render children only if not loading or already logged in (to prevent flicker) */}
    </AuthContext.Provider>
  );
};