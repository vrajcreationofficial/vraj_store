import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";

import api from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // =====================================================
  // FORM STATE
  // =====================================================

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [resetToken, setResetToken] = useState("");

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  // =====================================================
  // RESEND OTP COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // =====================================================
  // HELPERS
  // =====================================================

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const getErrorMessage = (err, fallback) => {
    if (err?.response?.data?.message) {
      return err.response.data.message;
    }

    if (err?.response?.status === 429) {
      return "Too many requests. Please try again later.";
    }

    if (err?.code === "ECONNABORTED") {
      return "Server took too long to respond. Please try again.";
    }

    if (!err?.response) {
      return "Unable to connect to the server. Please check that the backend is running.";
    }

    return fallback;
  };

  // =====================================================
  // STEP 1 - SEND OTP
  // =====================================================

  const handleSendOtp = async (event) => {
    event.preventDefault();

    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      setEmail(cleanEmail);
      setOtp("");
      setStep("otp");
      setResendCooldown(60);

      setMessage(
        response?.data?.message ||
          "If an account exists with this email, a 6-digit OTP has been sent."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to send OTP. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 2 - VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    clearMessages();

    const cleanOtp = otp.replace(/\D/g, "");

    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/verify-reset-otp",
        {
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
        }
      );

      const token = response?.data?.resetToken;

      if (!token) {
        setError(
          "OTP verified, but reset session could not be created. Please request a new OTP."
        );
        return;
      }

      // Keep reset token only in React state.
      // Do NOT store it in localStorage.
      setResetToken(token);

      setOtp("");
      setStep("password");

      setMessage(
        "OTP verified successfully. You can now create a new password."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Invalid or expired OTP. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 3 - RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!resetToken) {
      setError(
        "Your password reset session has expired. Please request a new OTP."
      );
      setStep("email");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
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

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/reset-password",
        {
          resetToken,
          newPassword,
        }
      );

      setMessage(
        response?.data?.message ||
          "Password reset successfully."
      );

      // Clear sensitive values
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      // Go to login after a short delay
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Password reset successfully. Please login with your new password.",
          },
        });
      }, 2000);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setStep("email");

        setError(
          "Your password reset session has expired. Please request a new OTP."
        );
      } else {
        setError(
          getErrorMessage(
            err,
            "Unable to reset password. Please try again."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOtp = async () => {
    if (loading || resendCooldown > 0) {
      return;
    }

    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setStep("email");
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      setOtp("");
      setResendCooldown(60);

      setMessage(
        response?.data?.message ||
          "A new OTP has been sent to your email."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to resend OTP. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE EMAIL
  // =====================================================

  const handleChangeEmail = () => {
    clearMessages();

    setStep("email");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setResendCooldown(0);
  };

  // =====================================================
  // BACK TO OTP
  // =====================================================

  const handleBackToOtp = () => {
    clearMessages();

    setStep("otp");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
  };

  // =====================================================
  // OTP INPUT
  // =====================================================

  const handleOtpChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(value);
  };

  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const passwordLength =
    newPassword.length;

  const passwordIsValid =
    passwordLength >= 8 &&
    passwordLength <= 128;

  const passwordsMatch =
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  // =====================================================
  // STEP INDICATOR
  // =====================================================

  const currentStep =
    step === "email"
      ? 1
      : step === "otp"
      ? 2
      : 3;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full">

          {/* =====================================================
              BACK TO LOGIN
          ===================================================== */}

          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
          >
            <FiArrowLeft />
            Back to Login
          </Link>

          {/* =====================================================
              CARD
          ===================================================== */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/50">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 text-center text-white sm:px-8">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                {step === "email" && (
                  <FiMail className="h-8 w-8" />
                )}

                {step === "otp" && (
                  <FiShield className="h-8 w-8" />
                )}

                {step === "password" && (
                  <FiLock className="h-8 w-8" />
                )}
              </div>

              <h1 className="text-2xl font-bold">
                {step === "email" &&
                  "Forgot Password?"}

                {step === "otp" &&
                  "Verify OTP"}

                {step === "password" &&
                  "Create New Password"}
              </h1>

              <p className="mt-2 text-sm text-blue-100">
                {step === "email" &&
                  "Enter your registered email to receive an OTP."}

                {step === "otp" &&
                  `Enter the 6-digit OTP sent to ${email}.`}

                {step === "password" &&
                  "Create a strong new password for your account."}
              </p>
            </div>

            {/* =====================================================
                STEP INDICATOR
            ===================================================== */}

            <div className="px-6 pt-6 sm:px-8">

              <div className="flex items-center">

                {[1, 2, 3].map((item, index) => {
                  const active = currentStep >= item;

                  return (
                    <div
                      key={item}
                      className="flex flex-1 items-center"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                          active
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {currentStep > item ? (
                          <FiCheck />
                        ) : (
                          item
                        )}
                      </div>

                      {index < 2 && (
                        <div
                          className={`mx-2 h-1 flex-1 rounded-full transition ${
                            currentStep > item
                              ? "bg-indigo-600"
                              : "bg-slate-100"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}

              </div>

              <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400">
                <span>Email</span>
                <span>OTP</span>
                <span>Password</span>
              </div>
            </div>

            {/* =====================================================
                CONTENT
            ===================================================== */}

            <div className="px-6 py-6 sm:px-8 sm:py-8">

              {/* ===================================================
                  MESSAGE
              =================================================== */}

              {message && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <div className="flex items-start gap-2">
                    <FiCheck className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ===================================================
                  STEP 1 - EMAIL
              =================================================== */}

              {step === "email" && (
                <form
                  onSubmit={handleSendOtp}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="Enter your registered email"
                        autoComplete="email"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <FiMail />
                        Send OTP
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ===================================================
                  STEP 2 - OTP
              =================================================== */}

              {step === "otp" && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      6-Digit OTP
                    </label>

                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-2 text-center text-xs text-slate-500">
                      OTP is valid for 15 minutes.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading || otp.length !== 6
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        <FiShield />
                        Verify OTP
                      </>
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={
                        loading ||
                        resendCooldown > 0
                      }
                      className="inline-flex items-center gap-2 font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <FiRefreshCw
                        className={
                          loading
                            ? "animate-spin"
                            : ""
                        }
                      />

                      {resendCooldown > 0
                        ? `Resend OTP in ${resendCooldown}s`
                        : "Resend OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      disabled={loading}
                      className="font-medium text-slate-500 hover:text-slate-700"
                    >
                      Change Email
                    </button>
                  </div>
                </form>
              )}

              {/* ===================================================
                  STEP 3 - PASSWORD
              =================================================== */}

              {step === "password" && (
                <form
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                >

                  {/* NEW PASSWORD */}

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      New Password
                    </label>

                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="newPassword"
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(
                            event.target.value
                          )
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(
                            (value) => !value
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <FiEyeOff />
                        ) : (
                          <FiEye />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span
                        className={
                          passwordIsValid
                            ? "text-green-600"
                            : "text-slate-400"
                        }
                      >
                        Minimum 8 characters
                      </span>

                      <span className="text-slate-400">
                        {passwordLength}/128
                      </span>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(
                            event.target.value
                          )
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (value) => !value
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff />
                        ) : (
                          <FiEye />
                        )}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <p
                        className={`mt-2 text-xs ${
                          passwordsMatch
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordsMatch
                          ? "Passwords match."
                          : "Passwords do not match."}
                      </p>
                    )}
                  </div>

                  {/* RESET BUTTON */}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !passwordIsValid ||
                      !passwordsMatch
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <FiLock />
                        Reset Password
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToOtp}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
                  >
                    <FiArrowLeft />
                    Back to OTP
                  </button>
                </form>
              )}

              {/* ===================================================
                  SECURITY INFO
              =================================================== */}

              <div className="mt-7 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <FiShield className="mt-0.5 shrink-0 text-indigo-500" />

                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Secure Password Reset
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your OTP is valid for 15 minutes and
                      can only be used a limited number of
                      times.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Vraj Creation. All
            rights reserved.
          </p>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;