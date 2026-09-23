import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo2.jpeg";

// =====================================================
// CONSTANTS
// =====================================================

const REQUEST_TIMEOUT = 15000;

// Backend expects a 64-character hex token
const RESET_TOKEN_REGEX =
  /^[a-fA-F0-9]{64}$/;

// =====================================================
// COMPONENT
// =====================================================

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const abortControllerRef =
    useRef(null);

  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ===================================================
  // TOKEN VALIDATION
  // ===================================================

  const isValidToken =
    typeof token === "string" &&
    RESET_TOKEN_REGEX.test(token);

  // ===================================================
  // RESET PASSWORD
  // ===================================================

  const handleReset = async (e) => {
    e.preventDefault();

    // Prevent duplicate submission
    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    // -------------------------------------------------
    // TOKEN VALIDATION
    // -------------------------------------------------

    if (!isValidToken) {
      setError(
        "This password reset link is invalid or incomplete. Please request a new reset link."
      );
      return;
    }

    // -------------------------------------------------
    // PASSWORD VALIDATION
    // -------------------------------------------------

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword.length > 128) {
      setError(
        "Password must not exceed 128 characters."
      );
      return;
    }

    // -------------------------------------------------
    // CONFIRM PASSWORD
    // -------------------------------------------------

    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    // -------------------------------------------------
    // ABORT PREVIOUS REQUEST
    // -------------------------------------------------

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    const timeoutId =
      setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT);

    try {
      // =================================================
      // API REQUEST
      // =================================================
      //
      // IMPORTANT:
      // Backend expects:
      //
      // {
      //   newPassword: "..."
      // }
      //
      // =================================================

      const response =
        await api.post(
          `/auth/reset-password/${encodeURIComponent(
            token
          )}`,
          {
            newPassword,
          },
          {
            signal:
              controller.signal,
          }
        );

      const responseMessage =
        response?.data?.message ||
        "Password reset successfully.";

      setMessage(
        `${responseMessage} Redirecting to login...`
      );

      setSuccess(true);

      // Clear password fields
      setNewPassword("");
      setConfirmPassword("");

      // -------------------------------------------------
      // REDIRECT
      // -------------------------------------------------

      setTimeout(() => {
        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }, 3000);
    } catch (err) {
      // =================================================
      // ABORT / TIMEOUT
      // =================================================

      if (
        err?.name ===
        "CanceledError" ||
        err?.name ===
        "AbortError" ||
        err?.code ===
        "ERR_CANCELED"
      ) {
        setError(
          "The request took too long. Please try again."
        );

        return;
      }

      // =================================================
      // RATE LIMIT
      // =================================================

      if (
        err?.response?.status ===
        429
      ) {
        setError(
          "Too many reset attempts. Please try again later."
        );

        return;
      }

      // =================================================
      // INVALID / EXPIRED TOKEN
      // =================================================

      if (
        err?.response?.status ===
          400 ||
        err?.response?.status ===
          404
      ) {
        setError(
          err?.response?.data?.message ||
            "This password reset link is invalid or has expired. Please request a new link."
        );

        return;
      }

      // =================================================
      // NETWORK ERROR
      // =================================================

      if (
        !err?.response
      ) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running."
        );

        return;
      }

      // =================================================
      // OTHER SERVER ERROR
      // =================================================

      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to reset your password. Please try again later."
      );
    } finally {
      clearTimeout(
        timeoutId
      );

      setLoading(false);

      if (
        abortControllerRef.current ===
        controller
      ) {
        abortControllerRef.current =
          null;
      }
    }
  };

  // ===================================================
  // INVALID TOKEN SCREEN
  // ===================================================

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">

          <img
            src={logoImg}
            alt="Vraj Creation"
            className="mx-auto h-14 w-14 rounded-xl object-cover"
          />

          <div className="mt-5 text-4xl">
            ⚠️
          </div>

          <h1 className="mt-3 text-xl font-bold text-slate-900">
            Invalid Reset Link
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This password reset link is invalid.
            Please request a new password reset link.
          </p>

          <Link
            to="/forgot-password"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Request New Link
          </Link>

          <div className="mt-4">
            <Link
              to="/login"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 font-sans selection:bg-blue-500 selection:text-white">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[100px]" />

      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-400/10 blur-[100px]" />

      {/* =================================================
          CONTAINER
      ================================================= */}

      <div className="relative w-full max-w-md">

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-9">

          {/* =================================================
              BRAND HEADER
          ================================================= */}

          <div className="mb-8 text-center">

            <div className="relative mx-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-md shadow-blue-500/20">

              <img
                src={logoImg}
                alt="Vraj Creation"
                className="h-16 w-16 rounded-xl object-cover"
              />

            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Set New Password
            </h1>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Create a new secure password for your account
            </p>

          </div>

          {/* =================================================
              SUCCESS STATE
          ================================================= */}

          {success ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"
            >

              <div className="text-3xl">
                ✅
              </div>

              <h2 className="mt-3 text-base font-bold text-emerald-800">
                Password Updated
              </h2>

              <p className="mt-2 text-xs font-medium text-emerald-700">
                {message}
              </p>

              <Link
                to="/login"
                className="mt-5 inline-block text-xs font-bold text-emerald-700 underline"
              >
                Go to Login
              </Link>

            </div>
          ) : (

            /* =================================================
               FORM
            ================================================= */

            <form
              onSubmit={handleReset}
              className="space-y-4"
              noValidate
            >

              {/* =================================================
                  NEW PASSWORD
              ================================================= */}

              <div>

                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  New Password
                </label>

                <div className="relative">

                  <input
                    id="new-password"
                    name="newPassword"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(
                        e.target.value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) =>
                          !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {showNewPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Minimum 8 characters, maximum 128 characters.
                </p>

              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              <div>

                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Re-enter new password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) => {
                      setConfirmPassword(
                        e.target.value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) =>
                          !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600"
                >

                  <span className="shrink-0">
                    ⚠️
                  </span>

                  <span>
                    {error}
                  </span>

                </div>
              )}

              {/* =================================================
                  MESSAGE
              ================================================= */}

              {message && !success && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700"
                >

                  <span className="shrink-0">
                    ✅
                  </span>

                  <span>
                    {message}
                  </span>

                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition duration-200 hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <span className="flex items-center justify-center gap-2">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Updating...

                  </span>
                ) : (
                  "Update Password →"
                )}

              </button>

            </form>
          )}

          {/* =================================================
              BACK TO LOGIN
          ================================================= */}

          {!success && (
            <div className="mt-8 border-t border-slate-100 pt-5 text-center">

              <p className="text-xs font-medium text-slate-500">

                Remember your password?{" "}

                <Link
                  to="/login"
                  className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                >
                  Log In
                </Link>

              </p>

            </div>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
          <span>
            🔒 Secure Password Recovery
          </span>
        </div>

      </div>

    </div>
  );
};

export default ResetPassword;