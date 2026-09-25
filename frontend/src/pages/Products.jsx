import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

// =====================================================
// PRODUCTS
// =====================================================

const Products = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] =
    useState("all");

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      const result = response.data;

      if (Array.isArray(result)) {
        setProducts(result);
      } else if (
        Array.isArray(result?.products)
      ) {
        setProducts(result.products);
      } else if (
        Array.isArray(result?.data)
      ) {
        setProducts(result.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("PRODUCTS ERROR:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    const baseURL =
      api.defaults.baseURL?.replace(
        /\/api\/?$/,
        ""
      ) || "";

    const imagePath = image.startsWith("/")
      ? image
      : `/${image}`;

    return `${baseURL}${imagePath}`;
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/products/${id}`);

      setProducts((prev) =>
        prev.filter(
          (product) => product._id !== id
        )
      );
    } catch (err) {
      console.error("DELETE ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = products.filter(
    (product) => {
      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        !searchText ||
        product.name
          ?.toLowerCase()
          .includes(searchText) ||
        product.sku
          ?.toLowerCase()
          .includes(searchText) ||
        product.hsnCode
          ?.toString()
          .toLowerCase()
          .includes(searchText) ||
        product.category
          ?.toLowerCase()
          .includes(searchText) ||
        product.size
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "all" ||
        product.category === category;

      const stock = Number(
        product.stock || 0
      );

      const minimumStock = Number(
        product.minimumStock || 5
      );

      let matchesStock = true;

      if (stockFilter === "in-stock") {
        matchesStock =
          stock > minimumStock;
      }

      if (stockFilter === "low-stock") {
        matchesStock =
          stock > 0 &&
          stock <= minimumStock;
      }

      if (stockFilter === "out-of-stock") {
        matchesStock = stock === 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    }
  );

  // =====================================================
  // LOADER
  // =====================================================

  if (loading) {
    return (
      <div className="w-full space-y-5 overflow-x-hidden animate-in fade-in duration-300">

        <div className="animate-pulse">

          {/* HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <div className="h-7 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />

              <div className="mt-2 h-3 w-64 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <div className="h-10 flex-1 rounded-xl bg-slate-200 sm:w-20 sm:flex-none dark:bg-slate-800" />

              <div className="h-10 flex-1 rounded-xl bg-slate-200 sm:w-28 sm:flex-none dark:bg-slate-800" />
            </div>

          </div>

          {/* SUMMARY */}

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              )
            )}

          </div>

          {/* FILTERS */}

          <div className="mt-5 h-32 rounded-2xl bg-slate-200 sm:h-16 dark:bg-slate-800" />

          {/* TABLE */}

          <div className="mt-5 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">

            <div className="h-12 border-b border-slate-300 dark:border-slate-700" />

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-16 border-b border-slate-300 dark:border-slate-700"
                />
              )
            )}

          </div>

          {/* LOADING */}

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">

            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

            <span
              className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
              style={{
                animationDelay: "120ms",
              }}
            />

            <span
              className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
              style={{
                animationDelay: "240ms",
              }}
            />

            Loading products...

          </div>

        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lg dark:bg-red-950/50">
            ⚠️
          </div>

          <h2 className="mt-3 text-base font-black text-red-800 dark:text-red-300">
            Products could not load
          </h2>

          <p className="mt-1 break-words text-sm text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchProducts}
            className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg active:translate-y-0 sm:w-auto"
          >
            ↻ Try Again
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="w-full space-y-5 overflow-x-hidden animate-in fade-in slide-in-from-bottom-3 duration-700">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm text-white shadow-sm transition-transform duration-300 hover:rotate-6 hover:scale-110 dark:bg-white dark:text-slate-950">
              📦
            </span>

            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Products
            </h1>

          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage your inventory and products.
          </p>

        </div>

        {/* HEADER BUTTONS */}

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">

          <button
            type="button"
            onClick={fetchProducts}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/products/add")
            }
            className="rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg active:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            + Add Product
          </button>

        </div>

      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <SummaryCard
          title="Total"
          value={products.length}
          icon="📦"
        />

        <SummaryCard
          title="In Stock"
          value={
            products.filter(
              (p) =>
                Number(p.stock || 0) >
                Number(
                  p.minimumStock || 5
                )
            ).length
          }
          icon="✅"
        />

        <SummaryCard
          title="Low Stock"
          value={
            products.filter((p) => {
              const stock = Number(
                p.stock || 0
              );

              const minimum = Number(
                p.minimumStock || 5
              );

              return (
                stock > 0 &&
                stock <= minimum
              );
            }).length
          }
          icon="⚠️"
        />

        <SummaryCard
          title="Out of Stock"
          value={
            products.filter(
              (p) =>
                Number(p.stock || 0) === 0
            ).length
          }
          icon="🚫"
        />

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">

          {/* SEARCH */}

          <div className="group relative">

            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 transition-colors group-focus-within:text-slate-700 dark:group-focus-within:text-white">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search name, SKU, HSN, size..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium outline-none transition-all duration-200 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:bg-slate-800 dark:focus:ring-white/10"
            />

          </div>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}

          </select>

          {/* STOCK */}

          <select
            value={stockFilter}
            onChange={(e) =>
              setStockFilter(e.target.value)
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
          >
            <option value="all">
              All Stock
            </option>

            <option value="in-stock">
              In Stock
            </option>

            <option value="low-stock">
              Low Stock
            </option>

            <option value="out-of-stock">
              Out of Stock
            </option>

          </select>

        </div>
      </div>

      {/* =================================================
          PRODUCT LIST
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

        {/* LIST HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">

          <div className="min-w-0">

            <h2 className="text-sm font-black">
              Product List
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              {filteredProducts.length} products found
            </p>

          </div>

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredProducts.length === 0 ? (

          <div className="px-5 py-14 text-center animate-in fade-in duration-500">

            <div className="text-4xl transition-transform duration-500 hover:scale-110">
              📦
            </div>

            <h3 className="mt-3 text-base font-black">
              No products found
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/products/add")
              }
              className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-slate-950"
            >
              + Add Product
            </button>

          </div>

        ) : (

          <>
            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1100px]">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Product
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      SKU
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      HSN Code
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Category
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Size
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Purchase
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Selling
                    </th>

                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Stock
                    </th>

                    <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                  {filteredProducts.map(
                    (product, index) => (
                      <ProductTableRow
                        key={product._id}
                        product={product}
                        index={index}
                        imageUrl={getImageUrl(
                          product.image
                        )}
                        onView={() =>
                          navigate(
                            `/products/${product._id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/products/edit/${product._id}`
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            product._id
                          )
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* =================================================
                MOBILE PRODUCT CARDS
            ================================================= */}

            <div className="block divide-y divide-slate-100 md:hidden dark:divide-slate-800">

              {filteredProducts.map(
                (product, index) => (
                  <ProductMobileCard
                    key={product._id}
                    product={product}
                    index={index}
                    imageUrl={getImageUrl(
                      product.image
                    )}
                    onView={() =>
                      navigate(
                        `/products/${product._id}`
                      )
                    }
                    onEdit={() =>
                      navigate(
                        `/products/edit/${product._id}`
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        product._id
                      )
                    }
                  />
                )
              )}

            </div>
          </>
        )}

      </div>

    </div>
  );
};

// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">

      <div className="flex min-w-0 items-center justify-between gap-2">

        <div className="min-w-0">

          <p className="truncate text-[11px] font-bold text-slate-400">
            {title}
          </p>

          <p className="mt-0.5 text-xl font-black tracking-tight">
            {Number(value || 0).toLocaleString(
              "en-IN"
            )}
          </p>

        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 dark:bg-slate-800">
          {icon}
        </div>

      </div>

    </div>
  );
};

// =====================================================
// PRODUCT TABLE ROW
// =====================================================

const ProductTableRow = ({
  product,
  imageUrl,
  onView,
  onEdit,
  onDelete,
  index,
}) => {
  const [imageError, setImageError] =
    useState(false);

  const stock = Number(
    product.stock || 0
  );

  const minimumStock = Number(
    product.minimumStock || 5
  );

  const getStockStatus = () => {
    if (stock === 0) {
      return {
        label: "Out",
        className:
          "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
      };
    }

    if (stock <= minimumStock) {
      return {
        label: "Low",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    };
  };

  const status = getStockStatus();

  const productSize =
    product.size &&
    String(product.size).trim()
      ? String(product.size).trim()
      : "--";

  const productHSN =
    product.hsnCode !== undefined &&
    product.hsnCode !== null &&
    String(product.hsnCode).trim()
      ? String(product.hsnCode).trim()
      : "--";

  return (
    <tr
      className="group animate-in fade-in slide-in-from-bottom-1 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
      style={{
        animationDelay: `${Math.min(
          index * 40,
          400
        )}ms`,
      }}
    >

      {/* PRODUCT */}

      <td className="px-4 py-3">

        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-2.5 text-left"
        >

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md dark:bg-slate-800">

            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={
                  product.name ||
                  "Product"
                }
                onError={() =>
                  setImageError(true)
                }
                className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <span className="text-lg">
                📦
              </span>
            )}

          </div>

          <div className="min-w-0">

            <p className="max-w-[190px] truncate text-xs font-black transition-colors duration-200 group-hover:text-slate-700 dark:group-hover:text-white">
              {product.name ||
                "Unnamed Product"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Product
            </p>

          </div>

        </button>

      </td>

      {/* SKU */}

      <td className="px-4 py-3">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {product.sku || "-"}
        </span>
      </td>

      {/* HSN */}

      <td className="px-4 py-3">

        <span
          className={
            productHSN === "--"
              ? "text-xs font-semibold text-slate-400"
              : "rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
          }
        >
          {productHSN}
        </span>

      </td>

      {/* CATEGORY */}

      <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {product.category || "-"}
      </td>

      {/* SIZE */}

      <td className="px-4 py-3">

        <span
          className={
            productSize === "--"
              ? "text-xs font-semibold text-slate-400"
              : "whitespace-nowrap text-xs font-black text-slate-700 dark:text-slate-200"
          }
        >
          {productSize}
        </span>

      </td>

      {/* PURCHASE */}

      <td className="px-4 py-3 text-xs font-bold">
        ₹
        {Number(
          product.purchasePrice || 0
        ).toLocaleString("en-IN")}
      </td>

      {/* SELLING */}

      <td className="px-4 py-3 text-xs font-black">
        ₹
        {Number(
          product.sellingPrice || 0
        ).toLocaleString("en-IN")}
      </td>

      {/* STOCK */}

      <td className="px-4 py-3">

        <div className="flex flex-col items-start gap-1">

          <span className="text-xs font-black">
            {stock}
          </span>

          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-transform duration-200 group-hover:scale-105 ${status.className}`}
          >
            {status.label}
          </span>

        </div>

      </td>

      {/* ACTION */}

      <td className="px-4 py-3">

        <div className="flex justify-end gap-1.5">

          <button
            type="button"
            onClick={onView}
            title="View"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm active:translate-y-0 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            👁️
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm active:translate-y-0 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ✏️
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-xs text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0 dark:border-red-900/50 dark:hover:bg-red-950/30"
          >
            🗑️
          </button>

        </div>

      </td>

    </tr>
  );
};

// =====================================================
// MOBILE PRODUCT CARD
// =====================================================

const ProductMobileCard = ({
  product,
  imageUrl,
  onView,
  onEdit,
  onDelete,
  index,
}) => {
  const [imageError, setImageError] =
    useState(false);

  const stock = Number(
    product.stock || 0
  );

  const minimumStock = Number(
    product.minimumStock || 5
  );

  let status = {
    label: "In Stock",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  };

  if (stock === 0) {
    status = {
      label: "Out of Stock",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    };
  } else if (stock <= minimumStock) {
    status = {
      label: "Low Stock",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    };
  }

  const productSize =
    product.size &&
    String(product.size).trim()
      ? String(product.size).trim()
      : "--";

  const productHSN =
    product.hsnCode !== undefined &&
    product.hsnCode !== null &&
    String(product.hsnCode).trim()
      ? String(product.hsnCode).trim()
      : "--";

  return (
    <div
      className="w-full p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        animationDelay: `${Math.min(
          index * 50,
          400
        )}ms`,
      }}
    >

      {/* =================================================
          PRODUCT HEADER
      ================================================= */}

      <div className="flex min-w-0 items-start gap-3">

        {/* IMAGE */}

        <button
          type="button"
          onClick={onView}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 shadow-sm transition-all duration-300 hover:scale-105 dark:bg-slate-800"
        >

          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={
                product.name ||
                "Product"
              }
              onError={() =>
                setImageError(true)
              }
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-2xl">
              📦
            </span>
          )}

        </button>

        {/* PRODUCT INFO */}

        <div className="min-w-0 flex-1">

          <div className="flex min-w-0 items-start justify-between gap-2">

            <div className="min-w-0 flex-1">

              <button
                type="button"
                onClick={onView}
                className="block max-w-full text-left"
              >
                <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">
                  {product.name ||
                    "Unnamed Product"}
                </h3>
              </button>

              <p className="mt-1 truncate text-[10px] text-slate-400">
                SKU:{" "}
                {product.sku || "-"}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                {product.category ||
                  "No Category"}
              </p>

            </div>

            {/* STATUS */}

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${status.className}`}
            >
              {status.label}
            </span>

          </div>

        </div>

      </div>

      {/* =================================================
          PRODUCT INFORMATION
      ================================================= */}

      <div className="mt-4 grid grid-cols-2 gap-2">

        {/* HSN */}

        <MobileInfoBox
          label="HSN Code"
          value={productHSN}
        />

        {/* SIZE */}

        <MobileInfoBox
          label="Size"
          value={productSize}
        />

      </div>

      {/* =================================================
          PRICE / STOCK
      ================================================= */}

      <div className="mt-2 grid grid-cols-3 gap-2">

        <MobileInfoBox
          label="Purchase"
          value={`₹${Number(
            product.purchasePrice || 0
          ).toLocaleString("en-IN")}`}
        />

        <MobileInfoBox
          label="Selling"
          value={`₹${Number(
            product.sellingPrice || 0
          ).toLocaleString("en-IN")}`}
        />

        <MobileInfoBox
          label="Stock"
          value={stock}
        />

      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="mt-3 grid grid-cols-3 gap-2">

        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-[11px] font-bold text-slate-700 transition-all duration-200 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          👁️ View
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-[11px] font-bold text-slate-700 transition-all duration-200 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          ✏️ Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 bg-red-50 px-2 py-2.5 text-[11px] font-bold text-red-600 transition-all duration-200 active:scale-95 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
        >
          🗑️ Delete
        </button>

      </div>

    </div>
  );
};

// =====================================================
// MOBILE INFO BOX
// =====================================================

const MobileInfoBox = ({
  label,
  value,
}) => {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/60">

      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-slate-800 dark:text-slate-100">
        {value}
      </p>

    </div>
  );
};

export default Products;