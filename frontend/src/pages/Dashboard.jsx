import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";

import api from "../services/api";

// =====================================================
// DEFAULT IMAGE
// =====================================================

const DEFAULT_IMAGE =
  "https://via.placeholder.com/80";

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const pageVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 25,
    scale: 0.97,
  },

  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

const rowVariants = {
  hidden: {
    opacity: 0,
    x: -12,
  },

  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// =====================================================
// DASHBOARD
// =====================================================

const Dashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          console.warn(
            "Dashboard: Authentication token not found."
          );

          setProducts([]);

          navigate("/login", {
            replace: true,
          });

          return;
        }

        const response = await api.get("/products");

        const data = response?.data;

        let productList = [];

        if (Array.isArray(data)) {
          productList = data;
        } else if (Array.isArray(data?.products)) {
          productList = data.products;
        } else if (Array.isArray(data?.data)) {
          productList = data.data;
        }

        setProducts(productList);
      } catch (err) {
        console.error("Dashboard Error:", err);

        if (err?.response?.status === 401) {
          setProducts([]);

          setError(
            "Your session has expired. Please login again."
          );

          return;
        }

        setError(
          err?.response?.data?.message ||
            "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {
    const handleInventoryUpdate = () => {
      fetchProducts(true);
    };

    window.addEventListener(
      "inventory-updated",
      handleInventoryUpdate
    );

    return () => {
      window.removeEventListener(
        "inventory-updated",
        handleInventoryUpdate
      );
    };
  }, [fetchProducts]);

  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inventoryValue = 0;
    let sellingValue = 0;

    products.forEach((product) => {
      const stock = Number(product?.stock || 0);

      const minimumStock = Number(
        product?.minimumStock || 5
      );

      const purchasePrice = Number(
        product?.purchasePrice || 0
      );

      const sellingPrice = Number(
        product?.sellingPrice || 0
      );

      totalStock += stock;

      if (stock === 0) {
        outOfStock++;
      } else if (stock <= minimumStock) {
        lowStock++;
      }

      inventoryValue +=
        purchasePrice * stock;

      sellingValue +=
        sellingPrice * stock;
    });

    return {
      totalProducts: products.length,
      totalStock,
      lowStock,
      outOfStock,
      inventoryValue,
      sellingValue,
      potentialMargin:
        sellingValue - inventoryValue,
    };
  }, [products]);

  // =====================================================
  // RECENT PRODUCTS
  // =====================================================

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        return (
          new Date(
            b?.createdAt || 0
          ).getTime() -
          new Date(
            a?.createdAt || 0
          ).getTime()
        );
      })
      .slice(0, 8);
  }, [products]);

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) {
      return DEFAULT_IMAGE;
    }

    if (typeof image !== "string") {
      return DEFAULT_IMAGE;
    }

    const cleanImage = image.trim();

    if (!cleanImage) {
      return DEFAULT_IMAGE;
    }

    return cleanImage;
  };

  // =====================================================
  // STOCK STATUS
  // =====================================================

  const getStockStatus = (product) => {
    const stock = Number(
      product?.stock || 0
    );

    const minimumStock = Number(
      product?.minimumStock || 5
    );

    if (stock === 0) {
      return {
        text: "Out of Stock",

        className:
          "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      };
    }

    if (stock <= minimumStock) {
      return {
        text: "Low Stock",

        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      };
    }

    return {
      text: "In Stock",

      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    };
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    fetchProducts(true);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-slate-50 p-3 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">

          {/* HEADER SKELETON */}

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="h-8 w-44 max-w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

              <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 sm:w-28 dark:bg-slate-800" />
          </div>

          {/* STATS SKELETON */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-3.5 w-20 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

                  <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

                  <div className="mt-3 h-3 w-24 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </motion.div>
              )
            )}
          </div>

          {/* FINANCIAL SKELETON */}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

                  <div className="mt-3 h-7 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

                  <div className="mt-3 h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              )
            )}
          </div>

          {/* LOADING MESSAGE */}

          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative h-11 w-11">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />

              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-slate-800 dark:border-t-white" />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading dashboard...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching latest inventory data
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen w-full overflow-x-hidden bg-slate-50 p-3 transition-colors sm:p-6 lg:p-8 dark:bg-slate-950"
    >
      <div className="mx-auto w-full max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <motion.h1
              initial={{
                opacity: 0,
                x: -15,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.5,
              }}
              className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              Dashboard
            </motion.h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Vraj Creation inventory overview
            </p>
          </div>

          <motion.button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.96,
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5 dark:bg-white dark:text-slate-900"
          >
            {refreshing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900" />

                Refreshing...
              </>
            ) : (
              <>
                <span className="text-base">
                  ↻
                </span>

                Refresh
              </>
            )}
          </motion.button>
        </motion.div>

        {/* =================================================
            ERROR
        ================================================= */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -15,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -10,
                height: 0,
              }}
              className="mb-5 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="leading-5">
                  {error}
                </span>

                {error.includes("session") && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login", {
                        replace: true,
                      })
                    }
                    className="w-full rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 sm:w-auto"
                  >
                    Login Again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            MAIN STATS
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
        >

          {/* TOTAL PRODUCTS */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Total Products
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <motion.h2
                key={stats.totalProducts}
                initial={{
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
              >
                {stats.totalProducts}
              </motion.h2>

              <motion.div
                whileHover={{
                  rotate: 8,
                  scale: 1.1,
                }}
                className="shrink-0 rounded-xl bg-blue-100 px-2.5 py-1.5 text-lg sm:px-3 sm:py-2 sm:text-xl dark:bg-blue-500/10"
              >
                📦
              </motion.div>
            </div>

            <p className="mt-2 truncate text-[10px] text-slate-400 sm:mt-3 sm:text-xs">
              Products in catalog
            </p>
          </motion.div>

          {/* TOTAL STOCK */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Total Stock
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <motion.h2
                key={stats.totalStock}
                initial={{
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
              >
                {stats.totalStock}
              </motion.h2>

              <motion.div
                whileHover={{
                  rotate: -8,
                  scale: 1.1,
                }}
                className="shrink-0 rounded-xl bg-indigo-100 px-2.5 py-1.5 text-lg sm:px-3 sm:py-2 sm:text-xl dark:bg-indigo-500/10"
              >
                🏷️
              </motion.div>
            </div>

            <p className="mt-2 truncate text-[10px] text-slate-400 sm:mt-3 sm:text-xs">
              Available quantity
            </p>
          </motion.div>

          {/* LOW STOCK */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Low Stock
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <motion.h2
                key={stats.lowStock}
                initial={{
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
              >
                {stats.lowStock}
              </motion.h2>

              <motion.div
                animate={
                  stats.lowStock > 0
                    ? {
                        rotate: [0, -8, 8, 0],
                      }
                    : {}
                }
                transition={{
                  repeat:
                    stats.lowStock > 0
                      ? Infinity
                      : 0,
                  repeatDelay: 3,
                  duration: 0.5,
                }}
                className="shrink-0 rounded-xl bg-amber-100 px-2.5 py-1.5 text-lg sm:px-3 sm:py-2 sm:text-xl dark:bg-amber-500/10"
              >
                ⚠️
              </motion.div>
            </div>

            <p className="mt-2 truncate text-[10px] text-amber-600 sm:mt-3 sm:text-xs dark:text-amber-400">
              Needs attention
            </p>
          </motion.div>

          {/* OUT OF STOCK */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -5,
              scale: 1.015,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Out of Stock
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <motion.h2
                key={stats.outOfStock}
                initial={{
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
              >
                {stats.outOfStock}
              </motion.h2>

              <motion.div
                whileHover={{
                  rotate: 10,
                  scale: 1.1,
                }}
                className="shrink-0 rounded-xl bg-red-100 px-2.5 py-1.5 text-lg sm:px-3 sm:py-2 sm:text-xl dark:bg-red-500/10"
              >
                ❌
              </motion.div>
            </div>

            <p className="mt-2 truncate text-[10px] text-red-600 sm:mt-3 sm:text-xs dark:text-red-400">
              Currently unavailable
            </p>
          </motion.div>
        </motion.div>

        {/* =================================================
            FINANCIAL SUMMARY
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4"
        >

          {/* INVENTORY VALUE */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -4,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Inventory Value
            </p>

            <motion.h2
              key={stats.inventoryValue}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl dark:text-white"
            >
              {formatCurrency(
                stats.inventoryValue
              )}
            </motion.h2>

            <p className="mt-2 text-[10px] text-slate-400 sm:text-xs">
              Purchase price × stock
            </p>
          </motion.div>

          {/* SELLING VALUE */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -4,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Selling Value
            </p>

            <motion.h2
              key={stats.sellingValue}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl dark:text-white"
            >
              {formatCurrency(
                stats.sellingValue
              )}
            </motion.h2>

            <p className="mt-2 text-[10px] text-slate-400 sm:text-xs">
              Selling price × stock
            </p>
          </motion.div>

          {/* POTENTIAL MARGIN */}

          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -4,
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Potential Margin
            </p>

            <motion.h2
              key={stats.potentialMargin}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className={`mt-2 break-words text-xl font-bold sm:text-2xl ${
                stats.potentialMargin >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(
                stats.potentialMargin
              )}
            </motion.h2>

            <p className="mt-2 text-[10px] text-slate-400 sm:text-xs">
              Selling value − inventory value
            </p>
          </motion.div>
        </motion.div>

        {/* =================================================
            RECENT PRODUCTS
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-6 dark:border-slate-800 dark:bg-slate-900"
        >

          {/* HEADER */}

          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-slate-800">

            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Recent Products
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                Latest products added to inventory
              </p>
            </div>

            <motion.button
              type="button"
              onClick={() =>
                navigate("/products")
              }
              whileHover={{
                scale: 1.03,
                x: 2,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              View All ({products.length})
            </motion.button>
          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">

                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    SKU
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Purchase
                  </th>

                  <th className="px-5 py-4">
                    Selling
                  </th>

                  <th className="px-5 py-4">
                    Stock
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>

                {recentProducts.length === 0 ? (
                  <motion.tr
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                  >
                    <td
                      colSpan="8"
                      className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No products found.
                    </td>
                  </motion.tr>
                ) : (
                  recentProducts.map(
                    (product, index) => {
                      const status =
                        getStockStatus(
                          product
                        );

                      return (
                        <motion.tr
                          key={
                            product?._id ||
                            product?.id ||
                            index
                          }
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{
                            delay:
                              index * 0.05,
                          }}
                          whileHover={{
                            backgroundColor:
                              "rgba(148,163,184,0.08)",
                          }}
                          className="border-b border-slate-100 dark:border-slate-800"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <motion.div
                                whileHover={{
                                  scale: 1.08,
                                }}
                                className="shrink-0"
                              >
                                <img
                                  src={getImageUrl(
                                    product?.image
                                  )}
                                  alt={
                                    product?.name ||
                                    "Product"
                                  }
                                  className="h-12 w-12 rounded-xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.src =
                                      DEFAULT_IMAGE;
                                  }}
                                />
                              </motion.div>

                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                                  {product?.name ||
                                    "Unnamed Product"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {product?.subcategory ||
                                    "Handicraft"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {product?.sku || "-"}
                            </span>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {product?.category || "-"}
                          </td>

                          {/* PURCHASE */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(
                              product?.purchasePrice
                            )}
                          </td>

                          {/* SELLING */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(
                              product?.sellingPrice
                            )}
                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {Number(
                                product?.stock ||
                                  0
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <motion.span
                              whileHover={{
                                scale: 1.05,
                              }}
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                            >
                              {status.text}
                            </motion.span>
                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(
                              product?.createdAt
                            )}
                          </td>

                        </motion.tr>
                      );
                    }
                  )
                )}

              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE PRODUCTS
          ================================================= */}

          <div className="block md:hidden">

            {recentProducts.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No products found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">

                {recentProducts.map(
                  (product, index) => {
                    const status =
                      getStockStatus(
                        product
                      );

                    return (
                      <motion.div
                        key={
                          product?._id ||
                          product?.id ||
                          index
                        }
                        initial={{
                          opacity: 0,
                          y: 15,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index * 0.06,
                        }}
                        className="w-full p-4"
                      >

                        {/* PRODUCT TOP */}

                        <div className="flex w-full min-w-0 items-start gap-3">

                          {/* IMAGE */}

                          <div className="shrink-0">
                            <motion.img
                              whileHover={{
                                scale: 1.04,
                              }}
                              src={getImageUrl(
                                product?.image
                              )}
                              alt={
                                product?.name ||
                                "Product"
                              }
                              className="h-16 w-16 rounded-xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  DEFAULT_IMAGE;
                              }}
                            />
                          </div>

                          {/* CONTENT */}

                          <div className="min-w-0 flex-1">

                            <div className="flex min-w-0 items-start justify-between gap-2">

                              <div className="min-w-0 flex-1">

                                <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                                  {product?.name ||
                                    "Unnamed Product"}
                                </h3>

                                <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                                  SKU:{" "}
                                  {product?.sku ||
                                    "-"}
                                </p>

                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                  {product?.category ||
                                    "Handicraft"}
                                </p>
                              </div>

                              {/* STATUS */}

                              <motion.span
                                whileHover={{
                                  scale: 1.03,
                                }}
                                className={`max-w-[100px] shrink-0 rounded-full px-2 py-1 text-center text-[9px] font-bold leading-3 ${status.className}`}
                              >
                                {status.text}
                              </motion.span>
                            </div>

                          </div>
                        </div>

                        {/* PRODUCT DETAILS */}

                        <div className="mt-4 grid grid-cols-3 gap-2">

                          {/* STOCK */}

                          <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                              Stock
                            </p>

                            <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                              {Number(
                                product?.stock ||
                                  0
                              )}
                            </p>
                          </div>

                          {/* PURCHASE */}

                          <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                              Purchase
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                              {formatCurrency(
                                product?.purchasePrice
                              )}
                            </p>
                          </div>

                          {/* SELLING */}

                          <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                              Selling
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                              {formatCurrency(
                                product?.sellingPrice
                              )}
                            </p>
                          </div>

                        </div>

                        {/* CREATED DATE */}

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">

                          <span className="text-[10px] text-slate-400">
                            Added
                          </span>

                          <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {formatDate(
                              product?.createdAt
                            )}
                          </span>

                        </div>

                      </motion.div>
                    );
                  }
                )}

              </div>
            )}
          </div>
        </motion.div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="px-2 py-5 text-center text-[10px] text-slate-400 sm:py-6 sm:text-xs"
        >
          Vraj Creation • Inventory Management
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;