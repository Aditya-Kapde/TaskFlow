import {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "../services/authService";

// ── Create the context ─────────────────────────────────────────
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until auth is verified

  // ─── Initialize auth state on app load ───────────────────────
  // Checks if user has an existing valid session
  // Runs once when the app first mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");

        if (storedUser && storedToken) {
          // We have stored credentials — verify they are still valid
          // by calling /auth/me on the backend
          const response = await authService.getMe();
          setUser(response.data.user);
          setAccessToken(storedToken);
        }
      } catch (error) {
        // Session is invalid or expired — clear everything
        // The axios interceptor will have already tried to
        // refresh the token before this catch fires
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
        setAccessToken(null);
      } finally {
        // Whether auth succeeded or failed, stop showing spinner
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ─── Login ────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const { user: loggedInUser, accessToken: token } = response.data;

    setUser(loggedInUser);
    setAccessToken(token);

    // authService.login already stored these in localStorage
    return response;
  }, []);

  // ─── Register ─────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    const response = await authService.register(userData);
    const { user: registeredUser, accessToken: token } = response.data;

    // Auto-login after registration — store credentials
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(registeredUser));

    setUser(registeredUser);
    setAccessToken(token);

    return response;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Always clear state even if backend call fails
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // ─── Role-based helper functions ──────────────────────────────
  // Components use these instead of raw role string comparisons
  // Makes role checks readable and centralizes the logic
  const isAdmin = useCallback(() => {
    return user?.role === "ADMIN";
  }, [user]);

  const isProjectManager = useCallback(() => {
    return user?.role === "PROJECT_MANAGER";
  }, [user]);

  const isDeveloper = useCallback(() => {
    return user?.role === "DEVELOPER";
  }, [user]);

  const isViewer = useCallback(() => {
    return user?.role === "VIEWER";
  }, [user]);

  // Can manage means can create/edit projects and tasks
  const canManage = useCallback(() => {
    return ["ADMIN", "PROJECT_MANAGER"].includes(user?.role);
  }, [user]);

  // Can comment means can post comments (not VIEWER)
  const canComment = useCallback(() => {
    return ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"].includes(user?.role);
  }, [user]);

  // ─── Context value ────────────────────────────────────────────
  const value = {
    // State
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,

    // Actions
    login,
    register,
    logout,

    // Role helpers
    isAdmin,
    isProjectManager,
    isDeveloper,
    isViewer,
    canManage,
    canComment,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};