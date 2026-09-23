import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo2.jpeg";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPassword ||
      !cleanConfirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid and proper email address.");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(cleanPassword)) {
      setError(
        "Password needs 8+ characters with uppercase, lowercase, number and symbol."
      );
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await register(
        cleanName,
        cleanEmail,
        cleanPassword
      );

      if (result?.success === true) {
        setSuccessMsg(
          result.message ||
            "Registration successful! Admin approval ke baad aap login kar sakenge."
        );

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 4000);

        return;
      }

      setError(
        result?.message ||
          result?.error ||
          "Registration failed. Please try again."
      );
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F7FC] font-sans">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="register-bg-orb register-bg-orb-one" />
        <div className="register-bg-orb register-bg-orb-two" />
        <div className="register-bg-circle register-bg-circle-one" />
        <div className="register-bg-circle register-bg-circle-two" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

        <div className="register-wrapper flex w-full max-w-[1080px] overflow-hidden rounded-[28px] border border-[#DCE4F5] bg-white shadow-[0_25px_80px_rgba(30,64,175,0.12)]">

          <div className="register-brand-panel relative hidden overflow-hidden lg:flex lg:w-[50%]">

            <div className="absolute inset-0 bg-gradient-to-br from-[#0F3FC4] via-[#174FE5] to-[#6A8DFF]" />

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" />

            <div className="absolute right-10 top-12 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-16 left-12 h-28 w-28 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex min-h-[650px] w-full flex-col justify-between p-10 xl:p-12">

              <div>

                <div className="flex items-center gap-3">

                  <div className="rounded-[14px] bg-white p-1.5 shadow-xl">
                    <img
                      src={logoImg}
                      alt="Vraj Creation"
                      className="h-12 w-12 rounded-[10px] object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-[20px] font-black tracking-tight text-white">
                      Vraj Creation
                    </p>

                    <p className="mt-0.5 text-[10px] font-medium tracking-wide text-white/70">
                      Bringing Art to Life
                    </p>
                  </div>

                </div>

                <div className="mt-14">

                  <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">

                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" />

                    <span className="text-[10px] font-semibold tracking-wide text-white/85">
                      ADMIN DASHBOARD
                    </span>

                  </div>

                  <h2 className="max-w-[390px] text-[38px] font-black leading-[1.08] tracking-tight text-white xl:text-[43px]">
                    Welcome
                    <br />
                    back
                  </h2>

                  <p className="mt-5 text-[22px] font-semibold leading-tight text-white/95">
                    Manage your business
                    <br />
                    with ease.
                  </p>

                  <p className="mt-5 max-w-[410px] text-[13px] font-medium leading-6 text-white/70">
                    Manage products, inventory, sales, purchases and your
                    Vraj Creation store from one simple dashboard.
                  </p>

                </div>

              </div>

              <div className="mt-10">

                <div className="mb-5 h-px w-full bg-white/15" />

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3L19 6V11C19 15.5 16.1 19.7 12 21C7.9 19.7 5 15.5 5 11V6L12 3Z"
                        stroke="white"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M9 12L11 14L15 10"
                        stroke="white"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                  </div>

                  <div>
                    <p className="text-[12px] font-bold text-white">
                      Secure access
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/60">
                      Your account is protected.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="flex w-full items-center justify-center bg-white lg:w-[50%]">

            <div className="w-full max-w-[430px] px-6 py-7 sm:px-10 sm:py-9 lg:px-12">

              <div className="text-center lg:text-left">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[15px] bg-gradient-to-br from-[#1447E6] to-[#6D91FF] p-[3px] shadow-lg shadow-[#1447E6]/20 lg:hidden">

                  <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-white p-1">

                    <img
                      src={logoImg}
                      alt="Vraj Creation"
                      className="h-full w-full rounded-[9px] object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                  </div>

                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1447E6]">
                  Create Account
                </p>

                <h1 className="mt-1.5 text-[25px] font-black tracking-tight text-[#172033]">
                  Request access
                </h1>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Create your account request to access the dashboard.
                </p>

              </div>

              <div className="my-5 flex items-center gap-3">

                <span className="h-px flex-1 bg-[#E5EAF5]" />

                <span className="h-1.5 w-1.5 rotate-45 bg-[#1447E6]" />

                <span className="h-px flex-1 bg-[#E5EAF5]" />

              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-3.5"
              >

                <div>

                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-[10px] font-bold text-[#334155]"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                    className="register-input w-full rounded-xl border border-[#D8E1F5] bg-[#F9FBFF] px-3.5 py-2.5 text-[13px] font-medium text-[#172033] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </div>

                <div>

                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[10px] font-bold text-[#334155]"
                  >
                    Authorized Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    className="register-input w-full rounded-xl border border-[#D8E1F5] bg-[#F9FBFF] px-3.5 py-2.5 text-[13px] font-medium text-[#172033] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </div>

                <div>

                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[10px] font-bold text-[#334155]"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                      className="register-input w-full rounded-xl border border-[#D8E1F5] bg-[#F9FBFF] py-2.5 pl-3.5 pr-14 text-[13px] font-medium text-[#172033] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      disabled={loading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] font-bold text-[#1447E6] transition hover:bg-[#1447E6]/10 disabled:opacity-50"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                  <p className="mt-1 text-[9px] leading-3 text-slate-400">
                    8+ chars · uppercase · lowercase · number · symbol
                  </p>

                </div>

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-[10px] font-bold text-[#334155]"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    disabled={loading}
                    autoComplete="new-password"
                    className="register-input w-full rounded-xl border border-[#D8E1F5] bg-[#F9FBFF] px-3.5 py-2.5 text-[13px] font-medium text-[#172033] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </div>

                {error && (
                  <div className="register-message flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] font-semibold leading-4 text-red-700">

                    <span className="mt-[1px]">⚠</span>

                    <span>{error}</span>

                  </div>
                )}

                {successMsg && (
                  <div className="register-message flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[10px] font-semibold leading-4 text-emerald-700">

                    <span className="mt-[1px]">✓</span>

                    <span>{successMsg}</span>

                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="register-button group relative mt-1 w-full overflow-hidden rounded-xl bg-[#1447E6] px-4 py-3 text-[13px] font-bold text-white shadow-md shadow-[#1447E6]/20 transition disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <span className="button-shine" />

                  <span className="relative flex items-center justify-center gap-2">

                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Request Access

                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}

                  </span>

                </button>

              </form>

              <div className="mt-5 border-t border-[#E8EDF7] pt-5 text-center">

                <p className="text-[10px] font-medium text-slate-500">

                  Already approved?{" "}

                  <Link
                    to="/login"
                    className="font-bold text-[#1447E6] transition hover:text-[#0F3CBF] hover:underline"
                  >
                    Log In
                  </Link>

                </p>

              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-[9px] font-medium text-slate-400">

                <span className="flex items-center gap-1">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  Secure Registration

                </span>

                <span>•</span>

                <span>Admin Approval</span>

              </div>

              <p className="mt-5 text-center text-[9px] text-slate-400">
                Traditional Craft, Beautifully Made
              </p>

            </div>

          </div>

        </div>

      </div>

      <style>{`
        @keyframes registerCardEnter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes registerFloatOne {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(25px, 20px);
          }
        }

        @keyframes registerFloatTwo {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(-20px, -25px);
          }
        }

        @keyframes registerGlow {
          0%, 100% {
            opacity: 0.3;
          }

          50% {
            opacity: 0.7;
          }
        }

        @keyframes registerMessageIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .register-wrapper {
          animation: registerCardEnter 0.5s ease-out;
        }

        .register-bg-orb {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          filter: blur(70px);
        }

        .register-bg-orb-one {
          width: 260px;
          height: 260px;
          left: -100px;
          top: 5%;
          background: rgba(20, 71, 230, 0.07);
          animation: registerFloatOne 8s ease-in-out infinite;
        }

        .register-bg-orb-two {
          width: 300px;
          height: 300px;
          right: -120px;
          bottom: 3%;
          background: rgba(79, 125, 255, 0.08);
          animation: registerFloatTwo 9s ease-in-out infinite;
        }

        .register-bg-circle {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          border: 1px solid rgba(20, 71, 230, 0.05);
        }

        .register-bg-circle-one {
          width: 450px;
          height: 450px;
          left: -180px;
          bottom: -200px;
        }

        .register-bg-circle-two {
          width: 550px;
          height: 550px;
          right: -220px;
          top: -250px;
        }

        .register-input {
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .register-input:hover {
          border-color: #B8C8F2;
        }

        .register-input:focus {
          border-color: #1447E6;
          background: white;
          box-shadow: 0 0 0 4px rgba(20, 71, 230, 0.08);
          transform: translateY(-1px);
        }

        .register-button {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .register-button:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #0F3CBF;
          box-shadow: 0 10px 25px rgba(20, 71, 230, 0.25);
        }

        .register-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .button-shine {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -70px;
          width: 35px;
          transform: skewX(-20deg);
          background: rgba(255, 255, 255, 0.2);
          transition: left 0.65s ease;
        }

        .register-button:hover .button-shine {
          left: 110%;
        }

        .register-message {
          animation: registerMessageIn 0.25s ease-out;
        }

        @media (max-width: 1023px) {
          .register-wrapper {
            max-width: 460px;
          }
        }

        @media (max-width: 480px) {
          .register-wrapper {
            border-radius: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .register-wrapper,
          .register-bg-orb {
            animation: none !important;
          }

          .register-input,
          .register-button,
          .button-shine {
            transition: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Register;