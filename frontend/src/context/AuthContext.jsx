import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // CLEAR AUTH
  // =====================================================
  const clearAuth = () => {
    console.log("CLEARING AUTH...");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  // =====================================================
  // CHECK AUTH STATUS
  // =====================================================
  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        // -----------------------------------------------
        // NO TOKEN
        // -----------------------------------------------
        if (!token) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }

          return;
        }

        // -----------------------------------------------
        // READ SAVED USER
        // -----------------------------------------------
        let parsedUser = null;

        if (savedUser) {
          try {
            parsedUser = JSON.parse(savedUser);

            if (mounted && parsedUser) {
              setUser(parsedUser);
            }
          } catch (error) {
            console.error(
              "USER JSON ERROR:",
              error
            );

            localStorage.removeItem("user");
          }
        }

        // -----------------------------------------------
        // VERIFY TOKEN WITH BACKEND
        // -----------------------------------------------
        try {
          const response =
            await api.get(
              "/auth/profile"
            );

          if (!mounted) {
            return;
          }

          const data =
            response?.data || {};

          const profileUser =
            data?.user ||
            data?.data?.user ||
            data?.data ||
            null;

          // ---------------------------------------------
          // PROFILE FOUND
          // ---------------------------------------------
          if (
            profileUser &&
            typeof profileUser ===
              "object"
          ) {
            const updatedUser = {
              ...(parsedUser || {}),
              ...profileUser,
            };

            setUser(updatedUser);

            localStorage.setItem(
              "user",
              JSON.stringify(updatedUser)
            );
          } else {
            // -------------------------------------------
            // PROFILE NOT FOUND
            // -------------------------------------------
            if (!parsedUser) {
              localStorage.removeItem(
                "token"
              );

              localStorage.removeItem(
                "user"
              );

              setUser(null);
            }
          }
        } catch (profileError) {
          const status =
            profileError?.response
              ?.status;

          console.error(
            "PROFILE CHECK ERROR:",
            status,
            profileError?.response
              ?.data ||
              profileError?.message
          );

          // ---------------------------------------------
          // TOKEN INVALID / EXPIRED
          // ---------------------------------------------
          if (
            status === 401 ||
            status === 403
          ) {
            if (mounted) {
              localStorage.removeItem(
                "token"
              );

              localStorage.removeItem(
                "user"
              );

              setUser(null);
            }
          } else {
            // -------------------------------------------
            // SERVER TEMPORARY ERROR
            // Keep saved user if available
            // -------------------------------------------
            if (
              mounted &&
              parsedUser
            ) {
              setUser(parsedUser);
            }
          }
        }
      } catch (error) {
        console.error(
          "AUTH CHECK ERROR:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================
  const login = async (
    email,
    password
  ) => {
    try {
      const cleanEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      console.log(
        "AUTH LOGIN START:",
        cleanEmail
      );

      const response =
        await api.post(
          "/auth/login",
          {
            email: cleanEmail,
            password,
          }
        );

      const data =
        response?.data || {};

      console.log(
        "AUTH LOGIN RESPONSE:",
        data
      );

      // =================================================
      // BACKEND EXPLICIT FAILURE
      // =================================================
      if (
        data?.success === false
      ) {
        const message =
          data?.message ||
          data?.error ||
          data?.data?.message ||
          data?.data?.error ||
          "Invalid email or password.";

        console.error(
          "AUTH LOGIN FAILED:",
          message
        );

        return {
          success: false,
          status:
            response?.status,
          message:
            String(message),
          retryAfter: Number(
            data?.retryAfter || 0
          ),
          attemptsRemaining:
            Number(
              data?.attemptsRemaining ||
                0
            ),
        };
      }

      // =================================================
      // GET TOKEN
      // =================================================
      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token;

      // =================================================
      // GET USER
      // =================================================
      const loggedInUser =
        data?.user ||
        data?.data?.user ||
        null;

      // =================================================
      // TOKEN MISSING
      // =================================================
      if (!token) {
        const message =
          data?.message ||
          data?.error ||
          "Backend login response mein JWT token nahi mila.";

        console.error(
          "AUTH LOGIN TOKEN MISSING:",
          message
        );

        return {
          success: false,
          status:
            response?.status,
          message:
            String(message),
        };
      }

      // =================================================
      // USER MISSING
      // =================================================
      if (!loggedInUser) {
        const message =
          data?.message ||
          "Backend login response mein user information nahi mili.";

        console.error(
          "AUTH LOGIN USER MISSING:",
          message
        );

        return {
          success: false,
          status:
            response?.status,
          message:
            String(message),
        };
      }

      // =================================================
      // SAVE TOKEN
      // =================================================
      localStorage.setItem(
        "token",
        String(token)
      );

      // =================================================
      // SAVE USER
      // =================================================
      localStorage.setItem(
        "user",
        JSON.stringify(
          loggedInUser
        )
      );

      // =================================================
      // UPDATE CONTEXT USER
      // =================================================
      setUser(loggedInUser);

      // =================================================
      // VERIFY LOCAL STORAGE
      // =================================================
      const savedToken =
        localStorage.getItem(
          "token"
        );

      const savedUser =
        localStorage.getItem(
          "user"
        );

      if (!savedToken) {
        setUser(null);

        return {
          success: false,
          message:
            "JWT token localStorage mein save nahi hua.",
        };
      }

      if (!savedUser) {
        setUser(null);

        return {
          success: false,
          message:
            "User information localStorage mein save nahi hui.",
        };
      }

      // =================================================
      // LOGIN SUCCESS
      // =================================================
      console.log(
        "AUTH LOGIN SUCCESS"
      );

      return {
        success: true,
        token: savedToken,
        user: loggedInUser,
        message:
          data?.message ||
          "Login successful.",
      };
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      console.error(
        "LOGIN ERROR RESPONSE:",
        error?.response?.data
      );

      const status =
        error?.response?.status;

      const responseData =
        error?.response?.data || {};

      let message =
        responseData?.message ||
        responseData?.error ||
        responseData?.data?.message ||
        responseData?.data?.error ||
        "";

      // =================================================
      // VALIDATION ERRORS
      // =================================================
      if (
        Array.isArray(
          responseData?.errors
        ) &&
        responseData.errors.length >
          0
      ) {
        message =
          responseData.errors
            .map((item) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              return (
                item?.message ||
                item?.msg ||
                ""
              );
            })
            .filter(Boolean)
            .join(", ");
      }

      // =================================================
      // STATUS BASED ERROR
      // =================================================
      if (!message) {
        if (status === 401) {
          message =
            "Invalid email or password.";
        } else if (
          status === 403
        ) {
          message =
            "Your account is not authorized to login.";
        } else if (
          status === 429
        ) {
          message =
            "Too many login attempts. Please try again after 30 seconds.";
        } else if (
          status === 400
        ) {
          message =
            "Please check your email and password.";
        } else if (
          status === 404
        ) {
          message =
            "Login service was not found.";
        } else if (
          status &&
          status >= 500
        ) {
          message =
            "Server error. Please try again.";
        } else if (
          error?.request &&
          !error?.response
        ) {
          message =
            "Unable to connect to the server.";
        } else {
          message =
            "Invalid email or password.";
        }
      }

      console.error(
        "AUTH LOGIN ERROR MESSAGE:",
        message
      );

      // =================================================
      // RETURN LOGIN ERROR
      // =================================================
      return {
        success: false,
        status,
        message:
          String(message),
        error,
        retryAfter: Number(
          responseData?.retryAfter ||
            0
        ),
        attemptsRemaining:
          Number(
            responseData?.attemptsRemaining ||
              0
          ),
      };
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================
  const register = async (
    name,
    email,
    password,
    extraData = {}
  ) => {
    try {
      const cleanName =
        String(name || "").trim();

      const cleanEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      const response =
        await api.post(
          "/auth/register",
          {
            name: cleanName,
            email: cleanEmail,
            password,
            ...extraData,
          }
        );

      const data =
        response?.data || {};

      if (
        data?.success === false
      ) {
        return {
          success: false,
          status:
            response?.status,
          message:
            data?.message ||
            data?.error ||
            "Registration failed.",
        };
      }

      return {
        success: true,
        status:
          response?.status,
        message:
          data?.message ||
          "Registration successful.",
        data,
      };
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      console.error(
        "REGISTER ERROR RESPONSE:",
        error?.response?.data
      );

      const status =
        error?.response?.status;

      const responseData =
        error?.response?.data || {};

      let message =
        responseData?.message ||
        responseData?.error ||
        responseData?.data?.message ||
        responseData?.data?.error ||
        "";

      if (
        Array.isArray(
          responseData?.errors
        ) &&
        responseData.errors.length >
          0
      ) {
        message =
          responseData.errors
            .map((item) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              return (
                item?.message ||
                item?.msg ||
                ""
              );
            })
            .filter(Boolean)
            .join(", ");
      }

      if (!message) {
        if (status === 400) {
          message =
            "Please check the registration details.";
        } else if (
          status === 409
        ) {
          message =
            "This email is already registered.";
        } else if (
          status &&
          status >= 500
        ) {
          message =
            "Server error. Please try again.";
        } else if (
          error?.request &&
          !error?.response
        ) {
          message =
            "Unable to connect to the server.";
        } else {
          message =
            "Registration failed. Please try again.";
        }
      }

      return {
        success: false,
        status,
        message:
          String(message),
        error,
      };
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const logout = () => {
    console.log("LOGOUT");

    clearAuth();
  };

  // =====================================================
  // AUTHENTICATED STATUS
  // =====================================================
  const isAuthenticated =
    Boolean(
      user &&
        localStorage.getItem(
          "token"
        )
    );

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      clearAuth,
      isAuthenticated,
    }),
    [
      user,
      loading,
      isAuthenticated,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =======================================================
// USE AUTH HOOK
// =======================================================
export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;