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
// PRODUCT ID
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
// PRODUCT NAME
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
// PRODUCT IMAGE
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
// MONEY
// =========================================================

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

// =========================================================
// DATE
// =========================================================

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =========================================================
// PLATFORM
// =========================================================

const getPlatformName = (platform) => {
  const value = String(platform || "").toLowerCase();

  if (value === "meesho") return "Meesho";
  if (value === "amazon") return "Amazon";
  if (value === "flipkart") return "Flipkart";

  return String(platform || "-").toUpperCase();
};

// =========================================================
// SALES PAGE
// =========================================================

const SalesPage = () => {
  const [selectedPlatform, setSelectedPlatform] =
    useState("meesho");

  const [searchTerm, setSearchTerm] = useState("");

  const [sales, setSales] = useState([]);

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [previewProduct, setPreviewProduct] =
    useState(null);

  const [printMenuOpen, setPrintMenuOpen] =
    useState(false);

  const [printSaleId, setPrintSaleId] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const requestInProgressRef = useRef(false);

  const previewUrlRef = useRef(null);

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
  // CLOSE PRINT MENU
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
  // PRINT DATA
  // =========================================================

  const printSales = printSaleId
    ? filteredSales.filter(
        (item) =>
          String(item._id) ===
          String(printSaleId)
      )
    : filteredSales;

  const printTotalSettlement =
    printSales.reduce(
      (acc, item) =>
        acc +
        Number(
          item.bankSettlementAmount || 0
        ),
      0
    );

  const printTotalPackaging =
    printSales.reduce(
      (acc, item) =>
        acc +
        Number(
          item.packagingCost || 0
        ),
      0
    );

  const printTotalColouring =
    printSales.reduce(
      (acc, item) =>
        acc +
        Number(
          item.colouringCost || 0
        ),
      0
    );

  const printTotalNetMargin =
    printSales.reduce(
      (acc, item) =>
        acc + calculateMargin(item),
      0
    );

  const printTotalQty =
    printSales.reduce(
      (acc, item) =>
        acc +
        Number(item.quantity || 0),
      0
    );

  // =========================================================
  // SCREEN SUMMARY
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
    }, 150);
  };

  // =========================================================
  // PRINT SINGLE
  // =========================================================

  const handlePrintSingle = (id) => {
    setPrintSaleId(String(id));

    setPrintMenuOpen(false);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPrintSaleId(null);
      }, 500);
    }, 150);
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

      if (!productId) {
        alert("Product select karo.");
        return;
      }

      if (!productName) {
        alert(
          "Product Name required hai."
        );
        return;
      }

      if (!platform) {
        alert("Platform select karo.");
        return;
      }

      if (!date) {
        alert("Date select karo.");
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

      if (formData.imageFile) {
        data.append(
          "productImage",
          formData.imageFile
        );
      }

      const url = editingId
        ? `${SALES_API_URL}/${editingId}`
        : SALES_API_URL;

      const method = editingId
        ? "PUT"
        : "POST";

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

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Request failed: ${response.status}`
        );
      }

      const returnedSale =
        result?.sale;

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
  // PRINT ROW
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
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-6">

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

        <div className="h-11 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="h-12 animate-pulse border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />

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

        /* ===================================================
           SCREEN
        =================================================== */

        @media screen {

          .print-only {
            display: none !important;
          }

          .print-report-header,
          .print-filter-box,
          .print-footer {
            display: none !important;
          }

        }

        /* ===================================================
           PRINT
        =================================================== */

        @media print {

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          /*
             IMPORTANT:
             Print mein dashboard ka koi bhi element visible
             nahi hoga. Sirf .print-area visible rahega.

             Isse:
             Vraj Creation
             Inventory Management
             pawan
             Administrator
             P
             Sidebar
             Header
             Navigation

             sab print se completely remove ho jayenge.
          */

          html,
          body {
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111111 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-area,
          .print-area * {
            visibility: visible !important;
          }

          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111111 !important;
          }

          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          .print-only {
            display: block !important;
            visibility: visible !important;
          }

          /*
             Print report should look like a normal bill.
          */

          .print-report {
            width: 100% !important;
            background: #ffffff !important;
            color: #111111 !important;
          }

          .print-report-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 20px !important;
            width: 100% !important;
            padding: 0 0 8px 0 !important;
            margin: 0 0 8px 0 !important;
            border-bottom: 2px solid #111111 !important;
            background: #ffffff !important;
          }

          .print-company-name {
            margin: 0 !important;
            padding: 0 !important;
            color: #111111 !important;
            font-size: 19px !important;
            line-height: 1.15 !important;
            font-weight: 800 !important;
            letter-spacing: 0.3px !important;
          }

          .print-report-name {
            margin: 3px 0 0 0 !important;
            color: #333333 !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            font-weight: 600 !important;
          }

          .print-report-meta {
            min-width: 155px !important;
            text-align: right !important;
            color: #222222 !important;
            font-size: 8.5px !important;
            line-height: 1.6 !important;
          }

          .print-report-meta strong {
            color: #111111 !important;
            font-weight: 700 !important;
          }

          .print-filter-box {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            width: 100% !important;
            margin: 0 0 8px 0 !important;
            padding: 5px 7px !important;
            border: 1px solid #999999 !important;
            background: #f7f7f7 !important;
            color: #111111 !important;
            font-size: 8.5px !important;
          }

          .print-filter-item {
            color: #111111 !important;
            white-space: nowrap !important;
          }

          .print-filter-item strong {
            font-weight: 700 !important;
          }

          /* =================================================
             TABLE
          ================================================= */

          .print-table-wrapper {
            width: 100% !important;
            overflow: visible !important;
            border: 1px solid #111111 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }

          .print-table-scroll {
            width: 100% !important;
            overflow: visible !important;
          }

          .desktop-sales-table {
            display: table !important;
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            background: #ffffff !important;
            color: #111111 !important;
          }

          .desktop-sales-table thead {
            display: table-header-group !important;
          }

          .desktop-sales-table tbody {
            display: table-row-group !important;
          }

          .desktop-sales-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .desktop-sales-table th {
            padding: 6px 4px !important;
            background: #eeeeee !important;
            color: #111111 !important;
            border: 1px solid #333333 !important;
            font-size: 7.5px !important;
            line-height: 1.25 !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            vertical-align: middle !important;
          }

          .desktop-sales-table td {
            padding: 6px 4px !important;
            background: #ffffff !important;
            color: #111111 !important;
            border: 1px solid #888888 !important;
            font-size: 8px !important;
            line-height: 1.3 !important;
            vertical-align: middle !important;
          }

          .desktop-sales-table tbody tr:nth-child(even) td {
            background: #fafafa !important;
          }

          .print-product-name {
            color: #111111 !important;
            font-weight: 700 !important;
            text-decoration: none !important;
          }

          .print-id {
            color: #333333 !important;
            font-size: 7.5px !important;
            font-family: "Courier New", monospace !important;
          }

          .print-number {
            color: #111111 !important;
            font-weight: 700 !important;
          }

          .print-margin {
            color: #111111 !important;
            font-weight: 800 !important;
          }

          .print-img {
            display: none !important;
          }

          .print-actions {
            display: none !important;
          }

          .print-hidden-row {
            display: none !important;
          }

          .mobile-sales-list {
            display: none !important;
          }

          /* =================================================
             SUMMARY - BILL STYLE
          ================================================= */

          .print-summary {
            width: 100% !important;
            margin-top: 8px !important;
            padding: 7px !important;
            border: 1px solid #111111 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #111111 !important;
          }

          .print-summary-title {
            margin-bottom: 5px !important;
            padding-bottom: 4px !important;
            border-bottom: 1px solid #555555 !important;
          }

          .print-summary-title p {
            color: #111111 !important;
            font-size: 8px !important;
            font-weight: 800 !important;
            letter-spacing: 0.3px !important;
          }

          .print-summary-grid {
            display: grid !important;
            grid-template-columns:
              repeat(5, minmax(0, 1fr)) !important;
            gap: 0 !important;
            width: 100% !important;
          }

          .print-summary-item {
            min-width: 0 !important;
            padding: 3px 7px !important;
            border-right: 1px solid #bbbbbb !important;
          }

          .print-summary-item:last-child {
            border-right: none !important;
          }

          .print-summary-label {
            color: #555555 !important;
            font-size: 7px !important;
            line-height: 1.3 !important;
            font-weight: 600 !important;
          }

          .print-summary-value {
            margin-top: 2px !important;
            color: #111111 !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
            font-weight: 800 !important;
          }

          .print-profit {
            border: none !important;
            border-right: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }

          .print-profit-label {
            color: #555555 !important;
            font-size: 7px !important;
            font-weight: 700 !important;
          }

          .print-profit-value {
            color: #111111 !important;
            font-size: 10px !important;
            font-weight: 900 !important;
          }

          /* =================================================
             FOOTER
          ================================================= */

          .print-footer {
            display: block !important;
            width: 100% !important;
            margin-top: 8px !important;
            padding-top: 5px !important;
            border-top: 1px solid #aaaaaa !important;
            color: #555555 !important;
            font-size: 7px !important;
            text-align: center !important;
          }

          /* =================================================
             COLUMNS
          ================================================= */

          .print-col-product {
            width: 24% !important;
          }

          .print-col-id {
            width: 12% !important;
          }

          .print-col-date {
            width: 11% !important;
          }

          .print-col-qty {
            width: 6% !important;
          }

          .print-col-settlement {
            width: 14% !important;
          }

          .print-col-packaging {
            width: 10% !important;
          }

          .print-col-colouring {
            width: 11% !important;
          }

          .print-col-margin {
            width: 12% !important;
          }

          .print-page-break {
            page-break-before: always !important;
          }

        }

      `}</style>

      {/* =====================================================
          SCREEN HEADER
      ===================================================== */}

      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Marketplace Sales
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage orders, edits, settlements and profit margins
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* PLATFORM */}

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
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}

          </div>

          {/* PRINT */}

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
              <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                <button
                  type="button"
                  onClick={
                    handlePrintAll
                  }
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

                <div className="max-h-80 overflow-y-auto">

                  <div className="px-4 pb-2 pt-3">

                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Print Individual Sale
                    </p>

                  </div>

                  {filteredSales.length ===
                  0 ? (
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

          {/* ADD SALE */}

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

        {/* ===================================================
            BILL STYLE PRINT HEADER
        =================================================== */}

        <div className="print-report-header hidden">

          <div>

            <h1 className="print-company-name">
              VRAJ CREATION
            </h1>

            <p className="print-report-name">
              Marketplace Sales Report
            </p>

          </div>

          <div className="print-report-meta">

            <div>
              Platform:{" "}
              <strong>
                {getPlatformName(
                  selectedPlatform
                )}
              </strong>
            </div>

            <div>
              Report:{" "}
              <strong>
                {printSaleId
                  ? "Individual Sale"
                  : "All Sales"}
              </strong>
            </div>

            <div>
              Date:{" "}
              <strong>
                {new Date().toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }
                )}
              </strong>
            </div>

          </div>

        </div>

        {/* ===================================================
            PRINT FILTER
        =================================================== */}

        <div className="print-filter-box hidden">

          <div className="print-filter-item">

            <strong>
              Platform:
            </strong>{" "}

            {getPlatformName(
              selectedPlatform
            )}

          </div>

          <div className="print-filter-item">

            <strong>
              Entries:
            </strong>{" "}

            {printSales.length}

          </div>

          <div className="print-filter-item">

            <strong>
              Quantity:
            </strong>{" "}

            {printTotalQty}

          </div>

        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="print-table-wrapper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="print-table-scroll overflow-x-auto">

            <table className="desktop-sales-table w-full min-w-[1000px] text-left text-xs sm:text-sm">

              <colgroup>

                <col className="print-col-product" />

                <col className="print-col-id" />

                <col className="print-col-date" />

                <col className="print-col-qty" />

                <col className="print-col-settlement" />

                <col className="print-col-packaging" />

                <col className="print-col-colouring" />

                <col className="print-col-margin" />

              </colgroup>

              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">

                <tr>

                  <th className="px-3 py-3">
                    Product
                  </th>

                  <th className="px-3 py-3">
                    Product ID
                  </th>

                  <th className="px-3 py-3">
                    Date
                  </th>

                  <th className="px-2 py-3 text-center">
                    Qty
                  </th>

                  <th className="px-3 py-3">
                    Bank Settlement
                  </th>

                  <th className="px-3 py-3">
                    Packaging
                  </th>

                  <th className="px-3 py-3">
                    Colouring
                  </th>

                  <th className="px-3 py-3">
                    Margin
                  </th>

                  <th className="print-actions no-print px-3 py-3 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

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
                                  className="print-img h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                />
                              ) : (
                                <div className="print-img flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs dark:border-slate-700 dark:bg-slate-800">
                                  🖼️
                                </div>
                              )}

                              <span className="print-product-name leading-tight font-bold text-slate-800 dark:text-slate-100">
                                {
                                  item.productName ||
                                  "Unnamed Product"
                                }
                              </span>

                            </div>

                          </td>

                          {/* ID */}

                          <td className="print-id px-3 py-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">

                            {
                              item.productId ||
                              "-"
                            }

                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">

                            {formatDate(
                              item.date ||
                                item.saleDate
                            )}

                          </td>

                          {/* QTY */}

                          <td className="print-number px-2 py-2.5 text-center font-bold">

                            {
                              item.quantity ||
                              0
                            }

                          </td>

                          {/* SETTLEMENT */}

                          <td className="print-number px-3 py-2.5 font-bold text-slate-900 dark:text-white">

                            ₹
                            {formatMoney(
                              item.bankSettlementAmount
                            )}

                          </td>

                          {/* PACKAGING */}

                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">

                            ₹
                            {formatMoney(
                              item.packagingCost
                            )}

                          </td>

                          {/* COLOURING */}

                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">

                            ₹
                            {formatMoney(
                              item.colouringCost
                            )}

                          </td>

                          {/* MARGIN */}

                          <td className="print-margin px-3 py-2.5 font-black text-emerald-600 dark:text-emerald-400">

                            ₹
                            {formatMoney(
                              margin
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="print-actions no-print px-3 py-2.5 text-center">

                            <div className="flex items-center justify-center gap-1">

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

                              <button
                                type="button"
                                onClick={() =>
                                  handlePrintSingle(
                                    item._id
                                  )
                                }
                                className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:text-red-400"
                                title="Print"
                              >
                                🖨️
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditModal(
                                    item
                                  )
                                }
                                className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                                title="Edit"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item._id
                                  )
                                }
                                className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400"
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
            MOBILE LIST
        ===================================================== */}

        <div className="mobile-sales-list space-y-3 lg:hidden">

          {filteredSales.length ===
          0 ? (

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50">

              <div className="mb-2 text-3xl">
                📦
              </div>

              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                No sales entry found
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                {selectedPlatform.toUpperCase()} ke liye koi sale entry nahi hai.
              </p>

            </div>

          ) : (
            filteredSales.map(
              (item) => {

                const margin =
                  calculateMargin(
                    item
                  );

                return (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >

                    {/* CARD HEADER */}

                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/50">

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewProduct(
                            item
                          )
                        }
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
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
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            🖼️
                          </div>
                        )}

                      </button>

                      <div className="min-w-0 flex-1">

                        <button
                          type="button"
                          onClick={() =>
                            setPreviewProduct(
                              item
                            )
                          }
                          className="block max-w-full text-left"
                        >

                          <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {item.productName ||
                              "Unnamed Product"}
                          </p>

                        </button>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">

                          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {item.productId ||
                              "-"}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {formatDate(
                              item.date ||
                                item.saleDate
                            )}
                          </span>

                        </div>

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Qty
                        </p>

                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {item.quantity ||
                            0}
                        </p>

                      </div>

                    </div>

                    {/* FINANCIAL */}

                    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">

                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Settlement
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">
                          ₹
                          {formatMoney(
                            item.bankSettlementAmount
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">

                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Packaging
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-rose-500">
                          ₹
                          {formatMoney(
                            item.packagingCost
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">

                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Colouring
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-rose-500">
                          ₹
                          {formatMoney(
                            item.colouringCost
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800/50 dark:bg-emerald-950/30">

                        <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          Margin
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-emerald-600 dark:text-emerald-400">
                          ₹
                          {formatMoney(
                            margin
                          )}
                        </p>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="grid grid-cols-4 gap-2 border-t border-slate-100 p-3 dark:border-slate-800">

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewProduct(
                            item
                          )
                        }
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <span>👁️</span>

                        <span className="hidden sm:inline">
                          View
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handlePrintSingle(
                            item._id
                          )
                        }
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                      >
                        <span>🖨️</span>

                        <span className="hidden sm:inline">
                          Print
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEditModal(
                            item
                          )
                        }
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400"
                      >
                        <span>✏️</span>

                        <span className="hidden sm:inline">
                          Edit
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            item._id
                          )
                        }
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <span>🗑️</span>

                        <span className="hidden sm:inline">
                          Delete
                        </span>
                      </button>

                    </div>

                  </div>
                );
              }
            )
          )}

        </div>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="print-summary rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white dark:border-slate-800 dark:bg-slate-950">

          <div className="print-summary-title mb-2 border-b border-slate-800 pb-1.5">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {selectedPlatform.toUpperCase()} Total Summary
            </p>

          </div>

          <div className="print-summary-grid grid grid-cols-2 gap-3 text-center sm:grid-cols-5 sm:text-left">

            <div className="print-summary-item">

              <p className="print-summary-label text-[10px] text-slate-400">
                Total Qty
              </p>

              <p className="print-summary-value text-sm font-black text-white">
                {printSaleId
                  ? printTotalQty
                  : totalQty}{" "}
                units
              </p>

            </div>

            <div className="print-summary-item">

              <p className="print-summary-label text-[10px] text-slate-400">
                Total Settlement
              </p>

              <p className="print-summary-value text-sm font-black text-white">
                ₹
                {formatMoney(
                  printSaleId
                    ? printTotalSettlement
                    : totalSettlement
                )}
              </p>

            </div>

            <div className="print-summary-item">

              <p className="print-summary-label text-[10px] text-slate-400">
                Total Packaging
              </p>

              <p className="print-summary-value text-sm font-bold text-rose-300">
                − ₹
                {formatMoney(
                  printSaleId
                    ? printTotalPackaging
                    : totalPackaging
                )}
              </p>

            </div>

            <div className="print-summary-item">

              <p className="print-summary-label text-[10px] text-slate-400">
                Total Colouring
              </p>

              <p className="print-summary-value text-sm font-bold text-rose-300">
                − ₹
                {formatMoney(
                  printSaleId
                    ? printTotalColouring
                    : totalColouring
                )}
              </p>

            </div>

            <div className="print-profit print-summary-item rounded-xl border border-emerald-800/50 bg-emerald-950/60 p-2">

              <p className="print-profit-label text-[10px] font-bold uppercase text-emerald-400">
                Net Profit
              </p>

              <p className="print-profit-value text-base font-black text-emerald-300">
                ₹
                {formatMoney(
                  printSaleId
                    ? printTotalNetMargin
                    : totalNetMargin
                )}
              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            PRINT FOOTER
        ===================================================== */}

        <div className="print-footer hidden">

          Vraj Creation • Marketplace Sales Report

        </div>

      </div>

      {/* =====================================================
          PRODUCT PREVIEW
      ===================================================== */}

      {previewProduct && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">

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
                  {formatDate(
                    previewProduct.date ||
                      previewProduct.saleDate
                  )}
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
                    {formatMoney(
                      previewProduct.bankSettlementAmount
                    )}
                  </p>

                </div>

                <div>

                  <span className="text-slate-400">
                    Packaging Cost:
                  </span>

                  <p className="font-medium text-rose-500">
                    ₹
                    {formatMoney(
                      previewProduct.packagingCost
                    )}
                  </p>

                </div>

                <div>

                  <span className="text-slate-400">
                    Colouring Cost:
                  </span>

                  <p className="font-medium text-rose-500">
                    ₹
                    {formatMoney(
                      previewProduct.colouringCost
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
                  {formatMoney(
                    calculateMargin(
                      previewProduct
                    )
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

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

              {/* PRODUCT */}

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

              {/* PRODUCT INFO */}

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

              {/* IMAGE */}

              <div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Product Image
                </label>

                <p className="mt-1 text-[10px] text-slate-400">
                  Existing image automatically aa jayegi. Zarurat ho to new image upload kar sakte ho.
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

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

              <div className="flex flex-col-reverse justify-end gap-3 pt-4 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
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