import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";

import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiSave,
  FiImage,
  FiCalendar,
  FiFileText,
  FiEdit,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";

import { FaIndianRupeeSign } from "react-icons/fa6";

// =====================================================
// API
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// =====================================================
// INITIAL PAGE LOADER
// =====================================================

const PAGE_LOADING_TIME = 300;

// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
  productId: "",
  productName: "",
  supplierName: "",
  purchaseDate: "",
  purchaseCost: "",
  quantity: "1",
  purchaseImage: "",
};

// =====================================================
// HELPERS
// =====================================================

const getToday = () => {
  return new Date()
    .toISOString()
    .split("T")[0];
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-IN");
};

const getRowTotal = (item) => {
  return (
    Number(item?.purchaseCost || 0) *
    Number(item?.quantity || 0)
  );
};

// =====================================================
// COMPONENT
// =====================================================

const OtherExpenses = () => {
  // ---------------------------------------------------
  // DATA
  // ---------------------------------------------------

  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  // ---------------------------------------------------
  // SEARCH
  // ---------------------------------------------------

  const [search, setSearch] = useState("");

  // ---------------------------------------------------
  // MODAL
  // ---------------------------------------------------

  const [showModal, setShowModal] =
    useState(false);

  const [modalClosing, setModalClosing] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  // ---------------------------------------------------
  // FORM
  // ---------------------------------------------------

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  // ---------------------------------------------------
  // IMAGE
  // ---------------------------------------------------

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const fileInputRef = useRef(null);

  // ---------------------------------------------------
  // SELECTED RECORDS
  // ---------------------------------------------------

  const [selectedExpenses, setSelectedExpenses] =
    useState([]);

  // ---------------------------------------------------
  // ERROR
  // ---------------------------------------------------

  const [errorMessage, setErrorMessage] =
    useState("");

  // ===================================================
  // FETCH EXPENSES
  // ===================================================

  const fetchExpenses = async () => {
    try {
      setErrorMessage("");
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/other-expenses`
      );

      if (response.data?.success) {
        const newExpenses =
          response.data.data || [];

        setExpenses(newExpenses);

        setSelectedExpenses((previous) =>
          previous.filter((id) =>
            newExpenses.some(
              (item) => item._id === id
            )
          )
        );
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error(
        "Fetch Other Expenses Error:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to fetch other expenses."
      );

      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD - 0.3 SECOND
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      const startTime = Date.now();

      await fetchExpenses();

      const elapsed =
        Date.now() - startTime;

      const remaining =
        PAGE_LOADING_TIME - elapsed;

      if (remaining > 0) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            remaining
          )
        );
      }

      if (mounted) {
        setPageLoading(false);
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // IMAGE PREVIEW
  // ===================================================

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(imageFile);

    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  // ===================================================
  // SEARCH FILTER
  // ===================================================

  const filteredExpenses = useMemo(() => {
    const value = String(search || "")
      .trim()
      .toLowerCase();

    if (!value) {
      return expenses;
    }

    return expenses.filter((item) => {
      const productId = String(
        item?.productId || ""
      ).toLowerCase();

      const productName = String(
        item?.productName || ""
      ).toLowerCase();

      const supplierName = String(
        item?.supplierName || ""
      ).toLowerCase();

      return (
        productId.includes(value) ||
        productName.includes(value) ||
        supplierName.includes(value)
      );
    });
  }, [expenses, search]);

  // ===================================================
  // TOTAL AMOUNT
  // ===================================================

  const totalAmount = useMemo(() => {
    return expenses.reduce(
      (total, item) => {
        return total + getRowTotal(item);
      },
      0
    );
  }, [expenses]);

  // ===================================================
  // SELECTED TOTAL
  // ===================================================

  const selectedTotal = useMemo(() => {
    return selectedExpenses.reduce(
      (total, id) => {
        const item = expenses.find(
          (expense) =>
            expense._id === id
        );

        if (!item) {
          return total;
        }

        return total + getRowTotal(item);
      },
      0
    );
  }, [selectedExpenses, expenses]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      ...EMPTY_FORM,
      purchaseDate: getToday(),
    });

    setImageFile(null);
    setImagePreview("");

    setErrorMessage("");

    setModalClosing(false);
    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (expense) => {
    if (!expense) {
      return;
    }

    setEditingId(expense._id);

    setFormData({
      productId:
        expense.productId !== undefined &&
        expense.productId !== null
          ? String(expense.productId)
          : "",

      productName:
        expense.productName || "",

      supplierName:
        expense.supplierName || "",

      purchaseDate:
        expense.purchaseDate
          ? new Date(
              expense.purchaseDate
            )
              .toISOString()
              .split("T")[0]
          : "",

      purchaseCost:
        expense.purchaseCost !==
          undefined &&
        expense.purchaseCost !== null
          ? String(expense.purchaseCost)
          : "",

      quantity:
        expense.quantity !==
          undefined &&
        expense.quantity !== null
          ? String(expense.quantity)
          : "1",

      purchaseImage:
        expense.purchaseImage || "",
    });

    setImageFile(null);
    setImagePreview("");

    setErrorMessage("");

    setModalClosing(false);
    setShowModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (
      uploadingImage ||
      actionLoading
    ) {
      return;
    }

    setModalClosing(true);

    setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);

      setEditingId(null);

      setFormData({
        ...EMPTY_FORM,
      });

      setImageFile(null);
      setImagePreview("");
      setErrorMessage("");
    }, 180);
  };

  // ===================================================
  // IMAGE SELECT
  // ===================================================

  const handleImageSelect = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      e.target.value = "";
      setImageFile(null);
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setErrorMessage("");
  };

  // ===================================================
  // REMOVE SELECTED IMAGE
  // ===================================================

  const removeSelectedImage = () => {
    if (
      uploadingImage ||
      actionLoading
    ) {
      return;
    }

    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ===================================================
  // UPLOAD IMAGE
  // ===================================================

  const uploadImage = async () => {
    if (!imageFile) {
      return formData.purchaseImage;
    }

    try {
      setUploadingImage(true);

      const data = new FormData();

      data.append(
        "image",
        imageFile
      );

      const response =
        await axios.post(
          `${API_BASE_URL}/other-expenses/upload-image`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Image upload failed."
        );
      }

      return (
        response.data.data
          ?.imageUrl || ""
      );
    } catch (error) {
      console.error(
        "Image Upload Error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          error.message ||
          "Failed to upload image."
      );

      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      actionLoading ||
      uploadingImage
    ) {
      return;
    }

    if (
      !formData.supplierName.trim()
    ) {
      alert(
        "Supplier Name is required."
      );
      return;
    }

    if (!formData.purchaseDate) {
      alert(
        "Purchase Date is required."
      );
      return;
    }

    if (
      formData.purchaseCost === "" ||
      Number(
        formData.purchaseCost
      ) < 0
    ) {
      alert(
        "Enter a valid Purchase Cost."
      );
      return;
    }

    if (
      formData.quantity === "" ||
      Number(
        formData.quantity
      ) <= 0
    ) {
      alert(
        "Enter a valid Quantity."
      );
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");

      let imageUrl =
        formData.purchaseImage;

      if (imageFile) {
        imageUrl =
          await uploadImage();
      }

      const payload = {
        productId:
          String(
            formData.productId || ""
          ).trim(),

        productName:
          String(
            formData.productName || ""
          ).trim(),

        supplierName:
          formData.supplierName.trim(),

        purchaseDate:
          formData.purchaseDate,

        purchaseCost:
          Number(
            formData.purchaseCost
          ),

        quantity:
          Number(
            formData.quantity
          ),

        purchaseImage:
          imageUrl || "",
      };

      if (editingId) {
        const response =
          await axios.put(
            `${API_BASE_URL}/other-expenses/${editingId}`,
            payload
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Failed to update record."
          );
        }

        alert(
          "Other Expense updated successfully."
        );
      } else {
        const response =
          await axios.post(
            `${API_BASE_URL}/other-expenses`,
            payload
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Failed to save record."
          );
        }

        alert(
          "Other Expense saved successfully."
        );
      }

      setShowModal(false);
      setEditingId(null);

      setFormData({
        ...EMPTY_FORM,
      });

      setImageFile(null);
      setImagePreview("");

      await fetchExpenses();
    } catch (error) {
      console.error(
        "Save Other Expense Error:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to save other expense.";

      setErrorMessage(message);

      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (id) => {
    if (!id || actionLoading) {
      return;
    }

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this Other Expense?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);
      setActionLoading(true);
      setErrorMessage("");

      const response =
        await axios.delete(
          `${API_BASE_URL}/other-expenses/${id}`
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to delete other expense."
        );
      }

      setSelectedExpenses(
        (previous) =>
          previous.filter(
            (item) => item !== id
          )
      );

      alert(
        "Other Expense deleted successfully."
      );

      await fetchExpenses();
    } catch (error) {
      console.error(
        "Delete Other Expense Error:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete other expense.";

      setErrorMessage(message);

      alert(message);
    } finally {
      setDeletingId(null);
      setActionLoading(false);
    }
  };

  // ===================================================
  // CHECKBOX
  // ===================================================

  const toggleSelection = (id) => {
    setSelectedExpenses(
      (previous) => {
        if (
          previous.includes(id)
        ) {
          return previous.filter(
            (item) => item !== id
          );
        }

        return [
          ...previous,
          id,
        ];
      }
    );
  };

  // ===================================================
  // SELECT ALL
  // ===================================================

  const allFilteredSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every(
      (item) =>
        selectedExpenses.includes(
          item._id
        )
    );

  const toggleSelectAll = () => {
    if (
      filteredExpenses.length === 0
    ) {
      return;
    }

    if (allFilteredSelected) {
      setSelectedExpenses(
        (previous) =>
          previous.filter(
            (id) =>
              !filteredExpenses.some(
                (item) =>
                  item._id === id
              )
          )
      );
    } else {
      setSelectedExpenses(
        (previous) => {
          const ids =
            filteredExpenses.map(
              (item) =>
                item._id
            );

          return Array.from(
            new Set([
              ...previous,
              ...ids,
            ])
          );
        }
      );
    }
  };

  // ===================================================
  // EXPORT SELECTED PDF
  // ===================================================

  const exportSelectedPDF = () => {
    if (
      selectedExpenses.length === 0
    ) {
      alert(
        "Please select at least one record."
      );
      return;
    }

    const selectedData =
      expenses.filter((item) =>
        selectedExpenses.includes(
          item._id
        )
      );

    const rows =
      selectedData
        .map((item, index) => {
          const total =
            getRowTotal(item);

          const date =
            item.purchaseDate
              ? formatDate(
                  item.purchaseDate
                )
              : "-";

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${date}</td>
              <td>${item.productId || "-"}</td>
              <td>${item.productName || "-"}</td>
              <td>${item.supplierName || "-"}</td>
              <td>₹${Number(
                item.purchaseCost || 0
              ).toFixed(2)}</td>
              <td>${item.quantity || 0}</td>
              <td>₹${total.toFixed(2)}</td>
            </tr>
          `;
        })
        .join("");

    const total =
      selectedData.reduce(
        (sum, item) =>
          sum + getRowTotal(item),
        0
      );

    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      alert(
        "Please allow popups to export PDF."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            Vraj Creation - Other Expenses
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #222;
            }

            h1 {
              margin: 0;
              font-size: 24px;
            }

            .subtitle {
              margin-top: 6px;
              color: #666;
              font-size: 13px;
            }

            .summary {
              margin-top: 20px;
              margin-bottom: 20px;
              display: flex;
              gap: 30px;
            }

            .summary-box {
              border: 1px solid #ddd;
              padding: 12px 18px;
              border-radius: 8px;
            }

            .summary-label {
              font-size: 12px;
              color: #666;
            }

            .summary-value {
              margin-top: 5px;
              font-size: 18px;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 8px;
              font-size: 11px;
              text-align: left;
            }

            th {
              background: #f3f3f3;
              font-weight: bold;
            }

            .total {
              margin-top: 20px;
              text-align: right;
              font-size: 18px;
              font-weight: bold;
            }

            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>

        <body>

          <h1>
            Vraj Creation
          </h1>

          <div class="subtitle">
            Other Expenses Report
          </div>

          <div class="summary">

            <div class="summary-box">
              <div class="summary-label">
                Selected Records
              </div>

              <div class="summary-value">
                ${selectedData.length}
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-label">
                Selected Total
              </div>

              <div class="summary-value">
                ₹${total.toFixed(2)}
              </div>
            </div>

          </div>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Supplier</th>
                <th>Cost / Unit</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <div class="total">
            Grand Total: ₹${total.toFixed(2)}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>

        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // ===================================================
  // PAGE LOADING UI
  // PRODUCTS STYLE SKELETON
  // ===================================================

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-6">

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

          {/* HEADER SKELETON */}

          <div className="p-5 border-b border-gray-200 dark:border-gray-800">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />

              <div className="flex-1">

                <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />

                <div className="h-4 w-72 max-w-full rounded-md bg-gray-100 dark:bg-gray-800 mt-3 animate-pulse" />

              </div>

            </div>

          </div>

          {/* SUMMARY SKELETON */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}

          </div>

          {/* SEARCH SKELETON */}

          <div className="px-5 pb-5">

            <div className="h-11 w-full max-w-md rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />

          </div>

          {/* TABLE SKELETON */}

          <div className="border-t border-gray-200 dark:border-gray-800">

            {/* TABLE HEADER */}

            <div className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse" />

            {/* TABLE ROWS */}

            <div className="p-4 space-y-4">

              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                )
              )}

            </div>

          </div>

        </div>

      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-6 transition-colors duration-300">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">

        <div className="group">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">

              <FiFileText size={22} />

            </div>

            <div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Other Expenses
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your independent other expenses
              </p>

            </div>

          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          {/* EXPORT */}

          {selectedExpenses.length > 0 && (
            <button
              type="button"
              onClick={
                exportSelectedPDF
              }
              disabled={
                actionLoading
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-500/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <FiFileText />

              Export Selected PDF (
              {selectedExpenses.length}
              )
            </button>
          )}

          {/* ADD */}

          <button
            type="button"
            onClick={
              openAddModal
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 hover:shadow-blue-500/40 active:scale-95 transition-all duration-200"
          >
            <FiPlus />

            Add Other Expense
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">

          <FiAlertCircle
            className="text-red-600 shrink-0 mt-0.5"
            size={20}
          />

          <div className="flex-1">

            <p className="font-semibold text-red-700 dark:text-red-400">
              Something went wrong
            </p>

            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
              {errorMessage}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setErrorMessage("")
            }
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          >
            <FiX />
          </button>

        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* TOTAL RECORDS */}

        <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Records
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {expenses.length}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">

              <FiPackage size={22} />

            </div>

          </div>

        </div>

        {/* TOTAL EXPENSE */}

        <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Expense
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹
                {totalAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">

              <FaIndianRupeeSign
                size={22}
              />

            </div>

          </div>

        </div>

        {/* SELECTED */}

        <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected Total
              </p>

              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹
                {selectedTotal.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110">

              <FiCheckCircle
                size={22}
              />

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300">

        <div className="relative max-w-md">

          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search product, supplier..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <FiX />
            </button>
          )}

        </div>

        {search && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">

            Showing{" "}

            <span className="font-semibold text-blue-600">
              {filteredExpenses.length}
            </span>{" "}

            matching record
            {filteredExpenses.length !==
            1
              ? "s"
              : ""}

          </p>
        )}

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-gray-50 dark:bg-gray-800">

              <tr>

                <th className="px-4 py-3 text-center">

                  <input
                    type="checkbox"
                    checked={
                      allFilteredSelected
                    }
                    onChange={
                      toggleSelectAll
                    }
                    disabled={
                      filteredExpenses.length ===
                      0
                    }
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />

                </th>

                {[
                  "Image",
                  "Date",
                  "Product ID",
                  "Product Name",
                  "Supplier",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide"
                  >
                    {heading}
                  </th>
                ))}

                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  Cost / Unit
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  Qty
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  Total
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

              {filteredExpenses.length ===
              0 ? (
                <tr>

                  <td
                    colSpan="10"
                    className="px-4 py-16 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">

                        <FiPackage
                          size={28}
                          className="text-gray-400"
                        />

                      </div>

                      <p className="text-gray-700 dark:text-gray-300 font-semibold">
                        No Other Expenses found
                      </p>

                      <p className="text-sm text-gray-400 mt-1">
                        Try another search or add a new expense.
                      </p>

                    </div>

                  </td>

                </tr>
              ) : (
                filteredExpenses.map(
                  (item, index) => {
                    const rowTotal =
                      getRowTotal(item);

                    return (
                      <tr
                        key={
                          item._id
                        }
                        className="group hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all duration-300"
                        style={{
                          animationDelay: `${Math.min(
                            index * 35,
                            400
                          )}ms`,
                        }}
                      >

                        <td className="px-4 py-3 text-center">

                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(
                              item._id
                            )}
                            onChange={() =>
                              toggleSelection(
                                item._id
                              )
                            }
                            className="w-4 h-4 accent-blue-600 cursor-pointer transition-transform duration-200 hover:scale-125"
                          />

                        </td>

                        <td className="px-4 py-3">

                          {item.purchaseImage ? (
                            <div className="relative w-12 h-12">

                              <img
                                src={
                                  item.purchaseImage
                                }
                                alt={
                                  item.productName ||
                                  "Expense"
                                }
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.style.display =
                                    "none";

                                  if (
                                    e.currentTarget
                                      .nextSibling
                                  ) {
                                    e.currentTarget.nextSibling.style.display =
                                      "flex";
                                  }
                                }}
                              />

                              <div
                                style={{
                                  display:
                                    "none",
                                }}
                                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center text-gray-400"
                              >
                                <FiImage />
                              </div>

                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 transition-all duration-300 group-hover:scale-110">

                              <FiImage />

                            </div>
                          )}

                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(
                            item.purchaseDate
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">

                          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-xs">
                            {item.productId ||
                              "-"}
                          </span>

                        </td>

                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">

                          <div className="max-w-[220px] truncate">
                            {item.productName ||
                              "-"}
                          </div>

                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {
                            item.supplierName
                          }
                        </td>

                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          ₹
                          {Number(
                            item.purchaseCost ||
                              0
                          ).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">

                          <span className="inline-flex min-w-8 justify-center px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold">
                            {
                              item.quantity
                            }
                          </span>

                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900 dark:text-white">
                          ₹
                          {rowTotal.toFixed(
                            2
                          )}
                        </td>

                        <td className="px-4 py-3">

                          <div className="flex items-center justify-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-40"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item._id
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-40"
                              title="Delete"
                            >

                              {deletingId ===
                              item._id ? (
                                <span className="block w-4 h-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                              ) : (
                                <FiTrash2 />
                              )}

                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
              modalClosing
                ? "opacity-0"
                : "opacity-100"
            }`}
            onClick={
              closeModal
            }
          />

          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-200 ${
              modalClosing
                ? "opacity-0 scale-95 translate-y-3"
                : "opacity-100 scale-100 translate-y-0"
            }`}
          >

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">

              <div>

                <div className="flex items-center gap-2">

                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">

                    {editingId ? (
                      <FiEdit />
                    ) : (
                      <FiPlus />
                    )}

                  </div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">

                    {editingId
                      ? "Edit Other Expense"
                      : "Add Other Expense"}

                  </h2>

                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-11">
                  This module is completely independent.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  uploadingImage ||
                  actionLoading
                }
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:rotate-90 transition-all duration-300 disabled:opacity-40"
              >
                <FiX size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6 space-y-5"
            >

              {/* PRODUCT ID */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product ID

                  <span className="text-xs text-gray-400 ml-2">
                    Optional
                  </span>
                </label>

                <input
                  type="text"
                  name="productId"
                  value={
                    formData.productId
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Product ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />

              </div>

              {/* PRODUCT NAME */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name
                </label>

                <input
                  type="text"
                  name="productName"
                  value={
                    formData.productName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Product Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />

              </div>

              {/* SUPPLIER */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier Name *
                </label>

                <input
                  type="text"
                  name="supplierName"
                  value={
                    formData.supplierName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Supplier Name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />

              </div>

              {/* DATE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date *
                </label>

                <div className="relative">

                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="date"
                    name="purchaseDate"
                    value={
                      formData.purchaseDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />

                </div>

              </div>

              {/* COST + QUANTITY */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Cost / Unit (₹) *
                  </label>

                  <input
                    type="number"
                    name="purchaseCost"
                    value={
                      formData.purchaseCost
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleChange
                    }
                    min="1"
                    step="1"
                    required
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />

                </div>

              </div>

              {/* IMAGE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Image
                </label>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-5 bg-gray-50/70 dark:bg-gray-800/40 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20">

                  <div className="flex flex-col md:flex-row gap-5 items-center">

                    {/* PREVIEW */}

                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm group">

                      {imagePreview ? (
                        <img
                          src={
                            imagePreview
                          }
                          alt="New Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : formData.purchaseImage ? (
                        <img
                          src={
                            formData.purchaseImage
                          }
                          alt="Current"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(
                            e
                          ) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">

                          <FiImage
                            size={34}
                          />

                          <span className="text-xs">
                            No Image
                          </span>

                        </div>
                      )}

                    </div>

                    {/* UPLOAD */}

                    <div className="flex-1 text-center md:text-left">

                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200">

                        <FiUpload />

                        Choose Image

                        <input
                          ref={
                            fileInputRef
                          }
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={
                            handleImageSelect
                          }
                          className="hidden"
                        />

                      </label>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        JPG, JPEG, PNG or WEBP
                        • Maximum 5 MB
                      </p>

                      {imageFile && (
                        <div className="mt-3 flex items-center justify-center md:justify-start gap-2 text-xs text-green-600 dark:text-green-400">

                          <FiCheckCircle />

                          <span className="truncate max-w-[240px]">
                            {
                              imageFile.name
                            }
                          </span>

                          <button
                            type="button"
                            onClick={
                              removeSelectedImage
                            }
                            disabled={
                              uploadingImage ||
                              actionLoading
                            }
                            className="text-red-500 hover:text-red-700 hover:scale-110 transition disabled:opacity-40"
                            title="Remove selected image"
                          >
                            <FiX />
                          </button>

                        </div>
                      )}

                      {formData.purchaseImage &&
                        !imageFile && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                            Existing Cloudinary image will be kept.
                          </p>
                      )}

                    </div>

                  </div>

                </div>

              </div>

              {/* TOTAL PREVIEW */}

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 p-5">

                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-500/10 animate-pulse" />

                <div className="relative flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Expense
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Purchase Cost × Quantity
                    </p>

                  </div>

                  <span className="text-2xl font-bold text-gray-900 dark:text-white">

                    ₹
                    {(
                      Number(
                        formData.purchaseCost ||
                          0
                      ) *
                      Number(
                        formData.quantity ||
                          0
                      )
                    ).toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}

                  </span>

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    uploadingImage ||
                    actionLoading
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50"
                >

                  <FiX />

                  Cancel

                </button>

                <button
                  type="submit"
                  disabled={
                    actionLoading ||
                    uploadingImage
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {uploadingImage ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin" />

                      Uploading Image...
                    </>
                  ) : actionLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin" />

                      {editingId
                        ? "Updating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      <FiSave />

                      {editingId
                        ? "Update Record"
                        : "Save Record"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          ACTION LOADING OVERLAY
      ================================================= */}

      {actionLoading &&
        !showModal && (
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-4 border border-gray-200 dark:border-gray-800">

              <div className="w-10 h-10 rounded-full border-4 border-blue-100 dark:border-blue-900 border-t-blue-600 animate-spin" />

              <div>

                <p className="font-semibold text-gray-900 dark:text-white">
                  Please wait...
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Processing your request
                </p>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

export default OtherExpenses;