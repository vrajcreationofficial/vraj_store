
import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "vraj_daily_wages";

/* =====================================================
   READ RECORDS
===================================================== */

const getRecords = () => {
  try {
    const records = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(records)) {
      return [];
    }

    // Old labourName data ko employeeName me convert
    return records.map((record) => ({
      ...record,
      employeeName:
        record.employeeName ||
        record.labourName ||
        "",
    }));
  } catch {
    return [];
  }
};

/* =====================================================
   DATE
===================================================== */

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

const formatDate = (date) => {
  if (!date) return "—";

  const d = new Date(`${date}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMonth = (month) => {
  if (!month) return "—";

  const d = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return month;
  }

  return d.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatGeneratedOn = () => {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

/* =====================================================
   DAYS IN MONTH
===================================================== */

const getDaysInMonth = (month) => {
  if (!month) return 0;

  const [year, monthNumber] = month
    .split("-")
    .map(Number);

  return new Date(year, monthNumber, 0).getDate();
};

/* =====================================================
   CREATE MONTHLY DAYS
===================================================== */

const createMonthlyDays = (
  month,
  dailyWage = 0,
  existingRecords = [],
  employeeName = ""
) => {
  const totalDays = getDaysInMonth(month);

  if (!totalDays) return [];

  const result = [];

  for (let day = 1; day <= totalDays; day++) {
    const date = `${month}-${String(day).padStart(
      2,
      "0"
    )}`;

    const existing = existingRecords.find(
      (record) =>
        record.date === date &&
        String(
          record.employeeName ||
            record.labourName ||
            ""
        )
          .trim()
          .toLowerCase() ===
          String(employeeName || "")
            .trim()
            .toLowerCase()
    );

    if (existing) {
      result.push({
        id:
          existing.id ||
          `${date}-${employeeName}`,

        date,

        status:
          existing.status || "Present",

        comeInTime:
          existing.comeInTime || "",

        comeOutTime:
          existing.comeOutTime || "",

        dailyWage:
          Number(existing.dailyWage || 0),

        advance:
          Number(existing.advance || 0),

        remaining:
          Number(existing.remaining || 0),

        createdAt:
          existing.createdAt || "",

        existing: true,
      });
    } else {
      result.push({
        id: `${date}-${Date.now()}-${day}`,

        date,

        status: "Present",

        comeInTime: "",

        comeOutTime: "",

        dailyWage:
          Number(dailyWage || 0),

        advance: 0,

        remaining:
          Number(dailyWage || 0),

        createdAt: "",

        existing: false,
      });
    }
  }

  return result;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function DailyWagesForm({
  editRecord = null,
  onSaved,
}) {
  const [entryMode, setEntryMode] =
    useState("daily");

  /* ===================================================
     DAILY FORM
  =================================================== */

  const [form, setForm] = useState({
    date: getToday(),
    employeeName: "",
    dailyWage: "",
    advance: "",
    comeInTime: "",
    comeOutTime: "",
    status: "Present",
  });

  /* ===================================================
     MONTHLY FORM
  =================================================== */

  const [monthlyForm, setMonthlyForm] =
    useState({
      month: getCurrentMonth(),
      employeeName: "",
      dailyWage: "",
    });

  const [monthlyDays, setMonthlyDays] =
    useState([]);

  const [generatedOn, setGeneratedOn] =
    useState(formatGeneratedOn());

  const [recordCount, setRecordCount] =
    useState(getRecords().length);

  const [showStatement, setShowStatement] =
    useState(false);

  /* =====================================================
     EDIT EXISTING DAILY RECORD
  ===================================================== */

  useEffect(() => {
    if (editRecord) {
      setEntryMode("daily");

      setForm({
        date:
          editRecord.date ||
          getToday(),

        employeeName:
          editRecord.employeeName ||
          editRecord.labourName ||
          "",

        dailyWage:
          editRecord.dailyWage ?? "",

        advance:
          editRecord.advance ?? "",

        comeInTime:
          editRecord.comeInTime || "",

        comeOutTime:
          editRecord.comeOutTime || "",

        status:
          editRecord.status ||
          "Present",
      });

      setGeneratedOn(
        formatGeneratedOn()
      );
    }
  }, [editRecord]);

  /* =====================================================
     GENERATED TIME
  ===================================================== */

  useEffect(() => {
    const interval = setInterval(() => {
      setGeneratedOn(
        formatGeneratedOn()
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* =====================================================
     DAILY CALCULATION
  ===================================================== */

  const dailyWage = useMemo(() => {
    return Math.max(
      0,
      Number(form.dailyWage || 0)
    );
  }, [form.dailyWage]);

  const advance = useMemo(() => {
    return Math.max(
      0,
      Number(form.advance || 0)
    );
  }, [form.advance]);

  const remaining = useMemo(() => {
    if (form.status === "Absent") {
      return 0;
    }

    return Math.max(
      0,
      dailyWage - advance
    );
  }, [
    dailyWage,
    advance,
    form.status,
  ]);

  /* =====================================================
     MONTHLY SUMMARY
  ===================================================== */

  const monthlySummary = useMemo(() => {
    const presentDays =
      monthlyDays.filter(
        (day) =>
          day.status === "Present"
      );

    const absentDays =
      monthlyDays.filter(
        (day) =>
          day.status === "Absent"
      );

    const totalWage =
      presentDays.reduce(
        (sum, day) =>
          sum +
          Number(
            day.dailyWage || 0
          ),
        0
      );

    const totalAdvance =
      presentDays.reduce(
        (sum, day) =>
          sum +
          Number(
            day.advance || 0
          ),
        0
      );

    const totalRemaining =
      presentDays.reduce(
        (sum, day) =>
          sum +
          Number(
            day.remaining || 0
          ),
        0
      );

    return {
      totalDays:
        monthlyDays.length,

      presentDays:
        presentDays.length,

      absentDays:
        absentDays.length,

      totalWage,

      totalAdvance,

      totalRemaining,
    };
  }, [monthlyDays]);

  /* =====================================================
     UPDATE DAILY FORM
  ===================================================== */

  const update = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     UPDATE MONTHLY FORM
  ===================================================== */

  const updateMonthlyForm = (e) => {
    const {
      name,
      value,
    } = e.target;

    setMonthlyForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    if (name === "month") {
      setMonthlyDays([]);
    }
  };

  /* =====================================================
     LOAD MONTH
  ===================================================== */

  const loadMonth = () => {
    if (!monthlyForm.month) {
      alert("Month select karein.");
      return;
    }

    if (
      !monthlyForm.employeeName.trim()
    ) {
      alert(
        "Employee Name required hai."
      );
      return;
    }

    if (
      Number(
        monthlyForm.dailyWage || 0
      ) <= 0
    ) {
      alert(
        "Daily Wage required hai."
      );
      return;
    }

    const records = getRecords();

    const days =
      createMonthlyDays(
        monthlyForm.month,
        Number(
          monthlyForm.dailyWage
        ),
        records,
        monthlyForm.employeeName
      );

    setMonthlyDays(days);
    setShowStatement(false);
  };

  /* =====================================================
     UPDATE MONTHLY DAY
  ===================================================== */

  const updateMonthlyDay = (
    index,
    field,
    value
  ) => {
    setMonthlyDays(
      (previous) =>
        previous.map(
          (day, i) => {
            if (i !== index) {
              return day;
            }

            const updated = {
              ...day,
              [field]: value,
            };

            /* STATUS */

            if (field === "status") {
              if (
                value === "Absent"
              ) {
                updated.dailyWage = 0;
                updated.advance = 0;
                updated.remaining = 0;
              } else {
                const wage =
                  Number(
                    updated.dailyWage ||
                      monthlyForm.dailyWage ||
                      0
                  );

                updated.dailyWage =
                  wage;

                updated.remaining =
                  Math.max(
                    0,
                    wage -
                      Number(
                        updated.advance ||
                          0
                      )
                  );
              }
            }

            /* DAILY WAGE */

            if (
              field === "dailyWage"
            ) {
              const wage =
                Math.max(
                  0,
                  Number(value || 0)
                );

              updated.dailyWage =
                updated.status ===
                "Absent"
                  ? 0
                  : wage;

              updated.remaining =
                updated.status ===
                "Absent"
                  ? 0
                  : Math.max(
                      0,
                      wage -
                        Number(
                          updated.advance ||
                            0
                        )
                    );
            }

            /* ADVANCE */

            if (
              field === "advance"
            ) {
              const adv =
                Math.max(
                  0,
                  Number(value || 0)
                );

              const wage =
                updated.status ===
                "Absent"
                  ? 0
                  : Number(
                      updated.dailyWage ||
                        0
                    );

              if (adv > wage) {
                updated.advance =
                  wage;
              } else {
                updated.advance =
                  adv;
              }

              updated.remaining =
                Math.max(
                  0,
                  wage -
                    Number(
                      updated.advance ||
                        0
                    )
                );
            }

            return updated;
          }
        )
    );
  };

  /* =====================================================
     SET ALL PRESENT
  ===================================================== */

  const markAllPresent = () => {
    setMonthlyDays(
      (previous) =>
        previous.map((day) => {
          const wage =
            Number(
              day.dailyWage ||
                monthlyForm.dailyWage ||
                0
            );

          const advance =
            Math.min(
              Number(
                day.advance || 0
              ),
              wage
            );

          return {
            ...day,

            status: "Present",

            dailyWage: wage,

            advance,

            remaining:
              Math.max(
                0,
                wage - advance
              ),
          };
        })
    );
  };

  /* =====================================================
     SET ALL ABSENT
  ===================================================== */

  const markAllAbsent = () => {
    setMonthlyDays(
      (previous) =>
        previous.map((day) => ({
          ...day,

          status: "Absent",

          dailyWage: 0,

          advance: 0,

          remaining: 0,
        }))
    );
  };

  /* =====================================================
     SAVE DAILY
  ===================================================== */

  const saveDaily = (e) => {
    e.preventDefault();

    if (!form.date) {
      alert("Date is required.");
      return;
    }

    if (
      !form.employeeName.trim()
    ) {
      alert(
        "Employee Name is required."
      );
      return;
    }

    if (
      form.status === "Present" &&
      dailyWage <= 0
    ) {
      alert(
        "Daily Wage is required."
      );
      return;
    }

    if (advance > dailyWage) {
      alert(
        `Advance ₹${advance} cannot be greater than Daily Wage ₹${dailyWage}.`
      );
      return;
    }

    const records = getRecords();

    const recordData = {
      date: form.date,

      employeeName:
        form.employeeName.trim(),

      dailyWage:
        form.status === "Absent"
          ? 0
          : dailyWage,

      advance:
        form.status === "Absent"
          ? 0
          : advance,

      remaining,

      total:
        form.status === "Absent"
          ? 0
          : dailyWage,

      comeInTime:
        form.status === "Absent"
          ? ""
          : form.comeInTime,

      comeOutTime:
        form.status === "Absent"
          ? ""
          : form.comeOutTime,

      status:
        form.status,
    };

    /* ===================================================
       UPDATE EXISTING
    =================================================== */

    if (editRecord?.id) {
      const updated =
        records.map((record) =>
          record.id ===
          editRecord.id
            ? {
                ...record,

                ...recordData,

                // old key remove
                labourName:
                  undefined,

                updatedAt:
                  new Date().toISOString(),
              }
            : record
        );

      const cleaned =
        updated.map(
          ({
            labourName,
            ...record
          }) => record
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cleaned)
      );

      setRecordCount(
        cleaned.length
      );

      onSaved?.(cleaned);

      alert(
        "Employee wages record updated successfully."
      );

      return;
    }

    /* ===================================================
       NEW RECORD
    =================================================== */

    const newRecord = {
      id:
        Date.now().toString(),

      ...recordData,

      createdAt:
        new Date().toISOString(),
    };

    const updated = [
      newRecord,
      ...records,
    ];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setRecordCount(
      updated.length
    );

    onSaved?.(updated);

    alert(
      "Employee wages record saved successfully."
    );

    setForm({
      date: getToday(),

      employeeName: "",

      dailyWage: "",

      advance: "",

      comeInTime: "",

      comeOutTime: "",

      status: "Present",
    });

    setGeneratedOn(
      formatGeneratedOn()
    );
  };

  /* =====================================================
     SAVE MONTH
  ===================================================== */

  const saveMonthly = () => {
    if (!monthlyForm.month) {
      alert("Month select karein.");
      return;
    }

    if (
      !monthlyForm.employeeName.trim()
    ) {
      alert(
        "Employee Name required hai."
      );
      return;
    }

    if (!monthlyDays.length) {
      alert(
        "Pehle month load karein."
      );
      return;
    }

    const records = getRecords();

    const employeeName =
      monthlyForm.employeeName.trim();

    let updatedRecords = [
      ...records,
    ];

    monthlyDays.forEach((day) => {
      const newRecord = {
        id:
          day.id ||
          `${day.date}-${Date.now()}-${Math.random()}`,

        date: day.date,

        employeeName,

        status: day.status,

        dailyWage:
          day.status === "Absent"
            ? 0
            : Number(
                day.dailyWage || 0
              ),

        advance:
          day.status === "Absent"
            ? 0
            : Number(
                day.advance || 0
              ),

        remaining:
          day.status === "Absent"
            ? 0
            : Number(
                day.remaining || 0
              ),

        total:
          day.status === "Absent"
            ? 0
            : Number(
                day.dailyWage || 0
              ),

        comeInTime:
          day.status === "Absent"
            ? ""
            : day.comeInTime || "",

        comeOutTime:
          day.status === "Absent"
            ? ""
            : day.comeOutTime || "",

        createdAt:
          day.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      };

      const existingIndex =
        updatedRecords.findIndex(
          (record) =>
            record.date ===
              day.date &&
            String(
              record.employeeName ||
                record.labourName ||
                ""
            )
              .trim()
              .toLowerCase() ===
              employeeName.toLowerCase()
        );

      if (existingIndex >= 0) {
        updatedRecords[
          existingIndex
        ] = {
          ...updatedRecords[
            existingIndex
          ],

          ...newRecord,

          labourName:
            undefined,
        };
      } else {
        updatedRecords.unshift(
          newRecord
        );
      }
    });

    // Old labourName field remove
    updatedRecords =
      updatedRecords.map(
        ({
          labourName,
          ...record
        }) => record
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedRecords
      )
    );

    setRecordCount(
      updatedRecords.length
    );

    onSaved?.(
      updatedRecords
    );

    setGeneratedOn(
      formatGeneratedOn()
    );

    alert(
      `${formatMonth(
        monthlyForm.month
      )} की employee wages successfully save/update हो गई।`
    );

    setShowStatement(true);
  };

  /* =====================================================
     PRINT MONTHLY STATEMENT
  ===================================================== */

  const printMonthlyStatement =
    () => {
      if (!monthlyDays.length) {
        alert(
          "Pehle month load karein."
        );
        return;
      }

      setGeneratedOn(
        formatGeneratedOn()
      );

      setShowStatement(true);

      setTimeout(() => {
        window.print();
      }, 150);
    };

  /* =====================================================
     CLEAR DAILY
  ===================================================== */

  const clearDailyForm = () => {
    setForm({
      date: getToday(),

      employeeName: "",

      dailyWage: "",

      advance: "",

      comeInTime: "",

      comeOutTime: "",

      status: "Present",
    });
  };

  /* =====================================================
     CLEAR MONTH
  ===================================================== */

  const clearMonthlyForm = () => {
    setMonthlyForm({
      month: getCurrentMonth(),

      employeeName: "",

      dailyWage: "",
    });

    setMonthlyDays([]);

    setShowStatement(false);
  };

  return (
    <>
      <div className="daily-wages-form">

        {/* HEADER */}

        <div className="dw-header">

          <div className="dw-brand">
            <h2>
              VRAJ CREATION
            </h2>

            <p>
              Traditional Craft, Beautifully Made
            </p>
          </div>

          <div className="dw-statement">
            <h3>
              STATEMENT
            </h3>

            <p>
              Employee Wages
            </p>
          </div>

        </div>

        {/* MODE SWITCH */}

        <div className="dw-mode-switch">

          <button
            type="button"
            className={
              entryMode === "daily"
                ? "active"
                : ""
            }
            onClick={() => {
              setEntryMode("daily");
              setShowStatement(false);
            }}
          >
            Daily Entry
          </button>

          <button
            type="button"
            className={
              entryMode === "monthly"
                ? "active"
                : ""
            }
            onClick={() => {
              setEntryMode("monthly");
              setShowStatement(false);
            }}
          >
            Monthly Entry
          </button>

        </div>

        {/* =================================================
            DAILY MODE
        ================================================= */}

        {entryMode === "daily" && (
          <>

            <div className="dw-meta">

              <div className="dw-meta-item">
                <span>
                  Bill Date
                </span>

                <div className="dw-meta-box">
                  {formatDate(
                    form.date
                  )}
                </div>
              </div>

              <div className="dw-meta-item">
                <span>
                  Generated On
                </span>

                <div className="dw-meta-box">
                  {generatedOn}
                </div>
              </div>

              <div className="dw-meta-item">
                <span>
                  Records
                </span>

                <div className="dw-meta-box">
                  {recordCount}
                </div>
              </div>

              <div className="dw-meta-item">
                <span>
                  Statement
                </span>

                <div className="dw-meta-box">
                  Employee Wages
                </div>
              </div>

            </div>

            <form
              onSubmit={saveDaily}
            >

              <div className="dw-section-title">
                Daily Employee Wages Entry
              </div>

              <div className="dw-grid">

                <label>
                  <span>
                    Date
                  </span>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={update}
                  />
                </label>

                <label>
                  <span>
                    Employee Name
                  </span>

                  <input
                    type="text"
                    name="employeeName"
                    value={
                      form.employeeName
                    }
                    onChange={update}
                    placeholder="Enter employee name"
                  />
                </label>

                <label>
                  <span>
                    Status
                  </span>

                  <select
                    name="status"
                    value={form.status}
                    onChange={update}
                  >
                    <option value="Present">
                      Present
                    </option>

                    <option value="Absent">
                      Absent
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Daily Wage
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="dailyWage"
                    value={
                      form.status ===
                      "Absent"
                        ? 0
                        : form.dailyWage
                    }
                    onChange={update}
                    disabled={
                      form.status ===
                      "Absent"
                    }
                    placeholder="700"
                  />
                </label>

                <label>
                  <span>
                    Come In Time
                  </span>

                  <input
                    type="time"
                    name="comeInTime"
                    value={
                      form.comeInTime
                    }
                    onChange={update}
                    disabled={
                      form.status ===
                      "Absent"
                    }
                  />
                </label>

                <label>
                  <span>
                    Come Out Time
                  </span>

                  <input
                    type="time"
                    name="comeOutTime"
                    value={
                      form.comeOutTime
                    }
                    onChange={update}
                    disabled={
                      form.status ===
                      "Absent"
                    }
                  />
                </label>

                <label>
                  <span>
                    Advance
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="advance"
                    value={
                      form.status ===
                      "Absent"
                        ? 0
                        : form.advance
                    }
                    onChange={update}
                    disabled={
                      form.status ===
                      "Absent"
                    }
                    placeholder="300"
                  />
                </label>

                <label>
                  <span>
                    Remaining
                  </span>

                  <input
                    type="number"
                    value={
                      remaining
                    }
                    readOnly
                  />
                </label>

                <label>
                  <span>
                    Total Daily Wage
                  </span>

                  <input
                    type="number"
                    value={
                      form.status ===
                      "Absent"
                        ? 0
                        : dailyWage
                    }
                    readOnly
                  />
                </label>

              </div>

              <div className="dw-calculation">

                <div className="dw-calculation-item">
                  <span>
                    Daily Wage
                  </span>

                  <strong>
                    ₹
                    {dailyWage.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>

                <div className="dw-calculation-item">
                  <span>
                    Advance Taken
                  </span>

                  <strong>
                    ₹
                    {advance.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>

                <div className="dw-calculation-item">
                  <span>
                    Remaining Balance
                  </span>

                  <strong>
                    ₹
                    {remaining.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>

              </div>

              <div className="dw-actions">

                <button type="submit">
                  {editRecord
                    ? "Update Record"
                    : "Save Record"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={
                    clearDailyForm
                  }
                >
                  Clear
                </button>

              </div>

            </form>

          </>
        )}

        {/* =================================================
            MONTHLY MODE
        ================================================= */}

        {entryMode === "monthly" && (
          <>

            <div className="dw-section-title">
              Monthly Employee Wages Entry
            </div>

            <div className="monthly-top-form">

              <label>
                <span>
                  Month
                </span>

                <input
                  type="month"
                  name="month"
                  value={
                    monthlyForm.month
                  }
                  onChange={
                    updateMonthlyForm
                  }
                />
              </label>

              <label>
                <span>
                  Employee Name
                </span>

                <input
                  type="text"
                  name="employeeName"
                  value={
                    monthlyForm.employeeName
                  }
                  onChange={
                    updateMonthlyForm
                  }
                  placeholder="Enter employee name"
                />
              </label>

              <label>
                <span>
                  Default Daily Wage
                </span>

                <input
                  type="number"
                  min="0"
                  name="dailyWage"
                  value={
                    monthlyForm.dailyWage
                  }
                  onChange={
                    updateMonthlyForm
                  }
                  placeholder="700"
                />
              </label>

              <div className="monthly-load-button">

                <button
                  type="button"
                  onClick={
                    loadMonth
                  }
                >
                  Load Month
                </button>

              </div>

            </div>

            {monthlyDays.length >
              0 && (
              <>

                <div className="monthly-toolbar">

                  <div>
                    <strong>
                      {
                        monthlyForm.employeeName
                      }
                    </strong>

                    <span>
                      {formatMonth(
                        monthlyForm.month
                      )}
                    </span>
                  </div>

                  <div className="monthly-toolbar-buttons">

                    <button
                      type="button"
                      onClick={
                        markAllPresent
                      }
                    >
                      Mark All Present
                    </button>

                    <button
                      type="button"
                      className="absent-btn"
                      onClick={
                        markAllAbsent
                      }
                    >
                      Mark All Absent
                    </button>

                  </div>

                </div>

                <div className="monthly-table-wrapper">

                  <table className="monthly-table">

                    <thead>
                      <tr>
                        <th>
                          S.No
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Come In
                        </th>

                        <th>
                          Come Out
                        </th>

                        <th>
                          Daily Wage
                        </th>

                        <th>
                          Advance
                        </th>

                        <th>
                          Remaining
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {monthlyDays.map(
                        (
                          day,
                          index
                        ) => (
                          <tr
                            key={
                              day.id
                            }
                            className={
                              day.status ===
                              "Absent"
                                ? "absent-row"
                                : ""
                            }
                          >

                            <td>
                              {
                                index +
                                1
                              }
                            </td>

                            <td>
                              {formatDate(
                                day.date
                              )}
                            </td>

                            <td>
                              <select
                                value={
                                  day.status
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMonthlyDay(
                                    index,
                                    "status",
                                    e.target
                                      .value
                                  )
                                }
                              >
                                <option value="Present">
                                  Present
                                </option>

                                <option value="Absent">
                                  Absent
                                </option>
                              </select>
                            </td>

                            <td>
                              <input
                                type="time"
                                value={
                                  day.comeInTime
                                }
                                disabled={
                                  day.status ===
                                  "Absent"
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMonthlyDay(
                                    index,
                                    "comeInTime",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="time"
                                value={
                                  day.comeOutTime
                                }
                                disabled={
                                  day.status ===
                                  "Absent"
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMonthlyDay(
                                    index,
                                    "comeOutTime",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                value={
                                  day.status ===
                                  "Absent"
                                    ? 0
                                    : day.dailyWage
                                }
                                disabled={
                                  day.status ===
                                  "Absent"
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMonthlyDay(
                                    index,
                                    "dailyWage",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                value={
                                  day.status ===
                                  "Absent"
                                    ? 0
                                    : day.advance
                                }
                                disabled={
                                  day.status ===
                                  "Absent"
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateMonthlyDay(
                                    index,
                                    "advance",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td className="remaining-cell">
                              ₹
                              {Number(
                                day.remaining ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* MONTH SUMMARY */}

                <div className="monthly-summary">

                  <div>
                    <span>
                      Total Days
                    </span>

                    <strong>
                      {
                        monthlySummary.totalDays
                      }
                    </strong>
                  </div>

                  <div className="present-summary">
                    <span>
                      Present Days
                    </span>

                    <strong>
                      {
                        monthlySummary.presentDays
                      }
                    </strong>
                  </div>

                  <div className="absent-summary">
                    <span>
                      Absent Days
                    </span>

                    <strong>
                      {
                        monthlySummary.absentDays
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Wages
                    </span>

                    <strong>
                      ₹
                      {monthlySummary.totalWage.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Advance
                    </span>

                    <strong>
                      ₹
                      {monthlySummary.totalAdvance.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Remaining
                    </span>

                    <strong>
                      ₹
                      {monthlySummary.totalRemaining.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                {/* MONTH ACTIONS */}

                <div className="dw-actions monthly-actions">

                  <button
                    type="button"
                    onClick={
                      saveMonthly
                    }
                  >
                    Save / Update Full Month
                  </button>

                  <button
                    type="button"
                    className="statement-btn"
                    onClick={() =>
                      setShowStatement(
                        true
                      )
                    }
                  >
                    View Statement
                  </button>

                  <button
                    type="button"
                    className="print-btn"
                    onClick={
                      printMonthlyStatement
                    }
                  >
                    Print Statement
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={
                      clearMonthlyForm
                    }
                  >
                    Clear
                  </button>

                </div>

              </>
            )}

          </>
        )}

      </div>

      {/* =====================================================
          MONTHLY PRINT STATEMENT
      ===================================================== */}

      {entryMode === "monthly" &&
        monthlyDays.length > 0 &&
        showStatement && (
          <div className="monthly-print-statement">

            <div className="statement-watermark">
              <img
                src="/assets/logo.png"
                alt=""
              />
            </div>

            <div className="statement-header">

              <div>
                <h1>
                  VRAJ CREATION
                </h1>

                <p>
                  Traditional Craft, Beautifully Made
                </p>
              </div>

              <div className="statement-title">

                <h2>
                  DAILY WAGES
                </h2>

                <p>
                  Monthly Employee Statement
                </p>

              </div>

            </div>

            <div className="statement-meta">

              <div>
                <span>
                  Employee Name
                </span>

                <strong>
                  {
                    monthlyForm.employeeName
                  }
                </strong>
              </div>

              <div>
                <span>
                  Month
                </span>

                <strong>
                  {formatMonth(
                    monthlyForm.month
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Generated On
                </span>

                <strong>
                  {generatedOn}
                </strong>
              </div>

            </div>

            <table className="statement-table">

              <thead>

                <tr>
                  <th>
                    S.No
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    In Time
                  </th>

                  <th>
                    Out Time
                  </th>

                  <th>
                    Daily Wage
                  </th>

                  <th>
                    Advance
                  </th>

                  <th>
                    Balance
                  </th>
                </tr>

              </thead>

              <tbody>

                {monthlyDays.map(
                  (
                    day,
                    index
                  ) => (
                    <tr
                      key={
                        day.id
                      }
                      className={
                        day.status ===
                        "Absent"
                          ? "statement-absent"
                          : ""
                      }
                    >

                      <td>
                        {
                          index +
                          1
                        }
                      </td>

                      <td>
                        {formatDate(
                          day.date
                        )}
                      </td>

                      <td>
                        {
                          day.status
                        }
                      </td>

                      <td>
                        {
                          day.comeInTime ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          day.comeOutTime ||
                          "—"
                        }
                      </td>

                      <td>
                        ₹
                        {Number(
                          day.dailyWage ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        ₹
                        {Number(
                          day.advance ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        ₹
                        {Number(
                          day.remaining ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

            <div className="statement-total-box">

              <div>
                <span>
                  Present Days
                </span>

                <strong>
                  {
                    monthlySummary.presentDays
                  }
                </strong>
              </div>

              <div>
                <span>
                  Absent Days
                </span>

                <strong>
                  {
                    monthlySummary.absentDays
                  }
                </strong>
              </div>

              <div>
                <span>
                  Total Wages
                </span>

                <strong>
                  ₹
                  {monthlySummary.totalWage.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Total Advance
                </span>

                <strong>
                  ₹
                  {monthlySummary.totalAdvance.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Net Balance
                </span>

                <strong>
                  ₹
                  {monthlySummary.totalRemaining.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

            </div>

            <div className="statement-note">

              <strong>
                Note:
              </strong>

              <span>
                Absent days are not included in
                wage calculation.
              </span>

            </div>

            <div className="statement-signature">

              <div className="signature-box">

                <div className="signature-line"></div>

                <strong>
                  Authorized Signature
                </strong>

              </div>

            </div>

          </div>
        )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .daily-wages-form {
          width: 100%;
          background: #ffffff;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.08);
          color: #1e293b;
        }

        .dw-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 2px solid #8f3424;
          padding-bottom: 18px;
          margin-bottom: 20px;
        }

        .dw-brand h2 {
          margin: 0;
          color: #8f3424;
          font-size: 24px;
          font-weight: 800;
        }

        .dw-brand p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .dw-statement {
          text-align: right;
        }

        .dw-statement h3 {
          margin: 0;
          color: #8f3424;
          font-size: 16px;
          font-weight: 800;
        }

        .dw-statement p {
          margin: 4px 0 0;
          color: #334155;
          font-size: 15px;
          font-weight: 700;
        }

        .dw-mode-switch {
          display: flex;
          gap: 10px;
          margin-bottom: 22px;
          padding: 5px;
          background: #f1f5f9;
          border-radius: 10px;
          width: fit-content;
        }

        .dw-mode-switch button {
          border: 0;
          padding: 10px 20px;
          border-radius: 7px;
          background: transparent;
          color: #475569;
          font-weight: 700;
          cursor: pointer;
        }

        .dw-mode-switch button.active {
          background: #8f3424;
          color: #ffffff;
        }

        .dw-meta {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 14px;
          margin-bottom: 24px;
        }

        .dw-meta-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dw-meta-item span {
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .dw-meta-box {
          min-height: 42px;
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
        }

        .dw-section-title {
          margin-bottom: 15px;
          color: #8f3424;
          font-size: 16px;
          font-weight: 800;
          border-left: 4px solid #8f3424;
          padding-left: 10px;
        }

        .dw-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 16px;
        }

        .dw-grid label,
        .monthly-top-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }

        .dw-grid label span,
        .monthly-top-form label span {
          font-weight: 700;
        }

        .dw-grid input,
        .dw-grid select,
        .monthly-top-form input,
        .monthly-table input,
        .monthly-table select {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #1e293b;
          font-size: 14px;
        }

        .dw-grid input:focus,
        .dw-grid select:focus,
        .monthly-top-form input:focus,
        .monthly-table input:focus,
        .monthly-table select:focus {
          border-color: #8f3424;
          box-shadow: 0 0 0 3px rgba(143,52,36,0.08);
        }

        .dw-grid input[readonly] {
          background: #f1f5f9;
          font-weight: 700;
        }

        .dw-grid input:disabled,
        .monthly-table input:disabled {
          background: #e2e8f0;
          color: #64748b;
          cursor: not-allowed;
        }

        .dw-calculation {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 14px;
          margin-top: 22px;
          padding: 16px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .dw-calculation-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .dw-calculation-item span {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .dw-calculation-item strong {
          color: #8f3424;
          font-size: 20px;
          font-weight: 800;
        }

        .monthly-top-form {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr auto;
          gap: 14px;
          align-items: end;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          margin-bottom: 20px;
        }

        .monthly-load-button button {
          height: 43px;
          border: 0;
          border-radius: 8px;
          padding: 0 20px;
          background: #8f3424;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .monthly-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 14px 16px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
        }

        .monthly-toolbar > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .monthly-toolbar strong {
          color: #8f3424;
          font-size: 16px;
        }

        .monthly-toolbar span {
          color: #64748b;
          font-size: 13px;
        }

        .monthly-toolbar-buttons {
          display: flex;
          gap: 8px;
        }

        .monthly-toolbar-buttons button {
          border: 0;
          border-radius: 7px;
          padding: 9px 13px;
          background: #16a34a;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .monthly-toolbar-buttons .absent-btn {
          background: #dc2626;
        }

        .monthly-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .monthly-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        .monthly-table th {
          background: #8f3424;
          color: white;
          padding: 10px 8px;
          font-size: 12px;
          white-space: nowrap;
        }

        .monthly-table td {
          padding: 7px;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
        }

        .monthly-table tr:hover {
          background: #fffaf7;
        }

        .monthly-table .absent-row {
          background: #fef2f2;
        }

        .remaining-cell {
          color: #8f3424;
          font-weight: 800;
          white-space: nowrap;
        }

        .monthly-summary {
          display: grid;
          grid-template-columns: repeat(6,1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .monthly-summary > div {
          padding: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #f8fafc;
        }

        .monthly-summary span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .monthly-summary strong {
          display: block;
          margin-top: 4px;
          color: #8f3424;
          font-size: 17px;
        }

        .monthly-summary .present-summary strong {
          color: #16a34a;
        }

        .monthly-summary .absent-summary strong {
          color: #dc2626;
        }

        .dw-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
        }

        .dw-actions button {
          border: 0;
          border-radius: 8px;
          padding: 11px 20px;
          cursor: pointer;
          background: #8f3424;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
        }

        .dw-actions .secondary {
          background: #64748b;
        }

        .dw-actions .statement-btn {
          background: #2563eb;
        }

        .dw-actions .print-btn {
          background: #111827;
        }

        .monthly-print-statement {
          display: none;
        }

        .statement-watermark {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          opacity: 0.055;
          z-index: 0;
        }

        .statement-watermark img {
          width: 105mm;
          max-width: 105mm;
          filter: grayscale(100%);
        }

        .statement-header,
        .statement-meta,
        .statement-table,
        .statement-total-box,
        .statement-note,
        .statement-signature {
          position: relative;
          z-index: 2;
        }

        .statement-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #000;
          padding-bottom: 5mm;
          margin-bottom: 5mm;
        }

        .statement-header h1 {
          margin: 0;
          font-size: 20px;
        }

        .statement-header p {
          margin: 2mm 0 0;
          font-size: 9px;
        }

        .statement-title {
          text-align: right;
        }

        .statement-title h2 {
          margin: 0;
          font-size: 15px;
        }

        .statement-title p {
          font-size: 9px;
        }

        .statement-meta {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 4mm;
          margin-bottom: 5mm;
        }

        .statement-meta div {
          border: 1px solid #000;
          padding: 3mm;
        }

        .statement-meta span {
          display: block;
          font-size: 7px;
          text-transform: uppercase;
          margin-bottom: 1mm;
        }

        .statement-meta strong {
          font-size: 9px;
        }

        .statement-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.5px;
        }

        .statement-table th,
        .statement-table td {
          border: 1px solid #000;
          padding: 2.2mm 1.5mm;
          text-align: center;
        }

        .statement-table th {
          background: #eeeeee !important;
          font-weight: 800;
        }

        .statement-absent td {
          background: #f5f5f5 !important;
        }

        .statement-total-box {
          display: grid;
          grid-template-columns: repeat(5,1fr);
          gap: 2mm;
          margin-top: 5mm;
        }

        .statement-total-box div {
          border: 1px solid #000;
          padding: 3mm;
          text-align: center;
        }

        .statement-total-box span {
          display: block;
          font-size: 6.5px;
          text-transform: uppercase;
        }

        .statement-total-box strong {
          display: block;
          margin-top: 1mm;
          font-size: 10px;
        }

        .statement-note {
          margin-top: 5mm;
          font-size: 8px;
        }

        .statement-note span {
          margin-left: 4px;
        }

        .statement-signature {
          display: flex;
          justify-content: flex-end;
          margin-top: 18mm;
        }

        .signature-box {
          width: 45mm;
          text-align: center;
          font-size: 8px;
        }

        .signature-line {
          border-top: 1px solid #000;
          margin-bottom: 2mm;
        }

        /* DARK MODE */

        .dark .daily-wages-form {
          background: #0f172a;
          color: #f8fafc;
        }

        .dark .dw-brand p,
        .dark .monthly-toolbar span {
          color: #94a3b8;
        }

        .dark .dw-statement p,
        .dark .dw-meta-item span,
        .dark .dw-grid label,
        .dark .monthly-top-form label {
          color: #e2e8f0;
        }

        .dark .dw-meta-box,
        .dark .monthly-toolbar {
          background: #1e293b;
          border-color: #475569;
          color: #f8fafc;
        }

        .dark .dw-grid input,
        .dark .dw-grid select,
        .dark .monthly-top-form input,
        .dark .monthly-table input,
        .dark .monthly-table select {
          background: #1e293b;
          border-color: #475569;
          color: #f8fafc;
        }

        .dark .dw-grid input[readonly] {
          background: #334155;
        }

        .dark .dw-calculation,
        .dark .monthly-top-form,
        .dark .monthly-summary > div {
          background: #1e293b;
          border-color: #334155;
        }

        .dark .dw-calculation-item span,
        .dark .monthly-summary span {
          color: #94a3b8;
        }

        .dark .dw-mode-switch {
          background: #1e293b;
        }

        /* TABLET */

        @media (max-width: 1000px) {

          .dw-meta {
            grid-template-columns: repeat(2,1fr);
          }

          .dw-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .monthly-top-form {
            grid-template-columns: repeat(2,1fr);
          }

          .monthly-summary {
            grid-template-columns: repeat(3,1fr);
          }

        }

        /* MOBILE */

        @media (max-width: 600px) {

          .daily-wages-form {
            padding: 16px;
            border-radius: 10px;
          }

          .dw-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .dw-statement {
            text-align: left;
          }

          .dw-mode-switch {
            width: 100%;
          }

          .dw-mode-switch button {
            flex: 1;
          }

          .dw-meta,
          .dw-grid,
          .monthly-top-form,
          .dw-calculation {
            grid-template-columns: 1fr;
          }

          .monthly-summary {
            grid-template-columns: 1fr 1fr;
          }

          .monthly-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .monthly-toolbar-buttons {
            width: 100%;
          }

          .monthly-toolbar-buttons button {
            flex: 1;
          }

          .dw-actions {
            flex-direction: column;
          }

          .dw-actions button {
            width: 100%;
          }

        }

        /* PRINT */

        @media print {

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .daily-wages-form {
            display: none !important;
          }

          .monthly-print-statement,
          .monthly-print-statement * {
            visibility: visible !important;
          }

          .monthly-print-statement {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 190mm !important;
            min-height: 277mm !important;
            padding: 7mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            box-sizing: border-box !important;
          }

          .monthly-print-statement,
          .statement-table,
          .statement-total-box,
          .statement-meta div {
            border-color: #000000 !important;
          }

          .statement-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

        }

      `}</style>
    </>
  );
}

