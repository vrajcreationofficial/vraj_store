import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // IMAGE URL
  // ==========================================

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    const imagePath = image.trim();

    const path = imagePath.startsWith("/")
      ? imagePath
      : `/${imagePath}`;

    const baseURL =
  api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
  "https://vraj-store.onrender.com";

    return `${baseURL}${path}`;
  };

  // ==========================================
  // SIZE FORMAT
  // ==========================================

  const getProductSize = (product) => {
    if (!product) return "—";

    // ------------------------------------------
    // 1. Already saved final size
    // Example: 10 × 5 × 3 cm
    // ------------------------------------------

    if (
      product.size &&
      String(product.size).trim()
    ) {
      return String(product.size).trim();
    }

    // ------------------------------------------
    // 2. New dimension fields
    // ------------------------------------------

    const length =
      product.length ??
      product.sizeLength ??
      "";

    const breadth =
      product.breadth ??
      product.sizeBreadth ??
      "";

    const height =
      product.height ??
      product.sizeHeight ??
      "";

    const sizeUnit =
      product.sizeUnit || "cm";

    if (
      length !== "" &&
      breadth !== "" &&
      height !== ""
    ) {
      return `${length} × ${breadth} × ${height} ${sizeUnit}`;
    }

    return "—";
  };

  // ==========================================
  // FETCH PRODUCT
  // ==========================================

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/products/${id}`);

      const productData = response.data?.product;

      if (!productData) {
        setError("Product not found.");
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error(
        "PRODUCT DETAILS ERROR:",
        error
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        error.response?.data?.message ||
          "Failed to load product"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD PRODUCT
  // ==========================================

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // ==========================================
  // STOCK STATUS
  // ==========================================

  const getStockStatus = () => {
    if (!product) return null;

    const stock = Number(
      product.stock || 0
    );

    const minimum = Number(
      product.minimumStock || 5
    );

    if (stock === 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-50 text-red-700 border-red-200",
      };
    }

    if (stock <= minimum) {
      return {
        label: "Low Stock",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading product...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl py-10">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <div className="text-5xl">
            ❌
          </div>

          <h2 className="mt-4 text-xl font-bold text-red-800">
            Product Not Found
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error ||
              "This product does not exist."}
          </p>

          <button
            onClick={() =>
              navigate("/products")
            }
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ← Back to Products
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const stockStatus =
    getStockStatus();

  const productSize =
    getProductSize(product);

  const purchasePrice = Number(
    product.purchasePrice || 0
  );

  const sellingPrice = Number(
    product.sellingPrice || 0
  );

  const profit =
    sellingPrice - purchasePrice;

  const profitMargin =
    purchasePrice > 0
      ? (
          (profit / purchasePrice) *
          100
        ).toFixed(1)
      : "0";

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            Inventory / Product
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
            {product.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            SKU: {product.sku}
          </p>

        </div>

        <div className="flex gap-2">

          <button
            onClick={() =>
              navigate("/products")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </button>

          <button
            onClick={() =>
              navigate(`/products/edit/${product._id}`)
            }
            className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ✏️ Edit
          </button>

        </div>

      </div>

      {/* =====================================
          MAIN GRID
      ====================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* ===================================
            PRODUCT IMAGE
        ==================================== */}

        <div className="lg:col-span-2">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex min-h-[400px] items-center justify-center bg-slate-50 p-6">

              {product.image ? (
                <img
                  src={getImageUrl(
                    product.image
                  )}
                  alt={product.name}
                  className="max-h-[380px] w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="text-center">

                  <div className="text-7xl">
                    📦
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-400">
                    No product image
                  </p>

                </div>
              )}

            </div>

            {/* PRODUCT STATUS */}

            <div className="border-t border-slate-200 p-5">

              <div className="flex items-center justify-between">

                <span className="text-sm font-semibold text-slate-500">
                  Product Status
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    product.status ===
                    "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {product.status ===
                  "active"
                    ? "● Active"
                    : "● Inactive"}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================
            PRODUCT DETAILS
        ==================================== */}

        <div className="space-y-6 lg:col-span-3">

          {/* =================================
              BASIC INFORMATION
          ================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="font-bold text-slate-950">
                Product Information
              </h2>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

              <Info
                label="Product Name"
                value={product.name}
              />

              <Info
                label="SKU"
                value={product.sku}
              />

              <Info
                label="Category"
                value={product.category}
              />

              <Info
                label="Subcategory"
                value={
                  product.subcategory ||
                  "—"
                }
              />

              <Info
                label="Supplier"
                value={
                  product.supplier ||
                  "—"
                }
              />

              {/* SIZE */}

              <Info
                label="Product Size"
                value={productSize}
              />

              <Info
                label="Status"
                value={
                  product.status ===
                  "active"
                    ? "Active"
                    : "Inactive"
                }
              />

            </div>

          </div>

          {/* =================================
              PRICING
          ================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="font-bold text-slate-950">
                Pricing
              </h2>

            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">

              <PriceCard
                title="Purchase Price"
                value={
                  product.purchasePrice
                }
              />

              <PriceCard
                title="Selling Price"
                value={
                  product.sellingPrice
                }
              />

              {/* PROFIT */}

              <div className="rounded-xl bg-emerald-50 p-4">

                <p className="text-xs font-semibold text-emerald-600">
                  Profit
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-700">
                  ₹
                  {profit.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p className="mt-1 text-xs font-medium text-emerald-600">
                  {profitMargin}% margin
                </p>

              </div>

            </div>

          </div>

          {/* =================================
              INVENTORY
          ================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="font-bold text-slate-950">
                Inventory
              </h2>

            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">

              {/* CURRENT STOCK */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-500">
                  Current Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {Number(
                    product.stock || 0
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Units
                </p>

              </div>

              {/* MINIMUM STOCK */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-500">
                  Minimum Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {Number(
                    product.minimumStock || 0
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Reorder level
                </p>

              </div>

              {/* STOCK STATUS */}

              <div className="rounded-xl p-4">

                <p className="text-xs font-semibold text-slate-500">
                  Stock Status
                </p>

                <span
                  className={`mt-3 inline-block rounded-full border px-3 py-1.5 text-xs font-bold ${stockStatus.className}`}
                >
                  {stockStatus.label}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          DESCRIPTION
      ====================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <h2 className="font-bold text-slate-950">
            Description
          </h2>

        </div>

        <div className="p-6">

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {product.description ||
              "No description available."}
          </p>

        </div>

      </div>

      {/* =====================================
          CREATED / UPDATED
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2">

        {/* CREATED */}

        <div className="rounded-xl border border-slate-200 bg-white p-4">

          <p className="text-xs font-semibold text-slate-400">
            Created
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">

            {product.createdAt
              ? new Date(
                  product.createdAt
                ).toLocaleString(
                  "en-IN"
                )
              : "—"}

          </p>

        </div>

        {/* UPDATED */}

        <div className="rounded-xl border border-slate-200 bg-white p-4">

          <p className="text-xs font-semibold text-slate-400">
            Last Updated
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">

            {product.updatedAt
              ? new Date(
                  product.updatedAt
                ).toLocaleString(
                  "en-IN"
                )
              : "—"}

          </p>

        </div>

      </div>

    </div>
  );
};

// ==========================================
// INFO COMPONENT
// ==========================================

const Info = ({
  label,
  value,
}) => {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          value === "—"
            ? "text-slate-400"
            : "text-slate-800"
        }`}
      >
        {value || "—"}
      </p>

    </div>
  );
};

// ==========================================
// PRICE CARD
// ==========================================

const PriceCard = ({
  title,
  value,
}) => {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        ₹
        {Number(
          value || 0
        ).toLocaleString("en-IN")}
      </p>

    </div>
  );
};

export default ProductView;