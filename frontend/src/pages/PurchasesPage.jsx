
import { useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import api from "../services/api";

const DEFAULT_IMAGE = "https://via.placeholder.com/80";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 caret-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:-translate-y-[1px] focus:border-indigo-500 focus:bg-white focus:text-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:caret-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-indigo-400 dark:focus:bg-slate-800 dark:focus:text-white dark:focus:ring-indigo-400/10";

const FILE_INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-700 outline-none transition-all duration-200 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-800 dark:file:bg-slate-700 dark:file:text-white";

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const createInitialForm = () => ({
  productId: "",
  productSku: "",
  purchaseDate: getToday(),
  productName: "",
  rawCost: "",
  supplierName: "",
  quantity: 1,
  productImage: "",
  imageFile: null,
});

const escapeHtml = (value) => {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getProductsFromResponse = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }

  return [];
};

const getPurchasesFromResponse = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.purchases)) {
    return response.data.purchases;
  }

  return [];
};

const getProductImage = (product) => {
  if (!product) return "";

  return (
    product.image ||
    product.imageUrl ||
    product.image_url ||
    product.productImage ||
    product.product_image ||
    product.thumbnail ||
    ""
  );
};

const getProductSku = (product) => {
  if (!product) return "";

  return (
    product.sku ||
    product.productId ||
    product.product_id ||
    product.code ||
    ""
  );
};

