import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "vraj_daily_wages";

/* =====================================================
   READ RECORDS
===================================================== */

const readRecords = () => {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
};

/* =====================================================
   FORMAT DATE
===================================================== */

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

/* =====================================================
   TODAY
===================================================== */

const getToday = () => {
  const d = new Date();

  const year = d.getFullYear();

  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   GENERATED DATE / TIME
===================================================== */

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
   MONEY
===================================================== */

const money = (value) => {
  const amount = Number(value || 0);

  return `₹${amount.toFixed(2)}`;
};

/* =====================================================
   NORMALIZE RECORD
===================================================== */

const normalizeRecord = (record) => {
  const advance = Math.max(
    0,
    Number(record.advance || 0)
  );

  let dailyWage = Number(
    record.dailyWage ??
      record.wage ??
      record.total ??
      0
  );

  if (!Number.isFinite(dailyWage)) {
    dailyWage = 0;
  }

  dailyWage = Math.max(
    0,
    dailyWage
  );

  const remaining = Math.max(
    0,
    dailyWage - advance
  );

  return {
    ...record,
    dailyWage,
    advance,
    remaining,
  };
};

/* =====================================================
   DATE PARSER
===================================================== */

const parseDate = (date) => {
  if (!date) return null;

  const d = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d;
};

/* =====================================================
   PERIOD
===================================================== */

const formatPeriod = (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    return "—";
  }

  return `${formatDate(
    startDate
  )} – ${formatDate(endDate)}`;
};

/* =====================================================
   PERIOD START
===================================================== */

