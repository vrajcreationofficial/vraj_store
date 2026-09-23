import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://vraj-store.onrender.com/api");
    
const SALES_API_URL = `${API_BASE_URL}/sales`;
const PRODUCTS_API_URL = `${API_BASE_URL}/products`;

const API_TIMEOUT = 10000;

// =========================================================
// FETCH WITH TIMEOUT + AUTH
// =========================================================

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, API_TIMEOUT);

  try {
    const token = localStorage.getItem("token");

    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Server response mein zyada time lag raha hai. Please try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// =========================================================
// INITIAL FORM
// =========================================================

const createInitialFormState = () => ({
  productId: "",
  productName: "",
  productImage: "",
  imageFile: null,

  platform: "meesho",

  date: new Date().toISOString().split("T")[0],

  quantity: 1,

  bankSettlementAmount: "",

  packagingCost: 0,

  colouringCost: 0,
});

// =========================================================
// HELPER - PRODUCT ID
// =========================================================

const getProductId = (product) => {
  return String(
    product?.productId ||
      product?.sku ||
      product?.product_id ||
      product?.code ||
      ""
  ).trim();
};

// =========================================================
// HELPER - PRODUCT NAME
// =========================================================

const getProductName = (product) => {
  return String(
    product?.name ||
      product?.productName ||
      product?.title ||
      ""
  ).trim();
};

// =========================================================
// HELPER - PRODUCT IMAGE
// =========================================================

const getProductImage = (product) => {
  return (
    product?.image ||
    product?.productImage ||
    product?.imageUrl ||
    product?.imageURL ||
    product?.images?.[0] ||
    ""
  );
};

// =========================================================
// SALES PAGE
// =========================================================

const SalesPage = () => {
  // =======================================================
  // PLATFORM
  // =======================================================

  const [selectedPlatform, setSelectedPlatform] =
    useState("meesho");

  // =======================================================
  // SEARCH
  // =======================================================

  const [searchTerm, setSearchTerm] = useState("");

  // =======================================================
  // DATA
  // =======================================================

  const [sales, setSales] = useState([]);

  const [products, setProducts] = useState([]);

  // =======================================================
  // LOADING
  // =======================================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [productsLoading, setProductsLoading] =
    useState(false);

  // =======================================================
  // MODALS
  // =======================================================

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [previewProduct, setPreviewProduct] =
    useState(null);

  // =======================================================
  // PRINT
  // =======================================================

  const [printMenuOpen, setPrintMenuOpen] =
    useState(false);

  const [printSaleId, setPrintSaleId] =
    useState(null);

  // =======================================================
  // ERROR
  // =======================================================

  const [errorMessage, setErrorMessage] =
    useState("");

  // =======================================================
  // REQUEST LOCK
  // =======================================================

  const requestInProgressRef = useRef(false);

  // =======================================================
  // IMAGE PREVIEW
  // =======================================================

  const previewUrlRef = useRef(null);

  // =======================================================
  // FORM
  // =======================================================

  const [formData, setFormData] = useState(
    createInitialFormState()
  );

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);

      const response = await fetchWithTimeout(
        PRODUCTS_API_URL
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Products HTTP ${response.status}`
        );
      }

      const productData = Array.isArray(result)
        ? result
        : Array.isArray(result?.products)
        ? result.products
        : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.data?.products)
        ? result.data.products
        : [];

      setProducts(productData);
    } catch (error) {
      console.error(
        "LOAD PRODUCTS ERROR:",
        error
      );

      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD SALES
  // =========================================================

  const loadSales = useCallback(
    async (showLoader = false) => {
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      try {
        if (showLoader) {
          setLoading(true);
        }

        setErrorMessage("");

        const response =
          await fetchWithTimeout(
            SALES_API_URL
          );

        const result =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              `HTTP ${response.status}`
          );
        }

        const salesData = Array.isArray(result)
          ? result
          : Array.isArray(result?.sales)
          ? result.sales
          : Array.isArray(result?.data)
          ? result.data
          : [];

        setSales(salesData);
      } catch (error) {
        console.error(
          "LOAD SALES ERROR:",
          error
        );

        if (showLoader) {
          setSales([]);

          setErrorMessage(
            error.message ||
              "Sales load nahi ho saki."
          );
        }
      } finally {
        requestInProgressRef.current = false;

        setLoading(false);
      }
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadSales(true);
    loadProducts();
  }, [loadSales, loadProducts]);

  // =========================================================
  // CLEAN IMAGE URL
  // =========================================================

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );
      }
    };
  }, []);

  // =========================================================
  // CLOSE PRINT MENU ON OUTSIDE CLICK
  // =========================================================

  useEffect(() => {
    const handleClick = () => {
      setPrintMenuOpen(false);
    };

    if (printMenuOpen) {
      document.addEventListener(
        "click",
        handleClick
      );
    }

    return () => {
      document.removeEventListener(
        "click",
        handleClick
      );
    };
  }, [printMenuOpen]);

  // =========================================================
  // FILTER SALES
  // =========================================================

  const filteredSales = sales.filter((item) => {
    const platformMatch =
      String(item.platform || "")
        .toLowerCase() ===
      selectedPlatform.toLowerCase();

    const search =
      searchTerm.toLowerCase().trim();

    const productName =
      String(
        item.productName || ""
      ).toLowerCase();

    const productId =
      String(
        item.productId || ""
      ).toLowerCase();

    return (
      platformMatch &&
      (productName.includes(search) ||
        productId.includes(search))
    );
  });

  // =========================================================
  // MARGIN
  // =========================================================

  const calculateMargin = (item) => {
    return (
      Number(
        item.bankSettlementAmount || 0
      ) -
      Number(item.packagingCost || 0) -
      Number(item.colouringCost || 0)
    );
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalSettlement =
    filteredSales.reduce(
      (acc, item) =>
        acc +
        Number(
          item.bankSettlementAmount || 0
        ),
      0
    );

  const totalPackaging =
    filteredSales.reduce(
      (acc, item) =>
        acc +
        Number(
          item.packagingCost || 0
        ),
      0
    );

  const totalColouring =
    filteredSales.reduce(
      (acc, item) =>
        acc +
        Number(
          item.colouringCost || 0
        ),
      0
    );

  const totalNetMargin =
    filteredSales.reduce(
      (acc, item) =>
        acc + calculateMargin(item),
      0
    );

  const totalQty =
    filteredSales.reduce(
      (acc, item) =>
        acc +
        Number(item.quantity || 0),
      0
    );

  // =========================================================
  // PRINT ALL
  // =========================================================

  const handlePrintAll = () => {
    setPrintSaleId(null);

    setPrintMenuOpen(false);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPrintSaleId(null);
      }, 500);
    }, 100);
  };

  // =========================================================
  // PRINT SINGLE SALE
  // =========================================================

  const handlePrintSingle = (id) => {
    setPrintSaleId(String(id));

    setPrintMenuOpen(false);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPrintSaleId(null);
      }, 500);
    }, 100);
  };

  // =========================================================
  // ADD MODAL
  // =========================================================

  const handleOpenAddModal = () => {
    setEditingId(null);

    setFormData({
      ...createInitialFormState(),
      platform: selectedPlatform,
    });

    setErrorMessage("");

    setIsModalOpen(true);

    loadProducts();
  };

  // =========================================================
  // EDIT MODAL
  // =========================================================

  const handleOpenEditModal = (item) => {
    setEditingId(item._id);

    setFormData({
      productId: item.productId || "",
      productName: item.productName || "",
      productImage: item.productImage || "",
      imageFile: null,

      platform:
        item.platform || "meesho",

      date:
        item.date ||
        item.saleDate ||
        new Date()
          .toISOString()
          .split("T")[0],

      quantity: item.quantity || 1,

      bankSettlementAmount:
        item.bankSettlementAmount ?? "",

      packagingCost:
        item.packagingCost ?? 0,

      colouringCost:
        item.colouringCost ?? 0,
    });

    setErrorMessage("");

    setIsModalOpen(true);

    loadProducts();
  };

  // =========================================================
  // PRODUCT SELECT
  // =========================================================

  const handleProductSelect = (e) => {
    const selectedId = e.target.value;

    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        productId: "",
        productName: "",
        productImage: "",
      }));

      return;
    }

    const selectedProduct =
      products.find(
        (product) =>
          getProductId(product) ===
          selectedId
      );

    if (!selectedProduct) {
      return;
    }

    const productId =
      getProductId(selectedProduct);

    const productName =
      getProductName(selectedProduct);

    const productImage =
      getProductImage(selectedProduct);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }

    setFormData((prev) => ({
      ...prev,

      productId,

      productName,

      productImage,

      imageFile: null,
    }));
  };

  // =========================================================
  // IMAGE CHANGE
  // =========================================================

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image 5MB se chhoti honi chahiye."
      );

      e.target.value = "";

      return;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Sirf image file select karo."
      );

      e.target.value = "";

      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    previewUrlRef.current = previewUrl;

    setFormData((prev) => ({
      ...prev,

      imageFile: file,

      productImage: previewUrl,
    }));
  };

  // =========================================================
  // REMOVE IMAGE
  // =========================================================

  const handleRemoveImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }

    setFormData((prev) => ({
      ...prev,

      imageFile: null,

      productImage: "",
    }));
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleCloseModal = () => {
    if (saving) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }

    setIsModalOpen(false);

    setEditingId(null);

    setErrorMessage("");

    setFormData(
      createInitialFormState()
    );
  };

  // =========================================================
  // SAVE / UPDATE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    const wasEditing =
      Boolean(editingId);

    try {
      setSaving(true);

      setErrorMessage("");

      const productId =
        String(
          formData.productId
        ).trim();

      const productName =
        String(
          formData.productName
        ).trim();

      const platform =
        String(formData.platform)
          .trim()
          .toLowerCase();

      const date = formData.date;

      const quantity =
        Number(formData.quantity);

      const settlement =
        Number(
          formData.bankSettlementAmount
        );

      const packaging =
        Number(
          formData.packagingCost || 0
        );

      const colouring =
        Number(
          formData.colouringCost || 0
        );

      // =====================================================
      // VALIDATION
      // =====================================================

      if (!productId) {
        alert(
          "Product select karo."
        );
        return;
      }

      if (!productName) {
        alert(
          "Product Name required hai."
        );
        return;
      }

      if (!platform) {
        alert(
          "Platform select karo."
        );
        return;
      }

      if (!date) {
        alert(
          "Date select karo."
        );
        return;
      }

      if (
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        alert(
          "Quantity kam se kam 1 honi chahiye."
        );
        return;
      }

      if (
        !Number.isFinite(settlement) ||
        settlement < 0
      ) {
        alert(
          "Settlement amount valid hona chahiye."
        );
        return;
      }

      if (
        !Number.isFinite(packaging) ||
        packaging < 0
      ) {
        alert(
          "Packaging cost valid hona chahiye."
        );
        return;
      }

      if (
        !Number.isFinite(colouring) ||
        colouring < 0
      ) {
        alert(
          "Colouring cost valid hona chahiye."
        );
        return;
      }

      // =====================================================
      // FORMDATA
      // =====================================================

      const data = new FormData();

      data.append(
        "productId",
        productId
      );

      data.append(
        "productName",
        productName
      );

      data.append(
        "platform",
        platform
      );

      data.append(
        "date",
        date
      );

      data.append(
        "quantity",
        String(quantity)
      );

      data.append(
        "bankSettlementAmount",
        String(settlement)
      );

      data.append(
        "packagingCost",
        String(packaging)
      );

      data.append(
        "colouringCost",
        String(colouring)
      );

      // =====================================================
      // IMAGE
      // =====================================================

      if (formData.imageFile) {
        data.append(
          "productImage",
          formData.imageFile
        );
      }

      // =====================================================
      // URL
      // =====================================================

      const url = editingId
        ? `${SALES_API_URL}/${editingId}`
        : SALES_API_URL;

      const method = editingId
        ? "PUT"
        : "POST";

      console.log(
        "SALE REQUEST:",
        method,
        url
      );

      // =====================================================
      // API
      // =====================================================

      const response =
        await fetchWithTimeout(
          url,
          {
            method,
            body: data,
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      console.log(
        "SALE RESPONSE:",
        result
      );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Request failed: ${response.status}`
        );
      }

      // =====================================================
      // RETURNED SALE
      // =====================================================

      const returnedSale =
        result?.sale;

      // =====================================================
      // LOCAL UPDATE
      // =====================================================

      if (returnedSale) {
        setSales((prevSales) => {
          if (wasEditing) {
            return prevSales.map(
              (item) =>
                String(item._id) ===
                String(editingId)
                  ? returnedSale
                  : item
            );
          }

          return [
            returnedSale,
            ...prevSales,
          ];
        });
      }

      // =====================================================
      // CLOSE
      // =====================================================

      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current = null;
      }

      setIsModalOpen(false);

      setEditingId(null);

      setFormData(
        createInitialFormState()
      );

      alert(
        wasEditing
          ? "Sale updated successfully."
          : "Sale added successfully."
      );
    } catch (error) {
      console.error(
        "SAVE SALE ERROR:",
        error
      );

      const message =
        error.message ||
        "Sale save nahi ho saki.";

      setErrorMessage(message);

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Kya aap sach me is sale entry ko delete karna chahte hain?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setErrorMessage("");

      const response =
        await fetchWithTimeout(
          `${SALES_API_URL}/${id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Delete failed: ${response.status}`
        );
      }

      setSales((prevSales) =>
        prevSales.filter(
          (item) =>
            String(item._id) !==
            String(id)
        )
      );

      alert(
        "Sale deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE SALE ERROR:",
        error
      );

      const message =
        error.message ||
        "Sale delete nahi ho saki.";

      setErrorMessage(message);

      alert(message);
    }
  };

  // =========================================================
  // PRINT ROW CHECK
  // =========================================================

  const shouldPrintRow = (item) => {
    if (!printSaleId) {
      return true;
    }

    return (
      String(item._id) ===
      String(printSaleId)
    );
  };

  // =========================================================
  // SKELETON LOADER
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-6">
        {/* HEADER SKELETON */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

            <div className="h-4 w-80 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

            <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

            <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* SEARCH SKELETON */}

        <div className="h-11 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />

        {/* TABLE SKELETON */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* TABLE HEADER */}

          <div className="h-12 animate-pulse border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />

          {/* TABLE ROWS */}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 px-4 py-4"
                >
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

                    <div className="h-2.5 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  </div>

                  <div className="hidden h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800 sm:block" />

                  <div className="hidden h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800 md:block" />

                  <div className="h-3 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

                  <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

                  <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              )
            )}
          </div>
        </div>

        {/* SUMMARY SKELETON */}

        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          PRINT CSS
      ===================================================== */}

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
          }

          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-table-wrapper {
            overflow: visible !important;
          }

          table {
            width: 100% !important;
            table-layout: fixed !important;
            word-wrap: break-word !important;
          }

          th,
          td {
            padding: 6px 4px !important;
            font-size: 10px !important;
          }

          .print-img {
            display: none !important;
          }

          .print-hidden-row {
            display: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Marketplace Sales
            </h1>

          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage orders, edits, settlements and profit margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* =================================================
              PLATFORM
          ================================================= */}

          <div className="flex rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800">

            {[
              {
                id: "meesho",
                name: "Meesho",
                icon: "🔴",
              },
              {
                id: "amazon",
                name: "Amazon",
                icon: "📦",
              },
              {
                id: "flipkart",
                name: "Flipkart",
                icon: "🟡",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setSelectedPlatform(
                    tab.id
                  )
                }
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  selectedPlatform ===
                  tab.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <span>
                  {tab.icon}
                </span>

                <span>
                  {tab.name}
                </span>
              </button>
            ))}

          </div>

          {/* =================================================
              PRINT MENU
          ================================================= */}

          <div
            className="relative"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() =>
                setPrintMenuOpen(
                  (prev) => !prev
                )
              }
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
            >
              <span>🖨️</span>

              <span>
                Print / Save PDF
              </span>

              <span className="text-[10px]">
                ▾
              </span>
            </button>

            {printMenuOpen && (
              <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                {/* PRINT ALL */}

                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >

                  <span className="text-lg">
                    📄
                  </span>

                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Print All Sales
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Print all visible{" "}
                      {selectedPlatform} sales
                    </p>
                  </div>

                </button>

                {/* INDIVIDUAL SALES */}

                <div className="max-h-80 overflow-y-auto">

                  <div className="px-4 pb-2 pt-3">

                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Print Individual Sale
                    </p>

                  </div>

                  {filteredSales.length === 0 ? (
                    <div className="px-4 pb-4 text-xs text-slate-400">
                      No sale available.
                    </div>
                  ) : (
                    filteredSales.map(
                      (item) => (
                        <button
                          key={
                            item._id
                          }
                          type="button"
                          onClick={() =>
                            handlePrintSingle(
                              item._id
                            )
                          }
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                        >

                          {item.productImage ? (
                            <img
                              src={
                                item.productImage
                              }
                              alt=""
                              className="h-9 w-9 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                              🖼️
                            </div>
                          )}

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                              {
                                item.productName
                              }
                            </p>

                            <p className="text-[10px] text-slate-400">
                              {
                                item.productId
                              }{" "}
                              • Qty{" "}
                              {
                                item.quantity
                              }
                            </p>

                          </div>

                          <span className="text-xs">
                            🖨️
                          </span>

                        </button>
                      )
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          {/* =================================================
              ADD SALE
          ================================================= */}

          <button
            type="button"
            onClick={
              handleOpenAddModal
            }
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <span>➕</span>

            <span>
              Add Sale Entry
            </span>
          </button>

        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="no-print flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">

          <span>
            {errorMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setErrorMessage("")
            }
            className="font-bold"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="no-print flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">

        <span className="text-slate-400">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search by Product Name or ID..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
        />

      </div>

      {/* =====================================================
          PRINT AREA
      ===================================================== */}

      <div className="print-area space-y-6">

        {/* PRINT HEADER */}

        <div className="hidden border-b border-slate-300 pb-2 print:block">

          <h2 className="text-lg font-black text-slate-900">
            Sales & Margin Report (
            {selectedPlatform.toUpperCase()}
            )
          </h2>

          <p className="text-[10px] text-slate-600">
            Date Generated:{" "}
            {new Date().toLocaleDateString(
              "en-IN"
            )}
          </p>

          {printSaleId && (
            <p className="mt-1 text-[10px] font-bold text-slate-700">
              Individual Sale Print
            </p>
          )}

        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="print-table-wrapper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300">

          <div className="overflow-x-auto print:overflow-visible">

            <table className="w-full text-left text-xs sm:text-sm">

              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-800">

                <tr>

                  <th className="w-[25%] px-3 py-3 print:w-[22%]">
                    Product
                  </th>

                  <th className="w-[12%] px-3 py-3">
                    Product ID
                  </th>

                  <th className="w-[11%] px-3 py-3">
                    Date
                  </th>

                  <th className="w-[6%] px-2 py-3 text-center">
                    Qty
                  </th>

                  <th className="w-[15%] px-3 py-3">
                    Bank Settlement
                  </th>

                  <th className="w-[10%] px-3 py-3">
                    Packaging
                  </th>

                  <th className="w-[11%] px-3 py-3">
                    Colouring
                  </th>

                  <th className="w-[10%] px-3 py-3">
                    Margin
                  </th>

                  <th className="no-print w-[10%] px-3 py-3 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">

                {filteredSales.length ===
                  0 ? (
                  <tr>

                    <td
                      colSpan="9"
                      className="py-12 text-center text-slate-400"
                    >
                      No sales entry found for{" "}
                      {selectedPlatform.toUpperCase()}.
                    </td>

                  </tr>
                ) : (
                  filteredSales.map(
                    (item) => {
                      const margin =
                        calculateMargin(
                          item
                        );

                      const hiddenForPrint =
                        !shouldPrintRow(
                          item
                        );

                      return (
                        <tr
                          key={
                            item._id
                          }
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                            hiddenForPrint
                              ? "print-hidden-row"
                              : ""
                          }`}
                        >

                          {/* PRODUCT */}

                          <td className="px-3 py-2.5">

                            <div
                              onClick={() =>
                                setPreviewProduct(
                                  item
                                )
                              }
                              className="group flex cursor-pointer items-center gap-2"
                              title="Click to Preview Product"
                            >

                              {item.productImage ? (
                                <img
                                  src={
                                    item.productImage
                                  }
                                  alt={
                                    item.productName
                                  }
                                  loading="lazy"
                                  className="print-img h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover transition group-hover:scale-105 dark:border-slate-700"
                                />
                              ) : (
                                <div className="print-img flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs dark:border-slate-700 dark:bg-slate-800">
                                  🖼️
                                </div>
                              )}

                              <span className="leading-tight font-bold text-slate-800 underline-offset-2 group-hover:text-blue-600 group-hover:underline dark:text-slate-100 dark:group-hover:text-blue-400 print:text-black">
                                {
                                  item.productName
                                }
                              </span>

                            </div>

                          </td>

                          {/* PRODUCT ID */}

                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 print:text-slate-700">
                            {
                              item.productId
                            }
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700">
                            {item.date ||
                              item.saleDate ||
                              "-"}
                          </td>

                          {/* QTY */}

                          <td className="px-2 py-2.5 text-center font-bold print:text-black">
                            {
                              item.quantity
                            }
                          </td>

                          {/* SETTLEMENT */}

                          <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white print:text-black">
                            ₹
                            {Number(
                              item.bankSettlementAmount ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          {/* PACKAGING */}

                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 print:text-slate-700">
                            ₹
                            {Number(
                              item.packagingCost ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          {/* COLOURING */}

                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 print:text-slate-700">
                            ₹
                            {Number(
                              item.colouringCost ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          {/* MARGIN */}

                          <td className="px-3 py-2.5 font-black text-emerald-600 dark:text-emerald-400 print:text-emerald-800">
                            ₹
                            {margin.toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          {/* ACTIONS */}

                          <td className="no-print px-3 py-2.5 text-center">

                            <div className="flex items-center justify-center gap-1">

                              {/* PREVIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewProduct(
                                    item
                                  )
                                }
                                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                title="Preview"
                              >
                                👁️
                              </button>

                              {/* PRINT */}

                              <button
                                type="button"
                                onClick={() =>
                                  handlePrintSingle(
                                    item._id
                                  )
                                }
                                className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                                title="Print this sale"
                              >
                                🖨️
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditModal(
                                    item
                                  )
                                }
                                className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                                title="Edit"
                              >
                                ✏️
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item._id
                                  )
                                }
                                className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                                title="Delete"
                              >
                                🗑️
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

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white dark:border-slate-800 dark:bg-slate-950 print:border-slate-300 print:bg-slate-100 print:text-black">

          <div className="mb-2 border-b border-slate-800 pb-1.5 print:border-slate-300">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
              {selectedPlatform.toUpperCase()} Total Summary
            </p>

          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5 sm:text-left print:grid-cols-5 print:text-left">

            <div>

              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Qty
              </p>

              <p className="text-sm font-black text-white print:text-black">
                {totalQty} units
              </p>

            </div>

            <div>

              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Settlement
              </p>

              <p className="text-sm font-black text-white print:text-black">
                ₹
                {totalSettlement.toLocaleString(
                  "en-IN"
                )}
              </p>

            </div>

            <div>

              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Packaging
              </p>

              <p className="text-sm font-bold text-rose-300 print:text-rose-700">
                − ₹
                {totalPackaging.toLocaleString(
                  "en-IN"
                )}
              </p>

            </div>

            <div>

              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Painting
              </p>

              <p className="text-sm font-bold text-rose-300 print:text-rose-700">
                − ₹
                {totalColouring.toLocaleString(
                  "en-IN"
                )}
              </p>

            </div>

            <div className="col-span-2 rounded-xl border border-emerald-800/50 bg-emerald-950/60 p-2 sm:col-span-1 print:col-span-1 print:border-emerald-300 print:bg-emerald-50">

              <p className="text-[10px] font-bold uppercase text-emerald-400 print:text-emerald-800">
                Net Profit
              </p>

              <p className="text-base font-black text-emerald-300 print:text-emerald-900">
                ₹
                {totalNetMargin.toLocaleString(
                  "en-IN"
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          PRODUCT PREVIEW MODAL
      ===================================================== */}

      {previewProduct && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">

              <div>

                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {
                    previewProduct.platform
                  }
                </span>

                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  {
                    previewProduct.productId
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewProduct(
                    null
                  )
                }
                className="rounded-lg p-1 text-xl font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="space-y-4">

              <div className="flex h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">

                {previewProduct.productImage ? (
                  <img
                    src={
                      previewProduct.productImage
                    }
                    alt={
                      previewProduct.productName
                    }
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-4xl">
                    🖼️
                  </span>
                )}

              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {
                    previewProduct.productName
                  }
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Product ID:{" "}
                  {
                    previewProduct.productId
                  }
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Order Date:{" "}
                  {previewProduct.date ||
                    previewProduct.saleDate ||
                    "-"}
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">

                <div>

                  <span className="text-slate-400">
                    Quantity:
                  </span>

                  <p className="font-bold text-slate-800 dark:text-white">
                    {
                      previewProduct.quantity
                    }{" "}
                    units
                  </p>

                </div>

                <div>

                  <span className="text-slate-400">
                    Bank Settlement:
                  </span>

                  <p className="font-bold text-slate-800 dark:text-white">
                    ₹
                    {Number(
                      previewProduct.bankSettlementAmount ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>

                <div>

                  <span className="text-slate-400">
                    Packaging Cost:
                  </span>

                  <p className="font-medium text-rose-500">
                    ₹
                    {Number(
                      previewProduct.packagingCost ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>

                <div>

                  <span className="text-slate-400">
                    Colouring Cost:
                  </span>

                  <p className="font-medium text-rose-500">
                    ₹
                    {Number(
                      previewProduct.colouringCost ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>

              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/40">

                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Net Margin On Sale
                </span>

                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹
                  {calculateMargin(
                    previewProduct
                  ).toLocaleString(
                    "en-IN"
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">

              <div>

                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingId
                    ? "Edit Sale Entry"
                    : "Add New Sale Entry"}
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Product select karne par SKU automatically fill hoga.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={saving}
                className="text-xl font-bold text-slate-400 hover:text-slate-600 disabled:opacity-50 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* PLATFORM + DATE */}

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Platform
                  </label>

                  <select
                    value={
                      formData.platform
                    }
                    onChange={(e) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          platform:
                            e.target.value,
                        })
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >

                    <option value="meesho">
                      Meesho
                    </option>

                    <option value="amazon">
                      Amazon
                    </option>

                    <option value="flipkart">
                      Flipkart
                    </option>

                  </select>

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Date
                  </label>

                  <input
                    type="date"
                    required
                    value={
                      formData.date
                    }
                    onChange={(e) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          date: e.target.value,
                        })
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* PRODUCT SELECT */}

              <div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Select Product
                </label>

                <select
                  value={
                    formData.productId
                  }
                  onChange={
                    handleProductSelect
                  }
                  disabled={
                    productsLoading
                  }
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >

                  <option value="">
                    {productsLoading
                      ? "Loading products..."
                      : "Select Product"}
                  </option>

                  {products.map(
                    (product, index) => {
                      const id =
                        getProductId(
                          product
                        );

                      const name =
                        getProductName(
                          product
                        );

                      if (!id) {
                        return null;
                      }

                      return (
                        <option
                          key={
                            product._id ||
                            id ||
                            index
                          }
                          value={id}
                        >
                          {id} —{" "}
                          {name ||
                            "Unnamed Product"}
                        </option>
                      );
                    }
                  )}

                </select>

                {products.length ===
                  0 &&
                  !productsLoading && (
                    <p className="mt-1 text-[10px] text-rose-500">
                      Product list nahi mili. Products page me product check karo.
                    </p>
                  )}

              </div>

              {/* AUTO PRODUCT INFO */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">

                <div className="flex items-center gap-3">

                  {formData.productImage ? (
                    <img
                      src={
                        formData.productImage
                      }
                      alt={
                        formData.productName
                      }
                      className="h-14 w-14 rounded-xl border border-blue-100 object-cover dark:border-blue-900"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-blue-100 bg-white text-xl dark:border-blue-900 dark:bg-slate-900">
                      🖼️
                    </div>
                  )}

                  <div className="min-w-0">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      Product ID / SKU
                    </p>

                    <p className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      {formData.productId ||
                        "Auto"}
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formData.productName ||
                        "Product select karo"}
                    </p>

                  </div>

                </div>

              </div>

              {/* QUANTITY */}

              <div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={
                    formData.quantity
                  }
                  onChange={(e) =>
                    setFormData(
                      (prev) => ({
                        ...prev,
                        quantity:
                          e.target.value,
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              {/* PRODUCT IMAGE */}

              <div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Product Image
                </label>

                <p className="mt-1 text-[10px] text-slate-400">
                  Product ki existing image automatically aa jayegi. Zarurat ho to new image upload kar sakte ho.
                </p>

                <div className="mt-2 space-y-3">

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={
                      handleImageFileChange
                    }
                    className="w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
                  />

                  {formData.productImage && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">

                      <img
                        src={
                          formData.productImage
                        }
                        alt="Product Preview"
                        className="h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />

                      <div className="flex-1">

                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Image Preview
                        </p>

                        <p className="text-[10px] text-slate-400">
                          Max size: 5MB
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={
                          handleRemoveImage
                        }
                        className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-400"
                      >
                        Remove
                      </button>

                    </div>
                  )}

                </div>

              </div>

              {/* AMOUNTS */}

              <div className="grid grid-cols-3 gap-3">

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Bank Settlement (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="1200"
                    value={
                      formData.bankSettlementAmount
                    }
                    onChange={(e) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          bankSettlementAmount:
                            e.target.value,
                        })
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Packaging (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formData.packagingCost
                    }
                    onChange={(e) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          packagingCost:
                            e.target.value,
                        })
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Colouring (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formData.colouringCost
                    }
                    onChange={(e) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          colouringCost:
                            e.target.value,
                        })
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-4">

                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Save Entry"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default SalesPage;