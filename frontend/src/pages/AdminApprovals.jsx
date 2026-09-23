import { useEffect, useState } from "react";
import api from "../services/api";

const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [approvingId, setApprovingId] =
    useState(null);

  const [rejectingId, setRejectingId] =
    useState(null);

  const [error, setError] = useState("");

  // =====================================================
  // FETCH PENDING USERS
  // =====================================================

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/users/pending");

      console.log(
        "PENDING USERS RESPONSE:",
        response.data
      );

      setPendingUsers(
        response.data?.users || []
      );
    } catch (err) {
      console.error(
        "FETCH PENDING USERS ERROR:",
        err
      );

      const status =
        err.response?.status;

      const message =
        err.response?.data?.message;

      if (status === 401) {
        setError(
          "Authentication token missing ya invalid hai."
        );
      } else if (status === 403) {
        setError(
          "Sirf Admin pending users dekh sakta hai."
        );
      } else if (status === 404) {
        setError(
          "API route not found. Backend routes check karo."
        );
      } else {
        setError(
          message ||
            "Pending users load nahi ho paaye."
        );
      }

      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // =====================================================
  // APPROVE USER
  // =====================================================

  const handleApprove = async (id) => {
    if (!id) {
      alert("Invalid user ID.");
      return;
    }

    if (
      approvingId ||
      rejectingId
    ) {
      return;
    }

    try {
      setApprovingId(id);
      setError("");

      const response =
        await api.put(
          `/users/approve/${id}`
        );

      console.log(
        "APPROVE USER RESPONSE:",
        response.data
      );

      // Remove approved user from list
      setPendingUsers(
        (previousUsers) =>
          previousUsers.filter(
            (user) =>
              user._id !== id
          )
      );

      alert(
        response.data?.message ||
          "User successfully approved!"
      );
    } catch (err) {
      console.error(
        "APPROVE USER ERROR:",
        err
      );

      const message =
        err.response?.data?.message;

      alert(
        message ||
          "User approve karne mein error aayi."
      );
    } finally {
      setApprovingId(null);
    }
  };

  // =====================================================
  // REJECT USER
  // =====================================================

  const handleReject = async (id) => {
    if (!id) {
      alert("Invalid user ID.");
      return;
    }

    if (
      approvingId ||
      rejectingId
    ) {
      return;
    }

    const confirmReject =
      window.confirm(
        "Are you sure you want to reject this user registration?"
      );

    if (!confirmReject) {
      return;
    }

    try {
      setRejectingId(id);
      setError("");

      const response =
        await api.put(
          `/users/reject/${id}`
        );

      console.log(
        "REJECT USER RESPONSE:",
        response.data
      );

      // Remove rejected user from pending list
      setPendingUsers(
        (previousUsers) =>
          previousUsers.filter(
            (user) =>
              user._id !== id
          )
      );

      alert(
        response.data?.message ||
          "User registration rejected successfully."
      );
    } catch (err) {
      console.error(
        "REJECT USER ERROR:",
        err
      );

      const message =
        err.response?.data?.message;

      alert(
        message ||
          "User reject karne mein error aayi."
      );
    } finally {
      setRejectingId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center px-4">
        <div className="text-center">

          <div className="relative mx-auto mb-5 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-500 animate-spin" />

            <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-900 shadow-sm" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Loading Approvals
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pending users load ho rahe hain...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="w-full space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              👥
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                User Approvals
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review and manage new user registration requests
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={fetchPendingUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ↻
            Refresh
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              ⚠
            </div>

            <div className="flex-1">

              <p className="font-semibold text-red-700 dark:text-red-400">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchPendingUsers}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* PENDING */}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/20">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Pending Requests
              </p>

              <p className="mt-1 text-3xl font-bold text-amber-800 dark:text-amber-300">
                {pendingUsers.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/40">
              ⏳
            </div>

          </div>

        </div>

        {/* APPROVAL ACTION */}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Available Action
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-300">
                Approve
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-900/40">
              ✓
            </div>

          </div>

        </div>

        {/* REJECT ACTION */}

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-red-900/40 dark:bg-red-950/20">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Available Action
              </p>

              <p className="mt-1 text-lg font-bold text-red-800 dark:text-red-300">
                Reject
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl dark:bg-red-900/40">
              ✕
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* CARD HEADER */}

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pending Access Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Approve or reject users waiting for system access
            </p>
          </div>

          <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pendingUsers.length} Pending
          </span>

        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {pendingUsers.length === 0 ? (

          <div className="flex min-h-[320px] items-center justify-center px-5">

            <div className="text-center">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                ✓
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No Pending Requests
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Abhi koi user approval ke liye pending nahi hai.
              </p>

              <button
                type="button"
                onClick={fetchPendingUsers}
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Refresh Requests
              </button>

            </div>

          </div>

        ) : (

          /* =================================================
             USERS
          ================================================= */

          <div className="divide-y divide-slate-200 dark:divide-slate-800">

            {pendingUsers.map(
              (user) => {

                const isApproving =
                  approvingId === user._id;

                const isRejecting =
                  rejectingId === user._id;

                const isProcessing =
                  isApproving ||
                  isRejecting;

                return (
                  <div
                    key={user._id}
                    className="group flex flex-col gap-5 p-5 transition-all duration-300 hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between dark:hover:bg-slate-800/40"
                  >

                    {/* USER INFO */}

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="relative">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                          {user.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                        </div>

                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-amber-500 dark:border-slate-900" />

                      </div>

                      <div className="min-w-0">

                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                          {user.name ||
                            "Unnamed User"}
                        </h3>

                        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                          {user.email ||
                            "No email"}
                        </p>

                        {user.createdAt && (
                          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                            Requested:{" "}
                            {new Date(
                              user.createdAt
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* STATUS + ACTIONS */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>

                      <div className="flex items-center gap-2">

                        {/* APPROVE */}

                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(
                              user._id
                            )
                          }
                          disabled={
                            isProcessing
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {isApproving ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <span className="text-base">
                                ✓
                              </span>
                              Approve
                            </>
                          )}

                        </button>

                        {/* REJECT */}

                        <button
                          type="button"
                          onClick={() =>
                            handleReject(
                              user._id
                            )
                          }
                          disabled={
                            isProcessing
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:text-red-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40"
                        >

                          {isRejecting ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600 dark:border-red-800 dark:border-t-red-400" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <span className="text-base">
                                ✕
                              </span>
                              Reject
                            </>
                          )}

                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default AdminApprovals;