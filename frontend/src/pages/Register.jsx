
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

  // =====================================================
  // REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    // =====================================================
    // REQUIRED FIELDS
    // =====================================================

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPassword ||
      !cleanConfirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    // =====================================================
    // EMAIL VALIDATION
    // =====================================================

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      setError(
        "Please enter a valid and proper email address."
      );
      return;
    }

    // =====================================================
    // PASSWORD VALIDATION
    // =====================================================

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(cleanPassword)) {
      setError(
        "Password needs 8+ characters with uppercase, lowercase, number and symbol."
      );
      return;
    }

    // =====================================================
    // CONFIRM PASSWORD
    // =====================================================

    if (cleanPassword !== cleanConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // =====================================================
    // API REGISTER
    // =====================================================

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F8FF] px-4 py-4 font-sans">

      {/* =================================================
          BACKGROUND EFFECTS
      ================================================= */}

      <div className="register-orb register-orb-one" />
      <div className="register-orb register-orb-two" />

      <div className="register-ring register-ring-one" />
      <div className="register-ring register-ring-two" />

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="relative z-10 w-full max-w-[370px]">

        {/* =================================================
            CARD
        ================================================= */}

        <div className="register-card overflow-hidden rounded-[23px] border border-[#DCE5FF] bg-white/95 shadow-[0_20px_60px_rgba(20,71,230,0.12)] backdrop-blur-xl">

          {/* TOP LINE */}

          <div className="h-[3px] bg-gradient-to-r from-[#1447E6] via-[#6D91FF] to-[#1447E6]" />

          <div className="px-6 pb-5 pt-5 sm:px-7">

            {/* =================================================
                BRAND
            ================================================= */}

            <div className="text-center">

              <div className="register-logo group relative mx-auto inline-flex">

                <div className="logo-glow" />

                <div className="relative rounded-[16px] bg-gradient-to-br from-[#1447E6] to-[#6D91FF] p-[3px] shadow-lg shadow-[#1447E6]/20">

                  <div className="rounded-[13px] bg-white p-1">

                    <img
                      src={logoImg}
                      alt="Vraj Creation"
                      className="h-14 w-14 rounded-[10px] object-cover transition duration-500 group-hover:scale-[1.05]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                  </div>

                </div>

              </div>

              <h1 className="mt-2.5 text-[22px] font-black tracking-tight text-[#172033]">
                Vraj Creation
              </h1>

              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                Create your account request
              </p>

            </div>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <div className="my-4 flex items-center justify-center gap-2">

              <span className="h-px w-9 bg-[#1447E6]/20" />

              <span className="h-1.5 w-1.5 rotate-45 bg-[#1447E6]" />

              <span className="h-px w-9 bg-[#1447E6]/20" />

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-3.5"
            >

              {/* =================================================
                  NAME
              ================================================= */}

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

              {/* =================================================
                  EMAIL
              ================================================= */}

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

              {/* =================================================
                  PASSWORD
              ================================================= */}

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

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

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

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div className="register-message flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] font-semibold leading-4 text-red-700">

                  <span>⚠</span>

                  <span>{error}</span>

                </div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================= */}

              {successMsg && (
                <div className="register-message flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[10px] font-semibold leading-4 text-emerald-700">

                  <span>✓</span>

                  <span>{successMsg}</span>

                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="register-button group relative mt-1 w-full overflow-hidden rounded-xl bg-[#1447E6] px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#1447E6]/20 transition disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* =================================================
                LOGIN
            ================================================= */}

            <div className="mt-4 border-t border-[#E8EDF7] pt-4 text-center">

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

            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="mt-3 flex items-center justify-center gap-2 text-[9px] font-medium text-slate-400">

              <span className="flex items-center gap-1">

                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                Secure Registration

              </span>

              <span>•</span>

              <span>Admin Approval</span>

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="mt-1.5 text-center text-[9px] text-slate-400">
          Traditional Craft, Beautifully Made
        </p>

      </div>

      {/* =================================================
          CUSTOM ANIMATIONS
      ================================================= */}

      <style>{`

        /* ================================================
           CARD ENTRY
        ================================================ */

        @keyframes registerEnter {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ================================================
           FLOATING ORB ONE
        ================================================ */

        @keyframes floatOne {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(20px, 25px);
          }
        }

        /* ================================================
           FLOATING ORB TWO
        ================================================ */

        @keyframes floatTwo {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(-25px, -18px);
          }
        }

        /* ================================================
           LOGO GLOW
        ================================================ */

        @keyframes logoGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.95);
          }

          50% {
            opacity: 0.75;
            transform: scale(1.08);
          }
        }

        /* ================================================
           MESSAGE
        ================================================ */

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ================================================
           CARD
        ================================================ */

        .register-card {
          animation: registerEnter 0.5s ease-out;
        }

        /* ================================================
           BACKGROUND ORBS
        ================================================ */

        .register-orb {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          filter: blur(65px);
        }

        .register-orb-one {
          width: 190px;
          height: 190px;
          left: -80px;
          top: 10%;
          background: rgba(20, 71, 230, 0.08);
          animation: floatOne 7s ease-in-out infinite;
        }

        .register-orb-two {
          width: 210px;
          height: 210px;
          right: -90px;
          bottom: 8%;
          background: rgba(79, 125, 255, 0.10);
          animation: floatTwo 8s ease-in-out infinite;
        }

        /* ================================================
           RINGS
        ================================================ */

        .register-ring {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          border: 1px solid rgba(20, 71, 230, 0.06);
        }

        .register-ring-one {
          width: 350px;
          height: 350px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .register-ring-two {
          width: 450px;
          height: 450px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-color: rgba(20, 71, 230, 0.035);
        }

        /* ================================================
           LOGO
        ================================================ */

        .logo-glow {
          position: absolute;
          inset: 4px;
          border-radius: 18px;
          background: rgba(20, 71, 230, 0.25);
          filter: blur(15px);
          animation: logoGlow 3s ease-in-out infinite;
        }

        /* ================================================
           INPUT
        ================================================ */

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

        /* ================================================
           BUTTON
        ================================================ */

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

        /* ================================================
           BUTTON SHINE
        ================================================ */

        .button-shine {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -70px;
          width: 35px;
          transform: skewX(-20deg);
          background: rgba(255, 255, 255, 0.20);
          transition: left 0.65s ease;
        }

        .register-button:hover .button-shine {
          left: 110%;
        }

        /* ================================================
           ERROR / SUCCESS
        ================================================ */

        .register-message {
          animation: messageIn 0.25s ease-out;
        }

        /* ================================================
           MOBILE
        ================================================ */

        @media (max-width: 420px) {

          .register-ring-one {
            width: 280px;
            height: 280px;
          }

          .register-ring-two {
            width: 360px;
            height: 360px;
          }

        }

        /* ================================================
           REDUCED MOTION
        ================================================ */

        @media (prefers-reduced-motion: reduce) {

          .register-card,
          .register-orb,
          .logo-glow {
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
