import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";

const ProductDetails = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http")) {
      return image;
    }

return `https://vraj-store.onrender.com${image}`;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      setProducts(response.data.products || []);
    } catch (error) {
      console.error("PRODUCT LOAD ERROR:", error);

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
          "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];

    return uniqueCategories.sort();
  }, [products]);


  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
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
        product.category
          ?.toLowerCase()
          .includes(searchText) ||
        product.supplier
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "all" ||
        product.category === category;

      return (
        matchesSearch && matchesCategory
      );
    });
  }, [products, search, category]);


  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    try {
      setDeleting(id);

      await api.delete(`/products/${id}`);

      setProducts((prev) =>
        prev.filter(
          (product) => product._id !== id
        )
      );
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
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

      alert(
        error.response?.data?.message ||
          "Failed to delete product"
      );
    } finally {
      setDeleting(null);
    }
  };

  // ==========================================
  // STOCK STATUS
  // ==========================================

  const getStockStatus = (product) => {
    const stock = Number(product.stock || 0);
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
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading products...
            </p>

          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Inventory
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage all products in your inventory.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/products/add")
            }
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Add Product
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">
              ❌ {error}
            </p>
          </div>
        )}

        {/* FILTER BAR */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search product, SKU, category or supplier..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />

            </div>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-500 focus:bg-white"
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

          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">

            <span>
              Showing{" "}
              <b className="text-slate-700">
                {filteredProducts.length}
              </b>{" "}
              of{" "}
              <b className="text-slate-700">
                {products.length}
              </b>{" "}
              products
            </span>

            {(search || category !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="font-semibold text-slate-700 hover:text-slate-950"
              >
                Clear Filters
              </button>
            )}

          </div>

        </div>

        {/* PRODUCTS TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {filteredProducts.length === 0 ? (
            <div className="px-5 py-16 text-center">

              <div className="text-5xl">
                📦
              </div>

              <h3 className="mt-4 font-bold text-slate-800">
                No products found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or add a new product.
              </p>

              <button
                onClick={() =>
                  navigate("/products/add")
                }
                className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                + Add Product
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Purchase
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Selling
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredProducts.map(
                    (product) => {

                      const stockStatus =
                        getStockStatus(product);

                      return (
                        <tr
                          key={product._id}
                          className="transition hover:bg-slate-50"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">

                                {product.image ? (
                                  <img
                                    src={getImageUrl(
                                      product.image
                                    )}
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-lg">
                                    📦
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[220px] truncate text-sm font-bold text-slate-900">
                                  {product.name}
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-400">
                                  SKU:{" "}
                                  {product.sku}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-700">
                              {product.category}
                            </p>

                            {product.subcategory && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  product.subcategory
                                }
                              </p>
                            )}

                          </td>

                          {/* PURCHASE */}

                          <td className="px-5 py-4 text-right">

                            <span className="text-sm font-semibold text-slate-700">
                              ₹
                              {Number(
                                product.purchasePrice ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </span>

                          </td>

                          {/* SELLING */}

                          <td className="px-5 py-4 text-right">

                            <span className="text-sm font-bold text-slate-900">
                              ₹
                              {Number(
                                product.sellingPrice ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </span>

                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4 text-center">

                            <p className="text-sm font-bold text-slate-900">
                              {product.stock}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              Min:{" "}
                              {
                                product.minimumStock
                              }
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">

                            <div className="flex flex-col items-center gap-1">

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${stockStatus.className}`}
                              >
                                {
                                  stockStatus.label
                                }
                              </span>

                              <span
                                className={`text-[11px] font-semibold ${
                                  product.status ===
                                  "active"
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {product.status ===
                                "active"
                                  ? "● Active"
                                  : "● Inactive"}
                              </span>

                            </div>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  navigate(
                                    `/products/${product._id}`
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                              >
                                View
                              </button>

                              <button
                                onClick={() =>
                                  navigate(
                                    `/products/${product._id}/edit`
                                  )
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                              >
                                Edit
                              </button>

                              <button
                                disabled={
                                  deleting ===
                                  product._id
                                }
                                onClick={() =>
                                  handleDelete(
                                    product._id,
                                    product.name
                                  )
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deleting ===
                                product._id
                                  ? "..."
                                  : "Delete"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </AdminLayout>
  );
};

export default ProductDetails;