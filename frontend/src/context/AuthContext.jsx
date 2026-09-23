import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

// =====================================================
// AUTH CONTEXT
// =====================================================

const AuthContext =
  createContext(null);

// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // CLEAR AUTH
  // ===================================================

  const clearAuth = () => {
    console.log(
      "CLEARING AUTH..."
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);
  };

  // ===================================================
  // CHECK EXISTING LOGIN
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const checkAuthStatus =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token"
            );

          const savedUser =
            localStorage.getItem(
              "user"
            );

          console.log(
            "AUTH CHECK - TOKEN:",
            token
              ? "FOUND"
              : "NOT FOUND"
          );

          // ---------------------------------------------
          // NO TOKEN
          // ---------------------------------------------

          if (!token) {
            if (mounted) {
              setUser(null);
              setLoading(false);
            }

            return;
          }

          // ---------------------------------------------
          // LOAD SAVED USER
          // ---------------------------------------------

          let parsedUser = null;

          if (savedUser) {
            try {
              parsedUser =
                JSON.parse(
                  savedUser
                );

              if (
                mounted &&
                parsedUser
              ) {
                setUser(
                  parsedUser
                );
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

          // ---------------------------------------------
          // VERIFY TOKEN
          // ---------------------------------------------

          try {
            const response =
              await api.get(
                "/auth/profile"
              );

            if (!mounted) {
              return;
            }

            const data =
              response?.data;

            console.log(
              "PROFILE RESPONSE:",
              data
            );

            const profileUser =
              data?.user ||
              data?.data?.user ||
              data?.data ||
              data;

            if (
              profileUser &&
              typeof profileUser ===
                "object"
            ) {
              const updatedUser = {
                ...(parsedUser ||
                  {}),
                ...profileUser,
              };

              setUser(
                updatedUser
              );

              localStorage.setItem(
                "user",
                JSON.stringify(
                  updatedUser
                )
              );
            }
          } catch (profileError) {
            console.error(
              "PROFILE CHECK ERROR:",
              profileError
            );

            // -------------------------------------------
            // IMPORTANT
            //
            // Yahan automatically logout nahi karenge.
            // -------------------------------------------

            if (
              profileError?.response
                ?.status === 401
            ) {
              console.warn(
                "Profile returned 401. Keeping current auth state for debugging."
              );

              if (
                mounted &&
                parsedUser
              ) {
                setUser(
                  parsedUser
                );
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

  // ===================================================
  // LOGIN
  // ===================================================

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

      // -----------------------------------------------
      // TOKEN
      // -----------------------------------------------

      const token =
        data.token ||
        data.accessToken ||
        data.data?.token;

      // -----------------------------------------------
      // USER
      // -----------------------------------------------

      const loggedInUser =
        data.user ||
        data.data?.user;

      // -----------------------------------------------
      // TOKEN CHECK
      // -----------------------------------------------

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

      // -----------------------------------------------
      // USER CHECK
      // -----------------------------------------------

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

      // -----------------------------------------------
      // SAVE TOKEN
      // -----------------------------------------------

      localStorage.setItem(
        "token",
        String(token)
      );

      // -----------------------------------------------
      // SAVE USER
      // -----------------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(
          loggedInUser
        )
      );

      // -----------------------------------------------
      // VERIFY LOCAL STORAGE
      // -----------------------------------------------

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

      // -----------------------------------------------
      // FINAL CHECK
      // -----------------------------------------------

      if (!savedToken) {
        return {
          success: false,

          message:
            "JWT token localStorage mein save nahi hua.",
        };
      }

      setUser(
        loggedInUser
      );

      console.log(
        "LOGIN SUCCESSFUL"
      );

      return {
        success: true,

        token: savedToken,

        user: loggedInUser,

        message:
          data.message ||
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

      return {
        success: false,

        message:
          error?.response?.data
            ?.message ||
          error?.response?.data
            ?.error ||
          "Login failed. Please check your credentials.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const register = async (
    name,
    email,
    password
  ) => {
    try {
      setLoading(true);

      const response =
        await api.post(
          "/auth/register",
          {
            name: String(
              name || ""
            ).trim(),

            email: String(
              email || ""
            )
              .trim()
              .toLowerCase(),

            password,
          }
        );

      const data =
        response?.data || {};

      return {
        success: true,

        message:
          data.message ||
          "Registration successful.",
      };
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      return {
        success: false,

        message:
          error?.response?.data
            ?.message ||
          error?.response?.data
            ?.error ||
          "Registration failed.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    console.log(
      "LOGOUT CALLED"
    );

    clearAuth();
  };

  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value = {
    user,

    loading,

    login,

    register,

    logout,

    clearAuth,

    isAuthenticated:
      Boolean(
        localStorage.getItem(
          "token"
        )
      ),
  };

  // ===================================================
  // PROVIDER
  // ===================================================

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
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;