const PurchasePage = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(createInitialForm());

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [error, setError] = useState("");

  const dropdownRef = useRef(null);

  // =====================================================
  // CLOSE DROPDOWN OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =====================================================
  // FETCH PURCHASES
  // =====================================================

  const fetchPurchases = async () => {
    try {
      const response = await api.get("/purchases");

      setPurchases(getPurchasesFromResponse(response));
    } catch (error) {
      console.error("FETCH PURCHASES ERROR:", error);
      throw error;
    }
  };

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");

      setProducts(getProductsFromResponse(response));
    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);
      throw error;
    }
  };

  // =====================================================
  // FETCH ALL
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchPurchases(),
        fetchProducts(),
      ]);
    } catch (error) {
      console.error("FETCH PURCHASE PAGE ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Purchase aur product data load nahi ho raha."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // SELECTED PRODUCT
  // =====================================================

  const selectedProduct = useMemo(() => {
    if (!formData.productId) {
      return null;
    }

    return (
      products.find(
        (product) =>
          String(product._id) ===
          String(formData.productId)
      ) || null
    );
  }, [products, formData.productId]);

  // =====================================================
  // FILTER PURCHASES
  // =====================================================

  const filteredPurchases = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return purchases;
    }

    return purchases.filter((item) => {
      const matchingProduct = products.find(
        (product) =>
          String(product._id) ===
          String(item.productId)
      );

      const productSku =
        getProductSku(matchingProduct) ||
        item.productSku ||
        "";

      return (
        String(item.productName || "")
          .toLowerCase()
          .includes(search) ||
        String(item.productId || "")
          .toLowerCase()
          .includes(search) ||
        String(productSku)
          .toLowerCase()
          .includes(search) ||
        String(item.supplierName || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [purchases, searchTerm, products]);

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredModalProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase();

      const sku = String(getProductSku(product)).toLowerCase();

      const id = String(product._id || "").toLowerCase();

      return (
        name.includes(query) ||
        sku.includes(query) ||
        id.includes(query)
      );
    });
  }, [products, productSearchQuery]);

  // =====================================================
  // SELECT CHECKBOX
  // =====================================================

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // =====================================================
  // SELECT ALL
  // =====================================================

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = filteredPurchases.map((item) => item._id);

      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  // =====================================================
  // CALCULATE TOTAL
  // =====================================================

  const calculateTotalPurchaseCost = (item) => {
    const cost = Number(item.rawCost) || 0;
    const quantity = Number(item.quantity) || 0;

    return cost * quantity;
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // =====================================================
  // PRODUCT DISPLAY ID
  // =====================================================

  const getProductDisplayId = (item) => {
    const matchingProduct = products.find(
      (product) =>
        String(product._id) ===
        String(item.productId)
    );

    return (
      getProductSku(matchingProduct) ||
      item.productSku ||
      (typeof item.productId === "string"
        ? item.productId.slice(-6).toUpperCase()
        : "-")
    );
  };

  // =====================================================
  // PRODUCT IMAGE
  // =====================================================

  const getPurchaseImage = (item) => {
    if (item.productImage) {
      return item.productImage;
    }

    const matchingProduct = products.find(
      (product) =>
        String(product._id) ===
        String(item.productId)
    );

    return getProductImage(matchingProduct) || DEFAULT_IMAGE;
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(createInitialForm());
    setProductSearchQuery("");
    setIsProductDropdownOpen(false);
    setError("");
    setIsModalOpen(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const handleOpenEditModal = (item) => {
    const matchingProduct = products.find(
      (product) =>
        String(product._id) ===
        String(item.productId)
    );

    const productSku =
      getProductSku(matchingProduct) ||
      item.productSku ||
      "";

    setEditingId(item._id);

    setFormData({
      productId: item.productId || "",
      productSku,
      purchaseDate: item.purchaseDate || getToday(),
      productName:
        matchingProduct?.name ||
        item.productName ||
        "",
      rawCost:
        item.rawCost ??
        matchingProduct?.purchasePrice ??
        "",
      supplierName: item.supplierName || "",
      quantity: item.quantity ?? 1,
      productImage:
        item.productImage ||
        getProductImage(matchingProduct) ||
        "",
      imageFile: null,
    });

    setProductSearchQuery(
      matchingProduct?.name ||
        item.productName ||
        ""
    );

    setIsProductDropdownOpen(false);
    setError("");
    setIsModalOpen(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    if (
      formData.productImage &&
      formData.productImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(formData.productImage);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData(createInitialForm());
    setProductSearchQuery("");
    setIsProductDropdownOpen(false);
    setError("");
    setSaving(false);
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SELECT PRODUCT
  // =====================================================

  const handleSelectProduct = (product) => {
    if (!product) {
      setFormData((prev) => ({
        ...prev,
        productId: "",
        productSku: "",
        productName: "",
        rawCost: "",
        productImage: "",
      }));

      setProductSearchQuery("");
      setIsProductDropdownOpen(false);

      return;
    }

    const productSku = getProductSku(product);
    const productImage = getProductImage(product);

    const purchasePrice =
      product.purchasePrice ??
      product.purchase_price ??
      "";

    setFormData((prev) => ({
      ...prev,
      productId: product._id || "",
      productSku,
      productName: product.name || "",
      rawCost: purchasePrice,
      productImage: productImage || "",
    }));

    setProductSearchQuery(product.name || "");
    setIsProductDropdownOpen(false);
    setError("");
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5 MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      productImage: previewUrl,
      imageFile: file,
    }));

    setError("");
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const handleRemoveImage = () => {
    if (
      formData.productImage &&
      formData.productImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(formData.productImage);
    }

    setFormData((prev) => ({
      ...prev,
      productImage: "",
      imageFile: null,
    }));
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Kya aap is purchase entry ko delete karna chahte hain?\n\nDelete karne par backend Product stock ko bhi automatically adjust karega."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/purchases/${id}`);

      setPurchases((prev) =>
        prev.filter((item) => item._id !== id)
      );

      setSelectedIds((prev) =>
        prev.filter((selectedId) => selectedId !== id)
      );

      await fetchProducts();

      window.dispatchEvent(
        new Event("inventory-updated")
      );
    } catch (error) {
      console.error("DELETE PURCHASE ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Purchase delete nahi ho pa raha."
      );
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const productId = String(
      formData.productId || ""
    ).trim();

    const productName = String(
      formData.productName || ""
    ).trim();

    const supplierName = String(
      formData.supplierName || ""
    ).trim();

    const rawCost = Number(formData.rawCost);
    const quantity = Number(formData.quantity);

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (!productName) {
      setError("Product name is missing.");
      return;
    }

    if (!supplierName) {
      setError("Please enter supplier name.");
      return;
    }

    if (!formData.purchaseDate) {
      setError("Please select purchase date.");
      return;
    }

    if (!Number.isFinite(rawCost) || rawCost <= 0) {
      setError("Raw cost must be greater than 0.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError(
        "Quantity must be a whole number greater than 0."
      );
      return;
    }

    const productExists = products.some(
      (product) =>
        String(product._id) === String(productId)
    );

    if (!productExists) {
      setError(
        "Selected product database mein nahi mila."
      );
      return;
    }

    const data = new FormData();

    data.append("productId", productId);
    data.append(
      "productSku",
      String(formData.productSku || "")
    );
    data.append(
      "purchaseDate",
      formData.purchaseDate
    );
    data.append("productName", productName);
    data.append("rawCost", String(rawCost));
    data.append("supplierName", supplierName);
    data.append("quantity", String(quantity));

    if (formData.imageFile) {
      data.append("imageFile", formData.imageFile);
    }

    try {
      setSaving(true);

      if (editingId) {
        const response = await api.put(
          `/purchases/${editingId}`,
          data
        );

        const updatedPurchase =
          response.data?.purchase ||
          response.data;

        setPurchases((prev) =>
          prev.map((item) =>
            item._id === editingId
              ? updatedPurchase
              : item
          )
        );
      } else {
        const response = await api.post(
          "/purchases",
          data
        );

        const newPurchase =
          response.data?.purchase ||
          response.data;

        setPurchases((prev) => [
          newPurchase,
          ...prev,
        ]);
      }

      await fetchProducts();

      window.dispatchEvent(
        new Event("inventory-updated")
      );

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(createInitialForm());
      setProductSearchQuery("");
      setIsProductDropdownOpen(false);
      setError("");
    } catch (error) {
      console.error("SAVE PURCHASE ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Purchase save nahi ho pa raha."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // PDF HTML - IMPROVED PRINT REPORT
  // =====================================================

  const createPurchaseReportHTML = (
    itemsToExport,
    title = "Purchase Statement"
  ) => {
    const totalQty = itemsToExport.reduce(
      (total, item) =>
        total + (Number(item.quantity) || 0),
      0
    );

    const totalExp = itemsToExport.reduce(
      (total, item) =>
        total + calculateTotalPurchaseCost(item),
      0
    );

    const totalRawCost = itemsToExport.reduce(
      (total, item) =>
        total +
        (Number(item.rawCost) || 0),
      0
    );

    const generatedDate =
      new Date().toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    const reportRows = itemsToExport
      .map((item, index) => {
        const productName = escapeHtml(
          item.productName || "-"
        );

        const prodIdDisplay =
          getProductDisplayId(item);

        const purchaseDate = escapeHtml(
          item.purchaseDate || "-"
        );

        const supplierName = escapeHtml(
          item.supplierName || "-"
        );

        const quantity =
          Number(item.quantity || 0);

        const rawCost =
          Number(item.rawCost || 0);

        const totalExpense =
          calculateTotalPurchaseCost(item);

        return `
          <tr
            style="
              page-break-inside:avoid;
              break-inside:avoid;
            "
          >

            <td
              style="
                padding:9px 6px;
                border:1px solid #cbd5e1;
                text-align:center;
                color:#111827;
              "
            >
              ${index + 1}
            </td>

            <td
              style="
                padding:9px 7px;
                border:1px solid #cbd5e1;
                overflow-wrap:anywhere;
                word-break:break-word;
                font-weight:700;
                color:#111827;
              "
            >
              ${productName}
            </td>

            <td
              style="
                padding:9px 7px;
                border:1px solid #cbd5e1;
                font-family:monospace;
                font-size:9px;
                color:#374151;
              "
            >
              ${escapeHtml(prodIdDisplay)}
            </td>

            <td
              style="
                padding:9px 7px;
                border:1px solid #cbd5e1;
                color:#374151;
              "
            >
              ${purchaseDate}
            </td>

            <td
              style="
                padding:9px 7px;
                border:1px solid #cbd5e1;
                overflow-wrap:anywhere;
                word-break:break-word;
                color:#374151;
              "
            >
              ${supplierName}
            </td>

            <td
              style="
                padding:9px 6px;
                border:1px solid #cbd5e1;
                text-align:center;
                font-weight:700;
                color:#111827;
              "
            >
              ${quantity.toLocaleString("en-IN")}
            </td>

            <td
              style="
                padding:9px 6px;
                border:1px solid #cbd5e1;
                text-align:right;
                white-space:nowrap;
                color:#374151;
              "
            >
              ₹${rawCost.toLocaleString("en-IN")}
            </td>

            <td
              style="
                padding:9px 6px;
                border:1px solid #cbd5e1;
                text-align:right;
                white-space:nowrap;
                font-weight:800;
                color:#111827;
              "
            >
              ₹${totalExpense.toLocaleString("en-IN")}
            </td>

          </tr>
        `;
      })
      .join("");

    return `
      <div
        style="
          width:1000px;
          max-width:1000px;
          box-sizing:border-box;
          background:#ffffff;
          color:#111827;
          font-family:Arial,Helvetica,sans-serif;
          padding:28px;
          margin:0;
        "
      >

        <!-- REPORT HEADER -->

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:30px;
            padding-bottom:18px;
            margin-bottom:18px;
            border-bottom:2px solid #111827;
          "
        >

          <div>

            <div
              style="
                font-size:11px;
                font-weight:800;
                letter-spacing:2px;
                color:#64748b;
                margin-bottom:5px;
              "
            >
              VRAJ CREATION
            </div>

            <h1
              style="
                margin:0;
                font-size:25px;
                line-height:1.2;
                color:#111827;
              "
            >
              ${escapeHtml(title)}
            </h1>

            <p
              style="
                margin:7px 0 0;
                font-size:10px;
                color:#64748b;
              "
            >
              Purchase Management & Inventory Record
            </p>

          </div>

          <div
            style="
              min-width:150px;
              text-align:right;
            "
          >

            <div
              style="
                font-size:8px;
                font-weight:800;
                letter-spacing:1px;
                text-transform:uppercase;
                color:#94a3b8;
                margin-bottom:4px;
              "
            >
              Generated On
            </div>

            <div
              style="
                font-size:12px;
                font-weight:800;
                color:#111827;
              "
            >
              ${generatedDate}
            </div>

            <div
              style="
                margin-top:10px;
                font-size:8px;
                font-weight:800;
                letter-spacing:1px;
                text-transform:uppercase;
                color:#94a3b8;
                margin-bottom:4px;
              "
            >
              Total Records
            </div>

            <div
              style="
                font-size:18px;
                font-weight:900;
                color:#111827;
              "
            >
              ${itemsToExport.length}
            </div>

          </div>

        </div>

        <!-- SUMMARY -->

        <div
          style="
            display:grid;
            grid-template-columns:repeat(4,1fr);
            gap:9px;
            margin-bottom:18px;
          "
        >

          <div
            style="
              border:1px solid #cbd5e1;
              background:#f8fafc;
              padding:11px;
              border-radius:6px;
            "
          >
            <div
              style="
                font-size:8px;
                font-weight:800;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#64748b;
              "
            >
              Purchase Qty
            </div>

            <div
              style="
                margin-top:5px;
                font-size:16px;
                font-weight:900;
                color:#111827;
              "
            >
              ${totalQty.toLocaleString("en-IN")}
              <span
                style="
                  font-size:9px;
                  font-weight:600;
                  color:#64748b;
                "
              >
                Units
              </span>
            </div>
          </div>

          <div
            style="
              border:1px solid #cbd5e1;
              background:#f8fafc;
              padding:11px;
              border-radius:6px;
            "
          >
            <div
              style="
                font-size:8px;
                font-weight:800;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#64748b;
              "
            >
              Records
            </div>

            <div
              style="
                margin-top:5px;
                font-size:16px;
                font-weight:900;
                color:#111827;
              "
            >
              ${itemsToExport.length}
            </div>
          </div>

          <div
            style="
              border:1px solid #cbd5e1;
              background:#f8fafc;
              padding:11px;
              border-radius:6px;
            "
          >
            <div
              style="
                font-size:8px;
                font-weight:800;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#64748b;
              "
            >
              Raw Cost / Unit Total
            </div>

            <div
              style="
                margin-top:5px;
                font-size:16px;
                font-weight:900;
                color:#111827;
              "
            >
              ₹${totalRawCost.toLocaleString("en-IN")}
            </div>
          </div>

          <div
            style="
              border:2px solid #111827;
              background:#f1f5f9;
              padding:10px;
              border-radius:6px;
            "
          >
            <div
              style="
                font-size:8px;
                font-weight:800;
                text-transform:uppercase;
                letter-spacing:.5px;
                color:#475569;
              "
            >
              Total Expense
            </div>

            <div
              style="
                margin-top:5px;
                font-size:17px;
                font-weight:900;
                color:#111827;
              "
            >
              ₹${totalExp.toLocaleString("en-IN")}
            </div>
          </div>

        </div>

        <!-- TABLE -->

        <table
          style="
            width:100%;
            border-collapse:collapse;
            table-layout:fixed;
            font-size:9px;
            line-height:1.35;
          "
        >

          <colgroup>
            <col style="width:4%;" />
            <col style="width:21%;" />
            <col style="width:12%;" />
            <col style="width:11%;" />
            <col style="width:18%;" />
            <col style="width:7%;" />
            <col style="width:12%;" />
            <col style="width:15%;" />
          </colgroup>

          <thead>

            <tr style="background:#e2e8f0;">

              <th
                style="
                  padding:9px 6px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:center;
                "
              >
                #
              </th>

              <th
                style="
                  padding:9px 7px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:left;
                "
              >
                PRODUCT
              </th>

              <th
                style="
                  padding:9px 7px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:left;
                "
              >
                PRODUCT ID
              </th>

              <th
                style="
                  padding:9px 7px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:left;
                "
              >
                DATE
              </th>

              <th
                style="
                  padding:9px 7px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:left;
                "
              >
                SUPPLIER
              </th>

              <th
                style="
                  padding:9px 6px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:center;
                "
              >
                QTY
              </th>

              <th
                style="
                  padding:9px 6px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:right;
                "
              >
                RAW COST
              </th>

              <th
                style="
                  padding:9px 6px;
                  border:1px solid #94a3b8;
                  font-size:8px;
                  font-weight:900;
                  color:#111827;
                  text-align:right;
                "
              >
                TOTAL EXPENSE
              </th>

            </tr>

          </thead>

          <tbody>
            ${
              reportRows ||
              `
                <tr>
                  <td
                    colspan="8"
                    style="
                      padding:25px;
                      text-align:center;
                      border:1px solid #cbd5e1;
                      color:#64748b;
                    "
                  >
                    No purchase records found.
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

        <!-- TOTAL BOX -->

        <div
          style="
            margin-top:18px;
            display:flex;
            justify-content:flex-end;
          "
        >

          <table
            style="
              width:330px;
              border-collapse:collapse;
              font-size:9px;
            "
          >

            <tbody>

              <tr>

                <td
                  style="
                    padding:8px;
                    border:1px solid #cbd5e1;
                    color:#475569;
                  "
                >
                  Total Purchase Qty
                </td>

                <td
                  style="
                    padding:8px;
                    border:1px solid #cbd5e1;
                    text-align:right;
                    font-weight:800;
                    color:#111827;
                  "
                >
                  ${totalQty.toLocaleString("en-IN")} Units
                </td>

              </tr>

              <tr>

                <td
                  style="
                    padding:8px;
                    border:1px solid #cbd5e1;
                    color:#475569;
                  "
                >
                  Total Records
                </td>

                <td
                  style="
                    padding:8px;
                    border:1px solid #cbd5e1;
                    text-align:right;
                    font-weight:800;
                    color:#111827;
                  "
                >
                  ${itemsToExport.length}
                </td>

              </tr>

              <tr>

                <td
                  style="
                    padding:9px;
                    border:2px solid #111827;
                    font-weight:900;
                    color:#111827;
                    background:#f8fafc;
                  "
                >
                  GRAND TOTAL EXPENSE
                </td>

                <td
                  style="
                    padding:9px;
                    border:2px solid #111827;
                    text-align:right;
                    font-weight:900;
                    color:#111827;
                    background:#f8fafc;
                  "
                >
                  ₹${totalExp.toLocaleString("en-IN")}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

        <!-- FOOTER -->

        <div
          style="
            margin-top:24px;
            padding-top:10px;
            border-top:1px solid #cbd5e1;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:20px;
            font-size:8px;
            color:#64748b;
          "
        >

          <span>
            Vraj Creation • Purchase Management Report
          </span>

          <span>
            Computer Generated Document
          </span>

        </div>

      </div>
    `;
  };

  // =====================================================
  // GENERATE PDF
  // =====================================================

  const generatePurchasePDF = async (
    itemsToExport,
    filename,
    title
  ) => {
    if (!itemsToExport.length) {
      setError(
        "PDF ke liye purchase record nahi mila."
      );
      return;
    }

    let wrapper = null;

    try {
      setError("");

      const reportHTML =
        createPurchaseReportHTML(
          itemsToExport,
          title
        );

      wrapper = document.createElement("div");

      wrapper.style.position = "fixed";
      wrapper.style.left = "-100000px";
      wrapper.style.top = "0";
      wrapper.style.width = "1000px";
      wrapper.style.background = "#ffffff";
      wrapper.style.color = "#111827";
      wrapper.style.zIndex = "-9999";

      wrapper.innerHTML = reportHTML;

      document.body.appendChild(wrapper);

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );

      const options = {
        margin: [5, 5, 5, 5],

        filename,

        image: {
          type: "jpeg",
          quality: 0.98,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1000,
          windowHeight: 1400,
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "landscape",
          compress: true,
        },

        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ["tr"],
        },
      };

      await html2pdf()
        .set(options)
        .from(wrapper.firstElementChild)
        .save();
    } catch (error) {
      console.error(
        "PDF GENERATION ERROR:",
        error
      );

      setError(
        "PDF generate nahi ho pa raha. Please try again."
      );
    } finally {
      if (wrapper) {
        wrapper.remove();
      }
    }
  };

  // =====================================================
  // SELECTED PDF
  // =====================================================

  const handleDownloadPDF = async () => {
    const itemsToExport = purchases.filter(
      (item) =>
        selectedIds.includes(item._id)
    );

    if (!itemsToExport.length) {
      setError(
        "PDF export ke liye table mein se kam se kam ek purchase select karein."
      );
      return;
    }

    await generatePurchasePDF(
      itemsToExport,
      `Selected_Purchase_Report_${getToday()}.pdf`,
      "Selected Purchase Statement"
    );
  };

  // =====================================================
  // SINGLE PURCHASE PDF
  // =====================================================

  const handlePrintSinglePurchase = async (item) => {
    if (!item?._id) {
      setError("Purchase record nahi mila.");
      return;
    }

    try {
      setPrintingId(item._id);
      setError("");

      const productId =
        getProductDisplayId(item);

      const safeProductName = String(
        item.productName || "Purchase"
      )
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const safeProductId = String(
        productId || "ID"
      ).replace(/[^a-zA-Z0-9-_]/g, "");

      const filename =
        `Purchase_${safeProductName}_${safeProductId}_${item.purchaseDate || getToday()}.pdf`;

      await generatePurchasePDF(
        [item],
        filename,
        "Purchase Entry"
      );
    } finally {
      setPrintingId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <div className="relative mx-auto mb-5 h-14 w-14">

            <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />

            <div className="relative flex h-14 w-14 animate-spin items-center justify-center rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400">
              <span className="text-lg">
                📦
              </span>
            </div>

          </div>

          <p className="animate-pulse text-sm font-bold text-slate-500 dark:text-slate-400">
            Loading purchases...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* =====================================================
          ANIMATION + PRINT STYLES
      ===================================================== */}

      <style>{`
        @keyframes purchaseFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes purchaseScale {
          from {
            opacity: 0;
            transform: scale(0.94);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes purchaseSlide {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes purchaseGlow {
          0%, 100% {
            box-shadow: 0 0 0 rgba(99,102,241,0);
          }

          50% {
            box-shadow: 0 0 28px rgba(99,102,241,0.14);
          }
        }

        .purchase-fade-up {
          animation: purchaseFadeUp 0.55s ease-out both;
        }

        .purchase-scale {
          animation: purchaseScale 0.35s ease-out both;
        }

        .purchase-slide {
          animation: purchaseSlide 0.35s ease-out both;
        }

        .purchase-glow {
          animation: purchaseGlow 2.5s ease-in-out infinite;
        }

        .purchase-row {
          transition:
            transform 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease;
        }

        .purchase-row:hover {
          transform: translateY(-1px);
        }

        .purchase-action {
          transition:
            transform 160ms ease,
            background-color 160ms ease,
            box-shadow 160ms ease;
        }

        .purchase-action:hover {
          transform: translateY(-2px) scale(1.06);
        }

        .purchase-action:active {
          transform: scale(0.94);
        }

        .product-image-hover {
          transition:
            transform 300ms ease,
            box-shadow 300ms ease;
        }

        .product-image-hover:hover {
          transform: scale(1.08) rotate(1deg);
          box-shadow: 0 10px 25px rgba(15,23,42,0.14);
        }

        /* =====================================================
           PRINT
        ===================================================== */

        @media print {

          @page {
            size: A4 landscape;
            margin: 7mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          .dark,
          .dark * {
            background: #ffffff !important;
            color: #111827 !important;
          }

          button,
          input,
          select,
          textarea,
          form,
          nav,
          aside {
            display: none !important;
          }

          .purchase-fade-up,
          .purchase-scale,
          .purchase-slide,
          .purchase-glow {
            animation: none !important;
            transform: none !important;
          }

          .purchase-row {
            transform: none !important;
          }

          .purchase-action {
            display: none !important;
          }

          .overflow-x-auto {
            overflow: visible !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          thead {
            display: table-header-group;
          }

          .purchase-print-hide {
            display: none !important;
          }

          .purchase-print-only {
            display: block !important;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="purchase-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <span className="text-3xl">
              📦
            </span>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Purchase Orders
            </h1>

          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track raw materials, supplier details and purchase costs
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="group flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:-translate-y-1 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/25 active:scale-95"
          >
            <span className="transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110">
              📄
            </span>

            Export Selected PDF (
            {selectedIds.length}
            )
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="group flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-1 hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-600/20 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white"
          >
            <span className="text-lg transition-transform duration-200 group-hover:rotate-90">
              ＋
            </span>

            Add Purchase
          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="purchase-scale flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">

          <span>
            ⚠️ {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-3 rounded-lg px-2 py-1 font-bold transition hover:bg-red-100 hover:scale-110 dark:hover:bg-red-900/40"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="purchase-fade-up flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-indigo-700">

        <span className="text-lg text-slate-400">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search by Product Name, ID or Supplier..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          className="w-full bg-transparent text-sm text-slate-900 caret-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:caret-white"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Clear
          </button>
        )}

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="purchase-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">

        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

          <div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Purchase Statement
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Generated:{" "}
              {new Date().toLocaleDateString(
                "en-IN"
              )}
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-2 text-left dark:bg-slate-800 sm:text-right">

            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Total Entries / Selected
            </p>

            <p className="text-lg font-black text-slate-900 dark:text-white">

              {filteredPurchases.length}

              {" / "}

              <span className="text-red-600">
                {selectedIds.length}
              </span>

            </p>

          </div>

        </div>

        <div className="overflow-hidden">

          <table className="w-full table-fixed text-left text-sm sm:table-auto sm:min-w-[1150px]">

            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">

              <tr>

                <th className="w-10 px-2 py-3 text-center sm:px-4">
                  <input
                    type="checkbox"
                    aria-label="Select all filtered purchases"
                    onChange={handleToggleSelectAll}
                    checked={
                      filteredPurchases.length > 0 &&
                      filteredPurchases.every(
                        (item) =>
                          selectedIds.includes(item._id)
                      )
                    }
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600"
                  />
                </th>

                <th className="px-2 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:px-4">
                  Product
                </th>

                <th className="hidden px-2 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell sm:px-4">
                  Product ID
                </th>

                <th className="hidden px-2 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell sm:px-4">
                  Date
                </th>

                <th className="hidden px-2 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell sm:px-4">
                  Supplier
                </th>

                <th className="px-2 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:px-4">
                  Qty
                </th>

                <th className="hidden px-2 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell sm:px-4">
                  Raw Cost
                </th>

                <th className="px-2 py-3 text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400 sm:px-4">
                  Total Expense
                </th>

                <th className="hidden px-1 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell sm:px-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

              {filteredPurchases.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="px-4 py-20 text-center"
                  >

                    <div className="purchase-scale flex flex-col items-center justify-center">

                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl shadow-inner dark:bg-slate-800">
                        📦
                      </div>

                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        No purchase records found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try another search or add a new purchase entry.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredPurchases.map(
                  (item, index) => {

                    const displayId =
                      getProductDisplayId(item);

                    return (
                      <tr
                        key={item._id}
                        className={`purchase-row ${
                          selectedIds.includes(item._id)
                            ? "bg-indigo-50/60 dark:bg-indigo-950/20"
                            : ""
                        }`}
                        style={{
                          animation:
                            `purchaseSlide 0.35s ease-out ${Math.min(
                              index * 0.035,
                              0.5
                            )}s both`,
                        }}
                      >

                        <td className="px-2 py-3 text-center sm:px-4">

                          <input
                            type="checkbox"
                            aria-label={`Select ${
                              item.productName ||
                              "product"
                            }`}
                            checked={selectedIds.includes(
                              item._id
                            )}
                            onChange={() =>
                              handleToggleSelect(item._id)
                            }
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600"
                          />

                        </td>

                        <td className="min-w-0 px-2 py-3 sm:px-4">

                          <div className="flex min-w-0 items-center gap-2 sm:gap-3">

                            <img
                              src={getPurchaseImage(item)}
                              alt={
                                item.productName ||
                                "Product"
                              }
                              onError={(e) => {
                                e.currentTarget.src =
                                  DEFAULT_IMAGE;
                              }}
                              className="product-image-hover h-9 w-9 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700 sm:h-11 sm:w-11"
                            />

                            <div className="min-w-0">

                              <p className="max-w-[110px] truncate font-bold text-slate-800 dark:text-slate-100">
                                {item.productName}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Entry:{" "}
                                {item._id
                                  ?.slice(-6)
                                  .toUpperCase()}
                              </p>

                            </div>

                          </div>

                        </td>

                        <td className="hidden px-2 py-3 sm:table-cell sm:px-4">

                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {displayId}
                          </span>

                        </td>

                        <td className="hidden px-2 py-3 text-xs font-medium text-slate-600 sm:table-cell sm:px-4 dark:text-slate-400">
                          {item.purchaseDate}
                        </td>

                        <td className="hidden px-2 py-3 font-medium text-slate-700 sm:table-cell sm:px-4 dark:text-slate-300">
                          {item.supplierName}
                        </td>

                        <td className="px-2 py-3 text-center sm:px-4">

                          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs font-black sm:px-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>

                        </td>

                        <td className="hidden px-2 py-3 font-medium text-slate-600 dark:text-slate-400 sm:table-cell sm:px-4">
                          {formatCurrency(item.rawCost)}
                        </td>

                        <td className="px-2 py-3 sm:px-4">

                          <span className="whitespace-nowrap font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(
                              calculateTotalPurchaseCost(item)
                            )}
                          </span>

                          {/* MOBILE ACTIONS */}

                          <div className="mt-2 flex items-center justify-start gap-1 border-t border-slate-100 pt-2 sm:hidden dark:border-slate-800">

                            <button
                              type="button"
                              title="Download PDF"
                              onClick={() =>
                                handlePrintSinglePurchase(item)
                              }
                              disabled={
                                printingId === item._id
                              }
                              className="purchase-action flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                            >

                              {printingId === item._id ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                              ) : (
                                <span>🖨️</span>
                              )}

                            </button>

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                handleOpenEditModal(item)
                              }
                              className="purchase-action flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                handleDelete(item._id)
                              }
                              className="purchase-action flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                            >
                              🗑️
                            </button>

                          </div>

                        </td>

                        <td className="hidden px-1 py-3 sm:table-cell sm:px-4">

                          <div className="flex items-center justify-center gap-0.5 sm:gap-1.5">

                            <button
                              type="button"
                              title="Download PDF"
                              onClick={() =>
                                handlePrintSinglePurchase(item)
                              }
                              disabled={
                                printingId === item._id
                              }
                              className="purchase-action rounded-lg p-1.5 text-red-600 sm:p-2 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            >

                              {printingId === item._id ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                              ) : (
                                <span>🖨️</span>
                              )}

                            </button>

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                handleOpenEditModal(item)
                              }
                              className="purchase-action rounded-lg p-1.5 text-blue-600 sm:p-2 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                handleDelete(item._id)
                              }
                              className="purchase-action rounded-lg p-1.5 text-rose-600 sm:p-2 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
          MODAL
      ===================================================== */}

      {isModalOpen && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          style={{
            animation:
              "purchaseScale 0.25s ease-out both",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >

          <div
            className="purchase-scale max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >

            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">

              <div>

                <div className="flex items-center gap-2">

                  <span className="text-2xl">
                    {editingId ? "✏️" : "📦"}
                  </span>

                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingId
                      ? "Edit Purchase Entry"
                      : "Add Purchase Entry"}
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {editingId
                    ? "Update purchase information"
                    : "Add a new raw material purchase"}
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl font-bold text-slate-400 transition-all duration-200 hover:rotate-90 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div
                  className="relative"
                  ref={dropdownRef}
                >

                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Product *
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                      🔎
                    </span>

                    <input
                      type="text"
                      placeholder="Search product name / ID..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(
                          e.target.value
                        );

                        setIsProductDropdownOpen(
                          true
                        );

                        if (!e.target.value.trim()) {
                          handleSelectProduct(null);
                        }
                      }}
                      onFocus={() =>
                        setIsProductDropdownOpen(true)
                      }
                      disabled={saving}
                      className={`${INPUT_CLASS} pl-10`}
                    />

                  </div>

                  {isProductDropdownOpen && (

                    <div
                      className="absolute left-0 right-0 z-[60] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
                      style={{
                        animation:
                          "purchaseScale 0.18s ease-out both",
                      }}
                    >

                      {filteredModalProducts.length === 0 ? (

                        <div className="px-4 py-5 text-center">

                          <div className="mb-2 text-2xl">
                            🔍
                          </div>

                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            No products found
                          </p>

                        </div>

                      ) : (

                        filteredModalProducts.map(
                          (product) => {

                            const sku =
                              getProductSku(product);

                            const image =
                              getProductImage(product);

                            return (
                              <button
                                type="button"
                                key={product._id}
                                onClick={() =>
                                  handleSelectProduct(
                                    product
                                  )
                                }
                                className="purchase-slide flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:translate-x-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                              >

                                <img
                                  src={
                                    image ||
                                    DEFAULT_IMAGE
                                  }
                                  alt={
                                    product.name ||
                                    "Product"
                                  }
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      DEFAULT_IMAGE;
                                  }}
                                  className="product-image-hover h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                                />

                                <div className="min-w-0 flex-1">

                                  <p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">
                                    {product.name}
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-1.5">

                                    {sku && (
                                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                        ID: {sku}
                                      </span>
                                    )}

                                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                      Stock:{" "}
                                      {Number(
                                        product.stock || 0
                                      ).toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>

                                  </div>

                                </div>

                                <span className="text-slate-300">
                                  →
                                </span>

                              </button>
                            );
                          }
                        )

                      )}

                    </div>

                  )}

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Purchase Date *
                  </label>

                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className={INPUT_CLASS}
                  />

                </div>

              </div>

              {selectedProduct && (

                <div className="purchase-glow overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-4 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-blue-950/20">

                  <div className="flex items-center gap-4">

                    <div className="relative shrink-0">

                      <img
                        src={
                          formData.productImage ||
                          getProductImage(
                            selectedProduct
                          ) ||
                          DEFAULT_IMAGE
                        }
                        alt={selectedProduct.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            DEFAULT_IMAGE;
                        }}
                        className="product-image-hover h-20 w-20 rounded-2xl border-2 border-white object-cover shadow-lg dark:border-slate-800"
                      />

                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white shadow-md">
                        ✓
                      </div>

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-start justify-between gap-2">

                        <div>

                          <p className="truncate text-base font-black text-slate-900 dark:text-white">
                            {selectedProduct.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            Product selected automatically
                          </p>

                        </div>

                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          ✓ Selected
                        </span>

                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">

                        <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                          🆔 {formData.productSku || "N/A"}
                        </span>

                        <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
                          📦 Stock:{" "}
                          {Number(
                            selectedProduct.stock || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        {selectedProduct.purchasePrice !==
                          undefined &&
                          selectedProduct.purchasePrice !==
                            null && (

                            <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400">
                              💰 Purchase:{" "}
                              {formatCurrency(
                                selectedProduct.purchasePrice
                              )}
                            </span>

                          )}

                      </div>

                    </div>

                  </div>

                </div>

              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    readOnly
                    className={`${INPUT_CLASS} cursor-not-allowed bg-slate-100 dark:bg-slate-950`}
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Product ID
                  </label>

                  <input
                    type="text"
                    name="productSku"
                    value={formData.productSku}
                    readOnly
                    placeholder="Auto from product"
                    className={`${INPUT_CLASS} cursor-not-allowed bg-slate-100 font-mono dark:bg-slate-950`}
                  />

                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Supplier Name *
                </label>

                <input
                  type="text"
                  name="supplierName"
                  placeholder="Enter supplier name"
                  value={formData.supplierName}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className={INPUT_CLASS}
                />

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Purchase Cost / Unit (₹) *
                  </label>

                  <input
                    type="number"
                    name="rawCost"
                    placeholder="250"
                    min="0.01"
                    step="0.01"
                    value={formData.rawCost}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className={INPUT_CLASS}
                  />

                  {selectedProduct && (
                    <p className="mt-1.5 text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
                      ✓ Auto-filled from product purchase price
                    </p>
                  )}

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    placeholder="1"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className={INPUT_CLASS}
                  />

                </div>

              </div>

              {Number(formData.rawCost) > 0 &&
                Number(formData.quantity) > 0 && (

                  <div className="purchase-scale rounded-2xl border border-indigo-100 bg-gradient-to-r from-slate-50 to-indigo-50 p-4 dark:border-indigo-900/40 dark:from-slate-950 dark:to-indigo-950/20">

                    <div className="flex items-center justify-between">

                      <div>

                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Total Purchase Expense
                        </span>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatCurrency(
                            Number(formData.rawCost)
                          )}{" "}
                          ×{" "}
                          {Number(
                            formData.quantity
                          ).toLocaleString("en-IN")}{" "}
                          Units
                        </p>

                      </div>

                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(
                          Number(formData.rawCost) *
                            Number(formData.quantity)
                        )}
                      </span>

                    </div>

                  </div>

                )}

              <div>

                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Purchase Image
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageFileChange}
                  disabled={saving}
                  className={FILE_INPUT_CLASS}
                />

                {formData.productImage && (

                  <div className="purchase-scale mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">

                    <img
                      src={formData.productImage}
                      alt="Product preview"
                      onError={(e) => {
                        e.currentTarget.src =
                          DEFAULT_IMAGE;
                      }}
                      className="product-image-hover h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                    />

                    <div className="min-w-0 flex-1">

                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Product Image
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Automatically loaded from product
                        {formData.imageFile
                          ? " or replaced with uploaded image"
                          : ""}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={saving}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 hover:scale-105 disabled:opacity-50 dark:hover:bg-rose-950/30"
                    >
                      Remove
                    </button>

                  </div>

                )}

                <p className="mt-1.5 text-[10px] text-slate-400">
                  JPG, JPEG, PNG or WEBP • Maximum 5 MB
                </p>

              </div>

              {selectedProduct && (

                <div className="purchase-glow rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-green-950/20">

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <p className="text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Stock After Purchase
                      </p>

                      <p className="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
                        Backend automatically updates Product stock.
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">

                        {(
                          Number(
                            selectedProduct.stock || 0
                          ) +
                          Number(
                            formData.quantity || 0
                          )
                        ).toLocaleString("en-IN")}

                      </p>

                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
                        Units
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {error && (

                <div className="purchase-scale rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  ⚠️ {error}
                </div>

              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    products.length === 0
                  }
                  className="group flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-600/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white"
                >

                  {saving ? (

                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-400/30 dark:border-t-slate-900" />

                      Saving...
                    </>

                  ) : (

                    <>
                      <span className="transition-transform duration-200 group-hover:scale-110">
                        {editingId ? "✓" : "＋"}
                      </span>

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

    </div>
  );
};

export default PurchasePage;

