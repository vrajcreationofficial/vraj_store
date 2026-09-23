import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
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

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const email =
      formData.email.trim().toLowerCase();

    const password = formData.password;

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    console.log("LOGIN START:", email);

    try {
      const result = await login(
        email,
        password
      );

      console.log("LOGIN RESULT:", result);

      if (!result?.success) {
        setError(
          result?.message ||
            "Login failed. Please try again."
        );

        return;
      }

      setSuccess(
        "Login successful. Redirecting..."
      );

      console.log(
        "LOGIN PAGE TOKEN:",
        localStorage.getItem("token")
          ? "FOUND"
          : "NOT FOUND"
      );

      console.log(
        "LOGIN PAGE USER:",
        localStorage.getItem("user")
          ? "FOUND"
          : "NOT FOUND"
      );

      setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 400);
    } catch (err) {
      console.error(
        "LOGIN PAGE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7fb]">

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

          {/* =================================================
              CARD
          ================================================= */}

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_80px_rgba(31,41,55,0.10)]">

            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">

              {/* =================================================
                  LEFT PANEL
              ================================================= */}

              <div className="relative hidden min-h-[650px] overflow-hidden bg-[#4F39F6] lg:block">

                {/* Decorative shapes */}

                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />

                <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" />

                <div className="absolute right-16 top-28 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                {/* Content */}

                <div className="relative flex h-full flex-col justify-between p-12 xl:p-14">

                  <div>

                    {/* Logo */}

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

                    {/* Welcome text */}

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
                        Manage products, inventory,
                        sales, purchases and your
                        Vraj Creation store from one
                        simple dashboard.
                      </p>

                    </div>

                  </div>

                  {/* Security */}

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">

                      <FiShield size={19} />

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

                  {/* =================================================
                      MOBILE LOGO
                  ================================================= */}

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
                      Enter your details to access
                      your dashboard.
                    </p>

                  </div>

                  {/* =================================================
                      ERROR
                  ================================================= */}

                  {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                      <p className="text-sm leading-5 text-red-700">
                        {error}
                      </p>

                    </div>
                  )}

                  {/* =================================================
                      SUCCESS
                  ================================================= */}

                  {success && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />

                      <p className="text-sm leading-5 text-green-700">
                        {success}
                      </p>

                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form
                    onSubmit={handleSubmit}
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
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading}
                          placeholder="Enter your email"
                          className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-[#4F39F6] focus:bg-white focus:ring-4 focus:ring-[#4F39F6]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                      </div>

                    </div>

                    {/* PASSWORD */}

                    <div>

                      <div className="mb-2 flex items-center justify-between">

                        <label
                          htmlFor="password"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Password
                        </label>

                        <Link
                          to="/forgot-password"
                          className="text-xs font-semibold text-[#4F39F6] transition hover:text-[#3c2bc4]"
                        >
                          Forgot password?
                        </Link>

                      </div>

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
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          placeholder="Enter your password"
                          className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-[#4F39F6] focus:bg-white focus:ring-4 focus:ring-[#4F39F6]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (prev) => !prev
                            )
                          }
                          disabled={loading}
                          className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#4F39F6]/10 hover:text-[#4F39F6]"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <FiEyeOff size={18} />
                          ) : (
                            <FiEye size={18} />
                          )}
                        </button>

                      </div>

                    </div>

                    {/* REMEMBER */}

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

                    {/* =================================================
                        LOGIN BUTTON
                    ================================================= */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#4F39F6] px-6 text-sm font-bold text-white shadow-[0_10px_25px_rgba(79,57,246,0.20)] transition-all duration-200 hover:bg-[#4230d5] hover:shadow-[0_14px_30px_rgba(79,57,246,0.25)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                    >

                      {loading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          <span>
                            Signing in...
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

                  {/* =================================================
                      REGISTER
                  ================================================= */}

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

                  {/* =================================================
                      FOOTER
                  ================================================= */}

                  <div className="mt-10 border-t border-gray-100 pt-6 text-center">

                    <p className="text-[11px] leading-5 text-gray-400">
                      © {new Date().getFullYear()} Vraj
                      Creation
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

    </div>
  );
};

export default Login;