const getPeriodStartDate = (
  endDate,
  period
) => {
  const end = parseDate(endDate);

  if (!end) {
    return "";
  }

  const start = new Date(end);

  switch (period) {
    case "day":
      break;

    case "week":
      start.setDate(
        start.getDate() - 6
      );
      break;

    case "month":
      start.setMonth(
        start.getMonth() - 1
      );

      start.setDate(
        start.getDate() + 1
      );
      break;

    case "2month":
      start.setMonth(
        start.getMonth() - 2
      );

      start.setDate(
        start.getDate() + 1
      );
      break;

    default:
      break;
  }

  const year =
    start.getFullYear();

  const month = String(
    start.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    start.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   PERIOD LABEL
===================================================== */

const getPeriodLabel = (
  period
) => {
  switch (period) {
    case "day":
      return "1 Day";

    case "week":
      return "1 Week";

    case "month":
      return "1 Month";

    case "2month":
      return "2 Months";

    default:
      return "1 Day";
  }
};

/* =====================================================
   EMPLOYEE NAME
===================================================== */

const getEmployeeName = (
  record
) => {
  return (
    record.employeeName ??
    record.labourName ??
    "—"
  );
};

/* =====================================================
   COMPONENT
===================================================== */

export default function DailyWagesList() {

  /* ===================================================
     RECORDS
  =================================================== */

  const [records, setRecords] =
    useState([]);

  /* ===================================================
     SEARCH
  =================================================== */

  const [search, setSearch] =
    useState("");

  /* ===================================================
     GENERATED ON
  =================================================== */

  const [generatedOn, setGeneratedOn] =
    useState(
      formatGeneratedOn()
    );

  /* ===================================================
     PERIOD
  =================================================== */

  const [period, setPeriod] =
    useState("day");

  const [endDate, setEndDate] =
    useState(getToday());

  /* ===================================================
     EMPLOYEE FILTER
  =================================================== */

  const [selectedEmployee, setSelectedEmployee] =
    useState("all");

  /* ===================================================
     EDIT STATE
  =================================================== */

  const [editingRecord, setEditingRecord] =
    useState(null);

  const [editForm, setEditForm] =
    useState({
      date: "",
      employeeName: "",
      comeInTime: "",
      comeOutTime: "",
      dailyWage: "",
      advance: "",
    });

  /* ===================================================
     LOAD
  =================================================== */

  const load = () => {
    const data = readRecords();

    setRecords(
      Array.isArray(data)
        ? data
        : []
    );
  };

  useEffect(() => {
    load();

    const handler = () => {
      load();
    };

    window.addEventListener(
      "storage",
      handler
    );

    return () => {
      window.removeEventListener(
        "storage",
        handler
      );
    };
  }, []);

  /* ===================================================
     GENERATED TIME UPDATE
  =================================================== */

  useEffect(() => {
    const interval =
      setInterval(() => {
        setGeneratedOn(
          formatGeneratedOn()
        );
      }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* ===================================================
     NORMALIZED RECORDS
  =================================================== */

  const normalizedRecords =
    useMemo(() => {
      return records.map(
        normalizeRecord
      );
    }, [records]);

  /* ===================================================
     EMPLOYEE LIST
  =================================================== */

  const employeeList =
    useMemo(() => {

      const names =
        normalizedRecords
          .map((record) =>
            getEmployeeName(record)
          )
          .filter(
            (name) =>
              name &&
              name !== "—"
          );

      return [
        ...new Set(names),
      ].sort((a, b) =>
        String(a).localeCompare(
          String(b)
        )
      );

    }, [normalizedRecords]);

  /* ===================================================
     PERIOD START
  =================================================== */

  const startDate = useMemo(() => {
    return getPeriodStartDate(
      endDate,
      period
    );
  }, [
    endDate,
    period,
  ]);

  /* ===================================================
     PERIOD FILTER
  =================================================== */

  const periodRecords =
    useMemo(() => {

      if (
        !startDate ||
        !endDate
      ) {
        return normalizedRecords;
      }

      const start =
        parseDate(startDate);

      const end =
        parseDate(endDate);

      if (!start || !end) {
        return normalizedRecords;
      }

      return normalizedRecords.filter(
        (record) => {

          const recordDate =
            parseDate(
              record.date
            );

          if (!recordDate) {
            return false;
          }

          return (
            recordDate >= start &&
            recordDate <= end
          );
        }
      );

    }, [
      normalizedRecords,
      startDate,
      endDate,
    ]);

  /* ===================================================
     EMPLOYEE FILTER
  =================================================== */

  const employeeRecords =
    useMemo(() => {

      if (
        selectedEmployee ===
        "all"
      ) {
        return periodRecords;
      }

      return periodRecords.filter(
        (record) =>
          getEmployeeName(
            record
          ) === selectedEmployee
      );

    }, [
      periodRecords,
      selectedEmployee,
    ]);

  /* ===================================================
     SEARCH
  =================================================== */

  const filtered =
    useMemo(() => {

      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return employeeRecords;
      }

      return employeeRecords.filter(
        (record) =>
          String(
            getEmployeeName(
              record
            )
          )
            .toLowerCase()
            .includes(q) ||

          String(
            record.date || ""
          )
            .toLowerCase()
            .includes(q) ||

          String(
            record.comeInTime || ""
          )
            .toLowerCase()
            .includes(q) ||

          String(
            record.comeOutTime || ""
          )
            .toLowerCase()
            .includes(q)
      );

    }, [
      employeeRecords,
      search,
    ]);

  /* ===================================================
     PRINT RECORDS
  =================================================== */

  const printRecords =
    filtered;

  /* ===================================================
     TOTALS
  =================================================== */

  const grandDailyWage =
    printRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.dailyWage || 0
        ),
      0
    );

  const grandAdvance =
    printRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.advance || 0
        ),
      0
    );

  const grandRemaining =
    printRecords.reduce(
      (sum, record) =>
        sum +
        Number(
          record.remaining || 0
        ),
      0
    );

  /* ===================================================
     BILL DATE
  =================================================== */

  const billDate =
    endDate;

  /* ===================================================
     PERIOD TEXT
  =================================================== */

  const periodText =
    formatPeriod(
      startDate,
      endDate
    );

  /* ===================================================
     SELECTED EMPLOYEE LABEL
  =================================================== */

  const selectedEmployeeLabel =
    selectedEmployee === "all"
      ? "All Employees"
      : selectedEmployee;

  /* ===================================================
     DELETE
  =================================================== */

  const remove = (id) => {

    if (
      !window.confirm(
        "Delete this employee daily wages record?"
      )
    ) {
      return;
    }

    const updated =
      records.filter(
        (record) =>
          record.id !== id
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setRecords(updated);
  };

  /* ===================================================
     START EDIT
  =================================================== */

  const startEdit = (
    record
  ) => {

    setEditingRecord(
      record
    );

    setEditForm({
      date:
        record.date || "",

      employeeName:
        getEmployeeName(
          record
        ) === "—"
          ? ""
          : getEmployeeName(
              record
            ),

      comeInTime:
        record.comeInTime || "",

      comeOutTime:
        record.comeOutTime || "",

      dailyWage:
        record.dailyWage ??
        record.wage ??
        "",

      advance:
        record.advance ?? "",
    });
  };

  /* ===================================================
     EDIT CHANGE
  =================================================== */

  const handleEditChange = (
    e
  ) => {

    const {
      name,
      value,
    } = e.target;

    setEditForm(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };

  /* ===================================================
     SAVE EDIT
  =================================================== */

  const saveEdit = () => {

    if (
      !editingRecord
    ) {
      return;
    }

    const employeeName =
      editForm.employeeName.trim();

    if (!employeeName) {
      alert(
        "Please enter employee name."
      );
      return;
    }

    if (!editForm.date) {
      alert(
        "Please select date."
      );
      return;
    }

    const dailyWage =
      Math.max(
        0,
        Number(
          editForm.dailyWage || 0
        )
      );

    const advance =
      Math.max(
        0,
        Number(
          editForm.advance || 0
        )
      );

    const updatedRecord = {
      ...editingRecord,

      date:
        editForm.date,

      employeeName:
        employeeName,

      labourName:
        employeeName,

      comeInTime:
        editForm.comeInTime,

      comeOutTime:
        editForm.comeOutTime,

      dailyWage:
        dailyWage,

      advance:
        advance,

      remaining:
        Math.max(
          0,
          dailyWage -
            advance
        ),
    };

    const updated =
      records.map(
        (record) =>
          record.id ===
          editingRecord.id
            ? updatedRecord
            : record
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setRecords(updated);

    setEditingRecord(null);

    setEditForm({
      date: "",
      employeeName: "",
      comeInTime: "",
      comeOutTime: "",
      dailyWage: "",
      advance: "",
    });
  };

  /* ===================================================
     CANCEL EDIT
  =================================================== */

  const cancelEdit = () => {

    setEditingRecord(
      null
    );

    setEditForm({
      date: "",
      employeeName: "",
      comeInTime: "",
      comeOutTime: "",
      dailyWage: "",
      advance: "",
    });
  };

  /* ===================================================
     PRINT
  =================================================== */

  const printList = () => {

    setGeneratedOn(
      formatGeneratedOn()
    );

    setTimeout(() => {
      window.print();
    }, 100);
  };

  /* ===================================================
     RETURN
  =================================================== */

  return (
    <>
      {/* =================================================
          SCREEN
      ================================================= */}

      <div className="daily-wages-list">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="dw-list-header">

          <div className="dw-brand">

            <h1>
              VRAJ CREATION
            </h1>

            <p>
              Traditional Craft,
              Beautifully Made
            </p>

          </div>

          <div className="dw-statement">

            <h2>
              STATEMENT
            </h2>

            <p>
              Employee Daily Wages
            </p>

          </div>

        </div>

        {/* =================================================
            META
        ================================================= */}

        <div className="dw-meta">

          <div className="dw-meta-box">

            <label>
              Bill Date
            </label>

            <div className="dw-meta-value">
              {formatDate(
                billDate
              )}
            </div>

          </div>

          <div className="dw-meta-box">

            <label>
              Generated On
            </label>

            <div className="dw-meta-value">
              {generatedOn}
            </div>

          </div>

          <div className="dw-meta-box">

            <label>
              Records
            </label>

            <div className="dw-meta-value">
              {filtered.length}
            </div>

          </div>

          <div className="dw-meta-box">

            <label>
              Employee
            </label>

            <div className="dw-meta-value">
              {selectedEmployeeLabel}
            </div>

          </div>

        </div>

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="dw-period-filter">

          <div className="period-field">

            <label>
              Wage Period
            </label>

            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value
                )
              }
            >

              <option value="day">
                1 Day
              </option>

              <option value="week">
                1 Week
              </option>

              <option value="month">
                1 Month
              </option>

              <option value="2month">
                2 Months
              </option>

            </select>

          </div>

          <div className="period-field">

            <label>
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
            />

          </div>

          <div className="period-field">

            <label>
              Select Employee
            </label>

            <select
              value={
                selectedEmployee
              }
              onChange={(e) =>
                setSelectedEmployee(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Employees
              </option>

              {employeeList.map(
                (name) => (
                  <option
                    key={name}
                    value={name}
                  >
                    {name}
                  </option>
                )
              )}

            </select>

          </div>

          <div className="period-result">

            <span>
              Selected Period
            </span>

            <strong>
              {periodText}
            </strong>

            <small>
              {selectedEmployeeLabel}
            </small>

          </div>

        </div>

        {/* =================================================
            LIST HEADER
        ================================================= */}

        <div className="dw-list-head">

          <div>

            <h2>
              Employee Daily Wages Records
            </h2>

            <p>
              {selectedEmployee ===
              "all"
                ? "All employee attendance and daily wages records"
                : `Daily wages statement for ${selectedEmployee}`}
            </p>

          </div>

          <div className="dw-list-tools">

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search employee / date..."
            />

            <button
              type="button"
              onClick={printList}
            >
              🖨️ Print
            </button>

          </div>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="dw-summary">

          <div className="summary-card">

            <span>
              Total Records
            </span>

            <strong>
              {filtered.length}
            </strong>

          </div>

          <div className="summary-card">

            <span>
              Total Daily Wages
            </span>

            <strong>
              {money(
                grandDailyWage
              )}
            </strong>

          </div>

          <div className="summary-card">

            <span>
              Total Advance
            </span>

            <strong>
              {money(
                grandAdvance
              )}
            </strong>

          </div>

          <div className="summary-card">

            <span>
              Total Balance
            </span>

            <strong>
              {money(
                grandRemaining
              )}
            </strong>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="dw-table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  S.No.
                </th>

                <th>
                  Date
                </th>

                <th>
                  Employee Name
                </th>

                <th>
                  Come In Time
                </th>

                <th>
                  Come Out Time
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

                <th className="no-print">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="empty"
                  >
                    No employee daily wages
                    records found for the
                    selected filters.
                  </td>

                </tr>

              ) : (

                filtered.map(
                  (
                    record,
                    index
                  ) => (

                    <tr
                      key={
                        record.id ??
                        `${record.date}-${index}`
                      }
                    >

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {formatDate(
                          record.date
                        )}
                      </td>

                      <td className="employee-name">
                        {getEmployeeName(
                          record
                        )}
                      </td>

                      <td>
                        {
                          record.comeInTime ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          record.comeOutTime ||
                          "-"
                        }
                      </td>

                      <td>
                        {money(
                          record.dailyWage
                        )}
                      </td>

                      <td>
                        {money(
                          record.advance
                        )}
                      </td>

                      <td className="balance-cell">
                        {money(
                          record.remaining
                        )}
                      </td>

                      <td className="no-print">

                        <button
                          type="button"
                          className="edit"
                          onClick={() =>
                            startEdit(
                              record
                            )
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            remove(
                              record.id
                            )
                          }
                        >
                          🗑️ Delete
                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

            <tfoot>

              <tr>

                <td
                  colSpan="5"
                  className="grand-label"
                >
                  Grand Total
                </td>

                <td>
                  {money(
                    grandDailyWage
                  )}
                </td>

                <td>
                  {money(
                    grandAdvance
                  )}
                </td>

                <td>
                  {money(
                    grandRemaining
                  )}
                </td>

                <td className="no-print">
                </td>

              </tr>

            </tfoot>

          </table>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="dw-footer">

          <div>
            <strong>
              Statement:
            </strong>{" "}
            Employee Daily Wages
          </div>

          <div>
            <strong>
              Employee:
            </strong>{" "}
            {selectedEmployeeLabel}
          </div>

          <div>
            <strong>
              Period:
            </strong>{" "}
            {periodText}
          </div>

          <div>
            <strong>
              Total Records:
            </strong>{" "}
            {filtered.length}
          </div>

        </div>

      </div>

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {editingRecord && (

        <div className="dw-edit-overlay">

          <div className="dw-edit-modal">

            <div className="dw-edit-header">

              <div>

                <h2>
                  Edit Daily Wages
                </h2>

                <p>
                  Update employee wage record
                </p>

              </div>

              <button
                type="button"
                className="dw-edit-close"
                onClick={cancelEdit}
              >
                ×
              </button>

            </div>

            <div className="dw-edit-grid">

              <div className="dw-edit-field">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={
                    editForm.date
                  }
                  onChange={
                    handleEditChange
                  }
                />

              </div>

              <div className="dw-edit-field">

                <label>
                  Employee Name
                </label>

                <input
                  type="text"
                  name="employeeName"
                  value={
                    editForm.employeeName
                  }
                  onChange={
                    handleEditChange
                  }
                  placeholder="Employee name"
                />

              </div>

              <div className="dw-edit-field">

                <label>
                  Come In Time
                </label>

                <input
                  type="time"
                  name="comeInTime"
                  value={
                    editForm.comeInTime
                  }
                  onChange={
                    handleEditChange
                  }
                />

              </div>

              <div className="dw-edit-field">

                <label>
                  Come Out Time
                </label>

                <input
                  type="time"
                  name="comeOutTime"
                  value={
                    editForm.comeOutTime
                  }
                  onChange={
                    handleEditChange
                  }
                />

              </div>

              <div className="dw-edit-field">

                <label>
                  Daily Wage
                </label>

                <input
                  type="number"
                  name="dailyWage"
                  min="0"
                  step="0.01"
                  value={
                    editForm.dailyWage
                  }
                  onChange={
                    handleEditChange
                  }
                  placeholder="0"
                />

              </div>

              <div className="dw-edit-field">

                <label>
                  Advance
                </label>

                <input
                  type="number"
                  name="advance"
                  min="0"
                  step="0.01"
                  value={
                    editForm.advance
                  }
                  onChange={
                    handleEditChange
                  }
                  placeholder="0"
                />

              </div>

            </div>

            <div className="dw-edit-preview">

              <div>

                <span>
                  Daily Wage
                </span>

                <strong>
                  {money(
                    editForm.dailyWage
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Advance
                </span>

                <strong>
                  {money(
                    editForm.advance
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Balance
                </span>

                <strong>
                  {money(
                    Math.max(
                      0,
                      Number(
                        editForm.dailyWage ||
                          0
                      ) -
                        Number(
                          editForm.advance ||
                            0
                        )
                    )
                  )}
                </strong>

              </div>

            </div>

            <div className="dw-edit-actions">

              <button
                type="button"
                className="cancel-edit"
                onClick={
                  cancelEdit
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-edit"
                onClick={
                  saveEdit
                }
              >
                💾 Save Changes
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          A4 PRINT BILL
      ================================================= */}

      <div className="print-only-bill">

        {/* WATERMARK */}

        <div className="print-bill-watermark">

          <img
            src="../src/assets/logo.jpeg"
            alt=""
          />

        </div>

        {/* HEADER */}

        <div className="print-bill-header">

          <div className="print-company">

            <h1>
              VRAJ CREATION
            </h1>

            <p>
              Traditional Craft,
              Beautifully Made
            </p>

            <p>
              Jodhpur, Rajasthan
            </p>

          </div>

          <div className="print-bill-title">

            <h2>
              EMPLOYEE DAILY WAGES
            </h2>

            <h3>
              STATEMENT
            </h3>

          </div>

        </div>

        {/* META */}

        <div className="print-bill-meta">

          <div>

            <span>
              Bill Date
            </span>

            <strong>
              {formatDate(
                billDate
              )}
            </strong>

          </div>

          <div>

            <span>
              Period
            </span>

            <strong>
              {periodText}
            </strong>

          </div>

          <div>

            <span>
              Employee
            </span>

            <strong>
              {selectedEmployeeLabel}
            </strong>

          </div>

          <div>

            <span>
              Total Records
            </span>

            <strong>
              {printRecords.length}
            </strong>

          </div>

        </div>

        {/* PRINT TABLE */}

        <table className="print-bill-table">

          <thead>

            <tr>

              <th>
                S.No.
              </th>

              <th>
                Date
              </th>

              <th>
                Employee Name
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

            {printRecords.length ===
            0 ? (

              <tr>

                <td
                  colSpan="8"
                  className="print-empty"
                >
                  No employee daily wages
                  records found.
                </td>

              </tr>

            ) : (

              printRecords.map(
                (
                  record,
                  index
                ) => (

                  <tr
                    key={
                      record.id ??
                      `print-${record.date}-${index}`
                    }
                  >

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {formatDate(
                        record.date
                      )}
                    </td>

                    <td className="print-employee">
                      {getEmployeeName(
                        record
                      )}
                    </td>

                    <td>
                      {
                        record.comeInTime ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        record.comeOutTime ||
                        "-"
                      }
                    </td>

                    <td>
                      {money(
                        record.dailyWage
                      )}
                    </td>

                    <td>
                      {money(
                        record.advance
                      )}
                    </td>

                    <td>
                      {money(
                        record.remaining
                      )}
                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

          <tfoot>

            <tr>

              <td
                colSpan="5"
                className="print-grand-label"
              >
                GRAND TOTAL
              </td>

              <td>
                {money(
                  grandDailyWage
                )}
              </td>

              <td>
                {money(
                  grandAdvance
                )}
              </td>

              <td>
                {money(
                  grandRemaining
                )}
              </td>

            </tr>

          </tfoot>

        </table>

        {/* TOTAL SUMMARY */}

        <div className="print-total-summary">

          <div>

            <span>
              Total Daily Wages
            </span>

            <strong>
              {money(
                grandDailyWage
              )}
            </strong>

          </div>

          <div>

            <span>
              Total Advance
            </span>

            <strong>
              {money(
                grandAdvance
              )}
            </strong>

          </div>

          <div>

            <span>
              Total Balance
            </span>

            <strong>
              {money(
                grandRemaining
              )}
            </strong>

          </div>

        </div>

        {/* NOTE */}

        <div className="print-note">

          <strong>
            Statement Summary:
          </strong>{" "}

          Employee daily wages statement
          for{" "}

          <strong>
            {selectedEmployeeLabel}
          </strong>{" "}

          for the period{" "}

          <strong>
            {periodText}
          </strong>
          . Total wages are{" "}

          <strong>
            {money(
              grandDailyWage
            )}
          </strong>{" "}

          out of which advance paid is{" "}

          <strong>
            {money(
              grandAdvance
            )}
          </strong>{" "}

          and balance payable is{" "}

          <strong>
            {money(
              grandRemaining
            )}
          </strong>
          .

        </div>

        {/* GENERATED */}

        <div className="print-generated">

          Generated On:{" "}
          {generatedOn}

        </div>

        {/* SIGNATURE */}

        <div className="print-signature-area">

          <div className="authorized-signature">

            <div className="signature-line">
            </div>

            <strong>
              Authorized Signature
            </strong>

          </div>

        </div>

      </div>

      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        /* =================================================
           SCREEN
        ================================================= */

        .daily-wages-list {
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
          border-radius: 14px;
          padding: 24px;
          box-shadow:
            0 4px 18px
            rgba(0, 0, 0, 0.08);
          color: #1e293b;
        }

        .dw-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom:
            2px solid #8f3424;
          padding-bottom: 18px;
          margin-bottom: 20px;
        }

        .dw-brand h1 {
          margin: 0;
          color: #8f3424;
          font-size: 24px;
          font-weight: 800;
        }

        .dw-brand p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .dw-statement {
          text-align: right;
        }

        .dw-statement h2 {
          margin: 0;
          color: #8f3424;
          font-size: 17px;
        }

        .dw-statement p {
          margin: 4px 0 0;
          color: #334155;
          font-size: 15px;
          font-weight: 700;
        }

        /* =================================================
           META
        ================================================= */

        .dw-meta {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .dw-meta-box label {
          display: block;
          margin-bottom: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .dw-meta-value {
          width: 100%;
          min-height: 42px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border:
            1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
        }

        /* =================================================
           FILTER
        ================================================= */

        .dw-period-filter {
          display: grid;
          grid-template-columns:
            170px 180px 220px 1fr;
          gap: 12px;
          padding: 15px;
          margin-bottom: 22px;
          border:
            1px solid #e2e8f0;
          border-radius: 10px;
          background: #faf7f3;
        }

        .period-field label {
          display: block;
          margin-bottom: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .period-field select,
        .period-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border:
            1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #1e293b;
          outline: none;
        }

        .period-field select:focus,
        .period-field input:focus {
          border-color: #8f3424;
        }

        .period-result {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-left: 12px;
          border-left:
            1px solid #e2e8f0;
        }

        .period-result span {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .period-result strong {
          margin-top: 4px;
          color: #8f3424;
          font-size: 16px;
        }

        .period-result small {
          margin-top: 3px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        /* =================================================
           LIST HEADER
        ================================================= */

        .dw-list-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 16px;
        }

        .dw-list-head h2 {
          margin: 0;
          color: #8f3424;
          font-size: 20px;
          font-weight: 800;
        }

        .dw-list-head p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .dw-list-tools {
          display: flex;
          gap: 8px;
        }

        .dw-list-tools input {
          min-width: 240px;
          padding: 10px 12px;
          border:
            1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #1e293b;
        }

        .dw-list-tools button {
          border: 0;
          border-radius: 8px;
          padding: 10px 16px;
          cursor: pointer;
          color: #ffffff;
          background: #8f3424;
          font-weight: 700;
        }

        .dw-list-tools button:hover {
          background: #742a1d;
        }

        /* =================================================
           SUMMARY
        ================================================= */

        .dw-summary {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .summary-card {
          border:
            1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          background: #f8fafc;
        }

        .summary-card span {
          display: block;
          color: #64748b;
          font-size: 12px;
        }

        .summary-card strong {
          display: block;
          margin-top: 5px;
          color: #8f3424;
          font-size: 20px;
        }

        /* =================================================
           TABLE
        ================================================= */

        .dw-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .dw-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .dw-table-wrap th,
        .dw-table-wrap td {
          border:
            1px solid #cbd5e1;
          padding: 10px 8px;
          text-align: center;
          white-space: nowrap;
        }

        .dw-table-wrap th {
          background: #8f3424;
          color: #ffffff;
          font-size: 13px;
        }

        .dw-table-wrap td {
          background: #ffffff;
          color: #334155;
          font-size: 13px;
        }

        .employee-name {
          font-weight: 700;
          text-align: left !important;
        }

        .balance-cell {
          color: #15803d !important;
          font-weight: 800;
        }

        .dw-table-wrap tfoot td {
          background: #faf7f3;
          font-weight: 800;
        }

        .grand-label {
          text-align: right !important;
          color: #8f3424;
        }

        .empty {
          padding: 40px 20px;
          color: #64748b;
        }

        /* =================================================
           ACTION
        ================================================= */

        .dw-table-wrap button {
          border: 0;
          border-radius: 6px;
          padding: 7px 10px;
          cursor: pointer;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        }

        .edit {
          margin-right: 5px;
          background: #555555 !important;
        }

        .edit:hover {
          background: #333333 !important;
        }

        .delete {
          background: #b3261e !important;
        }

        .delete:hover {
          background: #8f1d18 !important;
        }

        /* =================================================
           FOOTER
        ================================================= */

        .dw-footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 18px;
          padding-top: 15px;
          border-top:
            1px solid #e2e8f0;
          color: #64748b;
          font-size: 13px;
          flex-wrap: wrap;
        }

        /* =================================================
           EDIT MODAL
        ================================================= */

        .dw-edit-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            rgba(15, 23, 42, 0.65);
          backdrop-filter:
            blur(4px);
        }

        .dw-edit-modal {
          width: min(
            680px,
            100%
          );
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow:
            0 25px 70px
            rgba(0, 0, 0, 0.3);
        }

        .dw-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding-bottom: 16px;
          border-bottom:
            1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .dw-edit-header h2 {
          margin: 0;
          color: #8f3424;
          font-size: 22px;
        }

        .dw-edit-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .dw-edit-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          cursor: pointer;
          background: #f1f5f9;
          color: #334155;
          font-size: 24px;
          line-height: 1;
        }

        .dw-edit-close:hover {
          background: #e2e8f0;
        }

        .dw-edit-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 16px;
        }

        .dw-edit-field label {
          display: block;
          margin-bottom: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .dw-edit-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border:
            1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #1e293b;
        }

        .dw-edit-field input:focus {
          border-color: #8f3424;
          box-shadow:
            0 0 0 3px
            rgba(143, 52, 36, 0.1);
        }

        .dw-edit-preview {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
          margin-top: 20px;
          padding: 14px;
          border-radius: 10px;
          background: #faf7f3;
          border:
            1px solid #eaded4;
        }

        .dw-edit-preview div {
          text-align: center;
        }

        .dw-edit-preview span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .dw-edit-preview strong {
          display: block;
          margin-top: 5px;
          color: #8f3424;
          font-size: 17px;
        }

        .dw-edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 16px;
          border-top:
            1px solid #e2e8f0;
        }

        .dw-edit-actions button {
          border: 0;
          border-radius: 8px;
          padding: 11px 18px;
          cursor: pointer;
          font-weight: 700;
        }

        .cancel-edit {
          background: #e2e8f0;
          color: #334155;
        }

        .save-edit {
          background: #8f3424;
          color: #ffffff;
        }

        .save-edit:hover {
          background: #742a1d;
        }

        /* =================================================
           DARK MODE
        ================================================= */

        .dark .daily-wages-list {
          background: #0f172a;
          color: #f8fafc;
        }

        .dark .dw-brand p,
        .dark .dw-list-head p,
        .dark .dw-footer {
          color: #94a3b8;
        }

        .dark .dw-statement p {
          color: #e2e8f0;
        }

        .dark .dw-meta-box label,
        .dark .period-field label {
          color: #94a3b8;
        }

        .dark .dw-meta-value,
        .dark .period-field select,
        .dark .period-field input {
          background: #1e293b;
          border-color: #475569;
          color: #f8fafc;
        }

        .dark .dw-period-filter {
          background: #111827;
          border-color: #334155;
        }

        .dark .period-result {
          border-color: #334155;
        }

        .dark .summary-card {
          background: #111827;
          border-color: #334155;
        }

        .dark .summary-card span {
          color: #94a3b8;
        }

        .dark .dw-table-wrap td {
          background: #0f172a;
          color: #e2e8f0;
          border-color: #475569;
        }

        .dark .dw-table-wrap tfoot td {
          background: #1e293b;
        }

        .dark .dw-edit-modal {
          background: #0f172a;
          color: #f8fafc;
        }

        .dark .dw-edit-header {
          border-color: #334155;
        }

        .dark .dw-edit-header p,
        .dark .dw-edit-field label {
          color: #94a3b8;
        }

        .dark .dw-edit-field input {
          background: #1e293b;
          border-color: #475569;
          color: #f8fafc;
        }

        .dark .dw-edit-preview {
          background: #111827;
          border-color: #334155;
        }

        .dark .dw-edit-actions {
          border-color: #334155;
        }

        .dark .cancel-edit {
          background: #334155;
          color: #f8fafc;
        }

        /* =================================================
           PRINT HIDDEN
        ================================================= */

        .print-only-bill {
          display: none;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1100px) {

          .dw-period-filter {
            grid-template-columns:
              1fr 1fr;
          }

          .period-result {
            grid-column: 1 / -1;
            border-left: 0;
            border-top:
              1px solid #e2e8f0;
            padding:
              12px 0 0;
          }

        }

        @media (max-width: 1000px) {

          .dw-meta {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .dw-summary {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

        @media (max-width: 700px) {

          .daily-wages-list {
            padding: 16px;
          }

          .dw-list-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .dw-statement {
            text-align: left;
          }

          .dw-meta {
            grid-template-columns: 1fr;
          }

          .dw-period-filter {
            grid-template-columns: 1fr;
          }

          .period-result {
            grid-column: auto;
          }

          .dw-list-head {
            flex-direction: column;
            align-items: stretch;
          }

          .dw-list-tools {
            width: 100%;
          }

          .dw-list-tools input {
            min-width: 0;
            flex: 1;
          }

          .dw-summary {
            grid-template-columns: 1fr;
          }

          .dw-footer {
            flex-direction: column;
          }

          .dw-edit-grid {
            grid-template-columns: 1fr;
          }

          .dw-edit-preview {
            grid-template-columns: 1fr;
          }

          .dw-edit-actions {
            flex-direction: column-reverse;
          }

          .dw-edit-actions button {
            width: 100%;
          }

        }

        /* =================================================
           PRINT
        ================================================= */

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

          .print-only-bill,
          .print-only-bill * {
            visibility: visible !important;
          }

          .print-only-bill {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 190mm;
            min-height: 277mm;
            box-sizing: border-box;
            padding: 7mm;
            background: #ffffff !important;
            color: #000000 !important;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          /* =================================================
             WATERMARK
          ================================================= */

          .print-bill-watermark {
            position: fixed;
            left: 50%;
            top: 50%;
            width: 105mm;
            height: 105mm;
            transform:
              translate(
                -50%,
                -50%
              );
            z-index: 0;
            pointer-events: none;
          }

          .print-bill-watermark img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 0.055;
            filter:
              grayscale(100%);
          }

          /* =================================================
             CONTENT
          ================================================= */

          .print-bill-header,
          .print-bill-meta,
          .print-bill-table,
          .print-total-summary,
          .print-note,
          .print-generated,
          .print-signature-area {
            position: relative;
            z-index: 2;
          }

          /* =================================================
             HEADER
          ================================================= */

          .print-bill-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 5mm;
            border-bottom:
              2px solid #000000;
            margin-bottom: 5mm;
          }

          .print-company h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #000000 !important;
          }

          .print-company p {
            margin:
              1.5mm 0 0;
            font-size: 9px;
            color: #000000 !important;
          }

          .print-bill-title {
            text-align: right;
          }

          .print-bill-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #000000 !important;
          }

          .print-bill-title h3 {
            margin:
              1mm 0 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #000000 !important;
          }

          /* =================================================
             META
          ================================================= */

          .print-bill-meta {
            display: grid;
            grid-template-columns:
              repeat(4, 1fr);
            border:
              1px solid #000000;
            margin-bottom: 5mm;
          }

          .print-bill-meta > div {
            padding: 3mm;
            border-right:
              1px solid #000000;
          }

          .print-bill-meta > div:last-child {
            border-right: 0;
          }

          .print-bill-meta span {
            display: block;
            margin-bottom: 1mm;
            font-size: 7.5px;
            font-weight: 700;
            color: #000000 !important;
          }

          .print-bill-meta strong {
            display: block;
            font-size: 9px;
            color: #000000 !important;
          }

          /* =================================================
             PRINT TABLE
          ================================================= */

          .print-bill-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 4mm;
          }

          .print-bill-table th,
          .print-bill-table td {
            border:
              1px solid #000000;
            padding:
              2.2mm 1mm;
            text-align: center;
            font-size: 7.5px;
            color: #000000 !important;
            background:
              #ffffff !important;
          }

          .print-bill-table th {
            background:
              #000000 !important;
            color:
              #ffffff !important;
            font-weight: 800;
          }

          .print-bill-table td {
            height: 6mm;
          }

          .print-employee {
            text-align: left !important;
            font-weight: 700;
          }

          .print-bill-table tfoot td {
            font-weight: 800;
            border-top:
              2px solid #000000;
          }

          .print-grand-label {
            text-align: right !important;
          }

          .print-empty {
            height:
              20mm !important;
          }

          /* =================================================
             TOTAL SUMMARY
          ================================================= */

          .print-total-summary {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            border:
              1px solid #000000;
            margin-top: 4mm;
          }

          .print-total-summary > div {
            padding: 3.5mm;
            border-right:
              1px solid #000000;
          }

          .print-total-summary > div:last-child {
            border-right: 0;
          }

          .print-total-summary span {
            display: block;
            font-size: 7.5px;
            font-weight: 700;
            color: #000000 !important;
          }

          .print-total-summary strong {
            display: block;
            margin-top: 1mm;
            font-size: 13px;
            font-weight: 800;
            color: #000000 !important;
          }

          /* =================================================
             NOTE
          ================================================= */

          .print-note {
            margin-top: 4mm;
            padding: 3mm;
            border:
              1px solid #000000;
            font-size: 8px;
            line-height: 1.6;
            color: #000000 !important;
          }

          /* =================================================
             GENERATED
          ================================================= */

          .print-generated {
            margin-top: 3mm;
            text-align: right;
            font-size: 7px;
            color: #000000 !important;
          }

          /* =================================================
             SIGNATURE
          ================================================= */

          .print-signature-area {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            margin-top: 25mm;
          }

          .authorized-signature {
            width: 45mm;
            text-align: center;
            color: #000000 !important;
          }

          .signature-line {
            width: 100%;
            border-top:
              1px solid #000000;
            margin-bottom: 2mm;
          }

          .authorized-signature strong {
            font-size: 8px;
            font-weight: 700;
            color: #000000 !important;
          }

          /* =================================================
             HIDE MODAL / SCREEN
          ================================================= */

          .dw-edit-overlay {
            display: none !important;
          }

          .no-print {
            display: none !important;
          }

        }

      `}</style>
    </>
  );
}
