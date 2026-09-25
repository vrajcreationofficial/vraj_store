import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [successType, setSuccessType] =
    useState("");

  const [lockSeconds, setLockSeconds] =
    useState(0);

  // =====================================================
  // LOGIN LOCK COUNTDOWN
  // =====================================================
  useEffect(() => {
    if (lockSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setLockSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [lockSeconds]);

  // =====================================================
  // REGISTRATION SUCCESS MESSAGE
  // =====================================================
  useEffect(() => {
    const registrationSuccess =
      location.state?.registrationSuccess;

    const registrationMessage =
      location.state?.message;

    if (
      registrationSuccess &&
      registrationMessage
    ) {
      console.log(
        "REGISTRATION SUCCESS MESSAGE RECEIVED:",
        registrationMessage
      );

      setSuccessType(
        "registration"
      );

      setSuccess(
        registrationMessage
      );
    }
  }, [location.state]);

  // =====================================================
  // SUCCESS MESSAGE TIMER
  // =====================================================
  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
      setSuccessType("");

      if (
        location.state
          ?.registrationSuccess
      ) {
        navigate("/login", {
          replace: true,
          state: {},
        });
      }
    }, 6000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    success,
    location.state,
    navigate,
  ]);

  // =====================================================
  // CLOSE SUCCESS POPUP
  // =====================================================
  const closeSuccessPopup = () => {
    setSuccess("");
    setSuccessType("");

    if (
      location.state
        ?.registrationSuccess
    ) {
      navigate("/login", {
        replace: true,
        state: {},
      });
    }
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================
  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      error &&
      lockSeconds <= 0
    ) {
      setError("");
    }
  };

  // =====================================================
  // GET LOGIN ERROR MESSAGE
  // =====================================================
  const getLoginErrorMessage = (
    err,
    result
  ) => {
    // ---------------------------------------------------
    // LOGIN RESULT ERROR
    // ---------------------------------------------------
    if (
      result &&
      result.success === false
    ) {
      const status =
        result?.status ||
        result?.statusCode ||
        result?.response?.status;

      const message =
        result?.message ||
        result?.error ||
        result?.data?.message ||
        result?.data?.error;

      if (status === 429) {
        return (
          message ||
          "Too many failed login attempts. Please try again after 30 seconds."
        );
      }

      if (status === 403) {
        return (
          message ||
          "Your account is not allowed to login. Please contact the administrator."
        );
      }

      if (status === 401) {
        return (
          message ||
          "Invalid email or password."
        );
      }

      if (message) {
        return String(message);
      }

      return "Invalid email or password.";
    }

    // ---------------------------------------------------
    // AXIOS ERROR
    // ---------------------------------------------------
    const status =
      err?.response?.status ||
      err?.status ||
      err?.statusCode;

    const responseData =
      err?.response?.data;

    const backendMessage =
      responseData?.message ||
      responseData?.error ||
      responseData?.msg ||
      responseData?.errors?.[0]
        ?.message ||
      responseData?.errors?.[0] ||
      responseData?.data?.message ||
      responseData?.data?.error ||
      responseData?.data?.msg;

    if (status === 429) {
      return (
        backendMessage ||
        "Too many failed login attempts. Please try again after 30 seconds."
      );
    }

    if (status === 403) {
      return (
        backendMessage ||
        "Your account is not allowed to login. Please contact the administrator."
      );
    }

    if (status === 401) {
      return (
        backendMessage ||
        "Invalid email or password."
      );
    }

    if (backendMessage) {
      return String(
        backendMessage
      );
    }

    // ---------------------------------------------------
    // NETWORK ERROR
    // ---------------------------------------------------
    if (
      err?.code ===
        "ERR_NETWORK" ||
      err?.message ===
        "Network Error"
    ) {
      return (
        "Unable to connect to the server. Please make sure the backend server is running."
      );
    }

    // ---------------------------------------------------
    // GENERIC ERROR
    // ---------------------------------------------------
    if (err?.message) {
      return String(
        err.message
      );
    }

    return "Invalid email or password.";
  };

  // =====================================================
  // LOGIN SUBMIT
  // =====================================================
  const handleSubmit = async (
    e
  ) => {
    // Prevent browser form reload
    e.preventDefault();
    e.stopPropagation();

    if (
      loading ||
      lockSeconds > 0
    ) {
      return;
    }

    // Clear old messages
    setError("");
    setSuccess("");
    setSuccessType("");

    const email = String(
      formData.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.password || ""
    );

    // ---------------------------------------------------
    // EMAIL VALIDATION
    // ---------------------------------------------------
    if (!email) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    // ---------------------------------------------------
    // PASSWORD VALIDATION
    // ---------------------------------------------------
    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    console.log(
      "LOGIN START:",
      email
    );

    try {
      const result =
        await login(
          email,
          password
        );

      console.log(
        "LOGIN RESULT:",
        result
      );

      // =================================================
      // LOGIN FAILED
      // =================================================
      if (
        !result ||
        result.success !== true
      ) {
        const loginError =
          getLoginErrorMessage(
            null,
            result
          );

        console.error(
          "LOGIN FAILED:",
          loginError
        );

        // Stop loading first
        setLoading(false);

        // Clear success
        setSuccess("");
        setSuccessType("");

        // -----------------------------------------------
        // 30 SECOND LOCK
        // -----------------------------------------------
        const retryAfter =
          Number(
            result?.retryAfter ||
              0
          );

        if (retryAfter > 0) {
          setLockSeconds(
            retryAfter
          );

          setError(
            "Too many login attempts. Please try again."
          );
        } else {
          // ---------------------------------------------
          // NORMAL LOGIN ERROR
          // ---------------------------------------------
          setError(
            String(
              loginError ||
                "Invalid email or password."
            )
          );
        }

        // VERY IMPORTANT:
        // Do not navigate
        return;
      }

      // =================================================
      // LOGIN SUCCESS
      // =================================================
      setLoading(false);

      setLockSeconds(0);

      setError("");

      setSuccessType("login");

      setSuccess(
        "Login successful. Redirecting..."
      );

      console.log(
        "LOGIN PAGE TOKEN:",
        localStorage.getItem(
          "token"
        )
          ? "FOUND"
          : "NOT FOUND"
      );

      console.log(
        "LOGIN PAGE USER:",
        localStorage.getItem(
          "user"
        )
          ? "FOUND"
          : "NOT FOUND"
      );

      setTimeout(() => {
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      }, 700);
    } catch (err) {
      console.error(
        "LOGIN PAGE ERROR:",
        err
      );

      const loginError =
        getLoginErrorMessage(
          err,
          null
        );

      console.error(
        "LOGIN PAGE ERROR MESSAGE:",
        loginError
      );

      setLoading(false);

      setSuccess("");
      setSuccessType("");

      // -----------------------------------------------
      // 30 SECOND LOCK
      // -----------------------------------------------
      const retryAfter =
        Number(
          err?.response?.data
            ?.retryAfter || 0
        );

      if (retryAfter > 0) {
        setLockSeconds(
          retryAfter
        );

        setError(
          "Too many login attempts. Please try again."
        );
      } else {
        setError(
          String(
            loginError ||
              "Invalid email or password."
          )
        );
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7fb]">

      {/* =================================================
          SUCCESS POPUP
      ================================================= */}
      {success && (
        <div className="fixed right-5 top-5 z-[9999] w-[calc(100%-2.5rem)] max-w-sm animate-[slideIn_0.3s_ease-out]">

          <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-white shadow-[0_20px_50px_rgba(16,185,129,0.18)]">

            <div className="h-1 w-full bg-green-500" />

            <div className="flex items-start gap-3 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FiCheckCircle
                  size={21}
                />
              </div>

              <div className="min-w-0 flex-1 pr-7">

                <p className="text-sm font-bold text-green-800">
                  {successType ===
                  "registration"
                    ? "Registration Successful"
                    : "Login Successful"}
                </p>

                <p className="mt-1 text-xs leading-5 text-green-700">
                  {success}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeSuccessPopup
                }
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close notification"
              >
                <FiX size={17} />
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          BACKGROUND DECORATION
      ================================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#4F39F6]/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#4F39F6]/10 blur-3xl" />

        <div className="absolute left-[20%] top-[15%] h-2 w-2 rounded-full bg-[#4F39F6]/30" />

        <div className="absolute right-[22%] top-[25%] h-3 w-3 rounded-full bg-[#4F39F6]/20" />

        <div className="absolute bottom-[20%] left-[15%] h-3 w-3 rounded-full bg-[#4F39F6]/20" />

      </div>

      {/* =================================================
          MAIN
      ================================================= */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">

        <div className="w-full max-w-[1050px]">

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_80px_rgba(31,41,55,0.10)]">

            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

              {/* =================================================
                  LEFT PANEL
              ================================================= */}
              <div className="relative hidden min-h-[650px] overflow-hidden bg-[#4F39F6] lg:block">

                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />

                <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" />

                <div className="absolute right-16 top-28 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex h-full flex-col justify-between p-12 xl:p-14">

                  <div>

                    <div className="inline-flex rounded-2xl bg-white p-3 shadow-xl">

                      <img
                        src={logo}
                        alt="Vraj Creation"
                        className="h-20 w-20 rounded-xl object-contain"
                      />

                    </div>

                    <h1 className="mt-8 text-3xl font-bold tracking-tight text-white xl:text-4xl">
                      Vraj Creation
                    </h1>

                    <p className="mt-2 text-sm font-medium text-white/70">
                      Admin Dashboard
                    </p>

                    <div className="mt-20 max-w-sm">

                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                        Welcome back
                      </p>

                      <h2 className="mt-4 text-4xl font-bold leading-tight text-white">
                        Manage your
                        <br />
                        business with ease.
                      </h2>

                      <p className="mt-5 text-sm leading-7 text-white/70">
                        Manage products,
                        inventory, sales,
                        purchases and your
                        Vraj Creation store
                        from one simple
                        dashboard.
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      <FiShield
                        size={19}
                      />
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-white">
                        Secure access
                      </p>

                      <p className="mt-0.5 text-xs text-white/60">
                        Your account is protected.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  RIGHT PANEL
              ================================================= */}
              <div className="flex min-h-[650px] items-center justify-center px-6 py-10 sm:px-10 md:px-14 lg:px-14 xl:px-20">

                <div className="w-full max-w-[420px]">

                  {/* Mobile logo */}
                  <div className="mb-8 flex items-center gap-3 lg:hidden">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-2">

                      <img
                        src={logo}
                        alt="Vraj Creation"
                        className="h-full w-full rounded-xl object-contain"
                      />

                    </div>

                    <div>

                      <h1 className="text-xl font-bold text-gray-900">
                        Vraj Creation
                      </h1>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Admin Dashboard
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      HEADING
                  ================================================= */}
                  <div className="mb-8">

                    <div className="mb-4 inline-flex items-center rounded-full bg-[#4F39F6]/10 px-3 py-1.5">

                      <span className="text-xs font-semibold text-[#4F39F6]">
                        Admin Portal
                      </span>

                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      Sign in
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      Enter your details to
                      access your dashboard.
                    </p>

                  </div>

                  {/* =================================================
                      ERROR MESSAGE
                  ================================================= */}
                  {error && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >

                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <FiX size={13} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-bold text-red-800">
                          Login failed
                        </p>

                        <p className="mt-0.5 text-sm leading-5 text-red-700">
                          {error}
                        </p>

                        {lockSeconds >
                          0 && (
                          <p className="mt-1 text-sm font-bold text-red-700">
                            Please try
                            again in{" "}
                            <span className="font-extrabold">
                              {
                                lockSeconds
                              }
                            
                          </span>{" "}
                            seconds.
                          </p>
                        )}

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      LOGIN FORM
                  ================================================= */}
                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="space-y-5"
                  >

                    {/* EMAIL */}
                    <div>

                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Email address
                      </label>

                      <div className="group relative">

                        <FiMail
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#4F39F6]"
                        />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={
                            formData.email
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading ||
                            lockSeconds >
                              0
                          }
                          placeholder="Enter your email"
                          className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-[#4F39F6] focus:bg-white focus:ring-4 focus:ring-[#4F39F6]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                      </div>

                    </div>

                    {/* PASSWORD */}
                    <div>

                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Password
                      </label>

                      <div className="group relative">

                        <FiLock
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#4F39F6]"
                        />

                        <input
                          id="password"
                          name="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="current-password"
                          value={
                            formData.password
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            loading ||
                            lockSeconds >
                              0
                          }
                          placeholder="Enter your password"
                          className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-[#4F39F6] focus:bg-white focus:ring-4 focus:ring-[#4F39F6]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (prev) =>
                                !prev
                            )
                          }
                          disabled={
                            loading ||
                            lockSeconds >
                              0
                          }
                          className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#4F39F6]/10 hover:text-[#4F39F6] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <FiEyeOff
                              size={18}
                            />
                          ) : (
                            <FiEye
                              size={18}
                            />
                          )}
                        </button>

                      </div>

                    </div>

                    {/* KEEP SIGNED IN */}
                    <div className="flex items-center">

                      <label className="flex cursor-pointer items-center gap-2">

                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#4F39F6]"
                        />

                        <span className="text-xs text-gray-500">
                          Keep me signed in
                        </span>

                      </label>

                    </div>

                    {/* LOGIN BUTTON */}
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        lockSeconds >
                          0
                      }
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#4F39F6] px-6 text-sm font-bold text-white shadow-[0_10px_25px_rgba(79,57,246,0.20)] transition-all duration-200 hover:bg-[#4230d5] hover:shadow-[0_14px_30px_rgba(79,57,246,0.25)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                    >

                      {loading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          <span>
                            Signing in...
                          </span>
                        </>
                      ) : lockSeconds >
                        0 ? (
                        <>
                          <FiLock
                            size={18}
                          />

                          <span>
                            Try again in{" "}
                            {
                              lockSeconds
                            }
                            s
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            Sign in to Dashboard
                          </span>

                          <FiArrowRight
                            size={18}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </>
                      )}

                    </button>

                  </form>

                  {/* REGISTER */}
                  <div className="mt-8 text-center">

                    <p className="text-sm text-gray-500">
                      Don't have an account?{" "}

                      <Link
                        to="/register"
                        className="font-semibold text-[#4F39F6] hover:text-[#3c2bc4]"
                      >
                        Create account
                      </Link>
                    </p>

                  </div>

                  {/* FOOTER */}
                  <div className="mt-10 border-t border-gray-100 pt-6 text-center">

                    <p className="text-[11px] leading-5 text-gray-400">
                      ©{" "}
                      {new Date().getFullYear()}{" "}
                      Vraj Creation

                      <span className="mx-2">
                        •
                      </span>

                      Traditional Craft,
                      Beautifully Made
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* =================================================
          ANIMATION
      ================================================= */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(30px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>

    </div>
  );
};

export default Login;