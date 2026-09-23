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
  // CHECK EXISTING LOGIN
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        const token =
          localStorage.getItem("token");

        const savedUser =
          localStorage.getItem("user");

        console.log(
          "AUTH CHECK - TOKEN:",
          token ? "FOUND" : "NOT FOUND"
        );

        // -------------------------------------------------
        // NO TOKEN
        // -------------------------------------------------

        if (!token) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }

          return;
        }

        // -------------------------------------------------
        // LOAD SAVED USER
        // -------------------------------------------------

        let parsedUser = null;

        if (savedUser) {
          try {
            parsedUser =
              JSON.parse(savedUser);

            if (
              mounted &&
              parsedUser
            ) {
              setUser(parsedUser);
            }
          } catch (error) {
            console.error(
              "USER JSON ERROR:",
              error
            );

            localStorage.removeItem(
              "user"
            );
          }
        }

        // -------------------------------------------------
        // VERIFY JWT WITH BACKEND
        // -------------------------------------------------

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

          console.log(
            "PROFILE RESPONSE:",
            data
          );

          const profileUser =
            data?.user ||
            data?.data?.user ||
            data?.data ||
            null;

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
              JSON.stringify(
                updatedUser
              )
            );
          } else {
            console.warn(
              "PROFILE USER NOT FOUND:",
              data
            );

            if (!parsedUser) {
              clearAuth();
            }
          }
        } catch (profileError) {
          console.error(
            "PROFILE CHECK ERROR:",
            profileError
          );

          const status =
            profileError?.response
              ?.status;

          // -------------------------------------------------
          // INVALID / EXPIRED TOKEN
          // -------------------------------------------------

          if (
            status === 401 ||
            status === 403
          ) {
            console.warn(
              "AUTH TOKEN INVALID OR EXPIRED. CLEARING AUTH."
            );

            if (mounted) {
              localStorage.removeItem(
                "token"
              );

              localStorage.removeItem(
                "user"
              );

              setUser(null);
            }
          } else if (
            mounted &&
            parsedUser
          ) {
            // Temporary network/server
            // problem. Keep saved user.

            setUser(parsedUser);
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
      setLoading(true);

      const cleanEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      console.log(
        "LOGIN START:",
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
        "LOGIN RESPONSE:",
        data
      );

      // -------------------------------------------------
      // GET TOKEN
      // -------------------------------------------------

      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token;

      // -------------------------------------------------
      // GET USER
      // -------------------------------------------------

      const loggedInUser =
        data?.user ||
        data?.data?.user ||
        null;

      // -------------------------------------------------
      // TOKEN MISSING
      // -------------------------------------------------

      if (!token) {
        console.error(
          "LOGIN TOKEN MISSING:",
          data
        );

        return {
          success: false,
          message:
            "Backend login response mein JWT token nahi mila.",
        };
      }

      // -------------------------------------------------
      // USER MISSING
      // -------------------------------------------------

      if (!loggedInUser) {
        console.error(
          "LOGIN USER MISSING:",
          data
        );

        return {
          success: false,
          message:
            "Backend login response mein user information nahi mili.",
        };
      }

      // -------------------------------------------------
      // SAVE TOKEN
      // -------------------------------------------------

      localStorage.setItem(
        "token",
        String(token)
      );

      // -------------------------------------------------
      // SAVE USER
      // -------------------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(
          loggedInUser
        )
      );

      // -------------------------------------------------
      // UPDATE STATE
      // -------------------------------------------------

      setUser(loggedInUser);

      // -------------------------------------------------
      // VERIFY LOCAL STORAGE
      // -------------------------------------------------

      const savedToken =
        localStorage.getItem(
          "token"
        );

      const savedUser =
        localStorage.getItem(
          "user"
        );

      console.log(
        "TOKEN SAVED:",
        savedToken
          ? "YES"
          : "NO"
      );

      console.log(
        "USER SAVED:",
        savedUser
          ? "YES"
          : "NO"
      );

      if (!savedToken) {
        setUser(null);

        return {
          success: false,
          message:
            "JWT token localStorage mein save nahi hua.",
        };
      }

      console.log(
        "LOGIN SUCCESSFUL"
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

      const message =
        error?.response?.data
          ?.message ||
        error?.response?.data
          ?.error ||
        "Login failed. Please check your credentials.";

      // -------------------------------------------------
      // PENDING / REJECTED USER
      // -------------------------------------------------

      if (
        status === 401 ||
        status === 403
      ) {
        console.warn(
          "LOGIN BLOCKED:",
          message
        );
      }

      return {
        success: false,
        status,
        message,
      };
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const register = async (
    name,
    email,
    password
  ) => {
    try {
      setLoading(true);

      const cleanName =
        String(name || "")
          .trim();

      const cleanEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      console.log(
        "================================="
      );

      console.log(
        "REGISTER START:",
        {
          name: cleanName,
          email: cleanEmail,
        }
      );

      console.log(
        "================================="
      );

      // -------------------------------------------------
      // SEND REGISTRATION REQUEST
      // -------------------------------------------------

      const response =
        await api.post(
          "/auth/register",
          {
            name: cleanName,
            email: cleanEmail,
            password,
          }
        );

      console.log(
        "REGISTER HTTP STATUS:",
        response?.status
      );

      console.log(
        "REGISTER RESPONSE:",
        response?.data
      );

      const data =
        response?.data || {};

      // -------------------------------------------------
      // SUCCESS CHECK
      // -------------------------------------------------

      const httpSuccess =
        response?.status >= 200 &&
        response?.status < 300;

      const backendSuccess =
        data?.success === true;

      const registrationSuccess =
        httpSuccess ||
        backendSuccess;

      console.log(
        "REGISTER HTTP SUCCESS:",
        httpSuccess
      );

      console.log(
        "REGISTER BACKEND SUCCESS:",
        backendSuccess
      );

      console.log(
        "REGISTER FINAL SUCCESS:",
        registrationSuccess
      );

      // -------------------------------------------------
      // SUCCESS RESPONSE
      // -------------------------------------------------

      if (registrationSuccess) {
        console.log(
          "REGISTRATION SUCCESSFUL"
        );

        /*
          IMPORTANT:

          Registration ke baad token
          save nahi karna.

          Normal user:
          role   = user
          status = pending

          Admin approval ke baad hi
          user login karega.
        */

        return {
          success: true,

          status:
            response?.status,

          message:
            data?.message ||
            "Registration ho gaya hai! Admin approval ke baad aap login kar sakenge.",

          user:
            data?.user ||
            data?.data?.user ||
            null,
        };
      }

      // -------------------------------------------------
      // UNEXPECTED RESPONSE
      // -------------------------------------------------

      console.warn(
        "REGISTRATION FAILED RESPONSE:",
        data
      );

      return {
        success: false,

        status:
          response?.status,

        message:
          data?.message ||
          data?.error ||
          "Registration failed. Please try again.",
      };
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "REGISTER ERROR:",
        error
      );

      console.error(
        "REGISTER ERROR RESPONSE:",
        error?.response?.data
      );

      console.error(
        "REGISTER ERROR STATUS:",
        error?.response?.status
      );

      console.error(
        "================================="
      );

      const status =
        error?.response?.status;

      const message =
        error?.response?.data
          ?.message ||
        error?.response?.data
          ?.error ||
        error?.message ||
        "Registration failed. Please try again.";

      return {
        success: false,

        status,

        message,
      };
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    console.log(
      "LOGOUT CALLED"
    );

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

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// USE AUTH
// =====================================================

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