import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

// =====================================================
// FIXED PRODUCT CATEGORIES
// =====================================================

const CATEGORY_OPTIONS = [
  "Home Décor",
  "Wall Décor",
  "Table Décor",
  "Resin Art",
  "Ethnic Home Furnishing",
  "Desk Accessories",
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    hsnCode: "",

    category: "",
    subcategory: "",

    // Product Size
    length: "",
    breadth: "",
    height: "",
    sizeUnit: "cm",

    description: "",

    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    minimumStock: "5",
    supplier: "",
    status: "active",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    const baseURL =
      api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5000";

    const imageUrl = imagePath.startsWith("/")
      ? imagePath
      : `/${imagePath}`;

    return `${baseURL}${imageUrl}`;
  };

  // =====================================================
  // PARSE OLD SIZE
  // Example: "10 × 5 × 3 cm"
  // =====================================================

  const parseSize = (size) => {
    if (!size || !String(size).trim()) {
      return {
        length: "",
        breadth: "",
        height: "",
        sizeUnit: "cm",
      };
    }

    const value = String(size).trim();

    const match = value.match(
      /^\s*([\d.]+)\s*[×xX*]\s*([\d.]+)\s*[×xX*]\s*([\d.]+)\s*([a-zA-Z]+)?\s*$/
    );

    if (!match) {
      return {
        length: "",
        breadth: "",
        height: "",
        sizeUnit: "cm",
      };
    }

    return {
      length: match[1] || "",
      breadth: match[2] || "",
      height: match[3] || "",
      sizeUnit: match[4] || "cm",
    };
  };

  // =====================================================
  // FETCH PRODUCT
  // =====================================================

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/products/${id}`);

      const product = response.data?.product;

      if (!product) {
        setError("Product not found.");
        return;
      }

      // ---------------------------------------------------
      // SIZE
      // ---------------------------------------------------

      const parsedSize = parseSize(product.size);

      setFormData({
        name: product.name || "",
        sku: product.sku || "",

        // =================================================
        // HSN CODE
        // =================================================

        hsnCode:
          product.hsnCode ??
          product.hsn ??
          "",

        category: product.category || "",
        subcategory: product.subcategory || "",

        length:
          product.length ??
          product.sizeLength ??
          parsedSize.length ??
          "",

        breadth:
          product.breadth ??
          product.sizeBreadth ??
          parsedSize.breadth ??
          "",

        height:
          product.height ??
          product.sizeHeight ??
          parsedSize.height ??
          "",

        sizeUnit:
          product.sizeUnit ||
          parsedSize.sizeUnit ||
          "cm",

        description: product.description || "",

        purchasePrice: product.purchasePrice ?? "",
        sellingPrice: product.sellingPrice ?? "",
        stock: product.stock ?? "",
        minimumStock: product.minimumStock ?? 5,
        supplier: product.supplier || "",
        status: product.status || "active",
      });

      // ---------------------------------------------------
      // IMAGE
      // ---------------------------------------------------

      if (product.image) {
        setPreview(getImageUrl(product.image));
      }
    } catch (err) {
      console.error("FETCH PRODUCT ERROR:", err);

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
          "Failed to load product."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ---------------------------------------------------
    // HSN CODE - ONLY NUMBERS
    // ---------------------------------------------------

    if (name === "hsnCode") {
      const numericValue = value.replace(/\D/g, "").slice(0, 8);

      setFormData((prev) => ({
        ...prev,
        hsnCode: numericValue,
      }));

      if (error) {
        setError("");
      }

      if (success) {
        setSuccess("");
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(file);
    setPreview(imageUrl);
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");

    const fileInput =
      document.getElementById("product-image");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ===================================================
    // REQUIRED VALIDATION
    // ===================================================

    if (
      !formData.name.trim() ||
      !formData.sku.trim() ||
      !formData.category.trim()
    ) {
      setError(
        "Product name, SKU and category are required."
      );
      return;
    }

    // ===================================================
    // CATEGORY VALIDATION
    // ===================================================

    if (!CATEGORY_OPTIONS.includes(formData.category)) {
      setError("Please select a valid product category.");
      return;
    }

    // ===================================================
    // HSN CODE VALIDATION
    // ===================================================

    const hsnCode = String(
      formData.hsnCode || ""
    ).trim();

    if (
      hsnCode &&
      !/^\d{4}$|^\d{6}$|^\d{8}$/.test(hsnCode)
    ) {
      setError(
        "HSN Code must contain exactly 4, 6 or 8 digits."
      );
      return;
    }

    // ===================================================
    // PRICE REQUIRED
    // ===================================================

    if (
      formData.purchasePrice === "" ||
      formData.sellingPrice === ""
    ) {
      setError(
        "Purchase price and selling price are required."
      );
      return;
    }

    // ===================================================
    // SIZE VALIDATION
    // ===================================================

    const hasLength =
      formData.length !== "" &&
      formData.length !== null;

    const hasBreadth =
      formData.breadth !== "" &&
      formData.breadth !== null;

    const hasHeight =
      formData.height !== "" &&
      formData.height !== null;

    const hasAnySize =
      hasLength ||
      hasBreadth ||
      hasHeight;

    if (hasAnySize) {
      if (!hasLength || !hasBreadth || !hasHeight) {
        setError(
          "If you enter size, Length, Breadth and Height are all required."
        );
        return;
      }
    }

    const length =
      hasLength ? Number(formData.length) : null;

    const breadth =
      hasBreadth ? Number(formData.breadth) : null;

    const height =
      hasHeight ? Number(formData.height) : null;

    if (hasAnySize) {
      if (
        !Number.isFinite(length) ||
        !Number.isFinite(breadth) ||
        !Number.isFinite(height)
      ) {
        setError(
          "Length, Breadth and Height must be valid numbers."
        );
        return;
      }

      if (
        length <= 0 ||
        breadth <= 0 ||
        height <= 0
      ) {
        setError(
          "Length, Breadth and Height must be greater than 0."
        );
        return;
      }
    }

    // ===================================================
    // NUMBER CONVERSION
    // ===================================================

    const purchasePrice =
      Number(formData.purchasePrice);

    const sellingPrice =
      Number(formData.sellingPrice);

    const stock =
      Number(formData.stock || 0);

    const minimumStock =
      Number(formData.minimumStock || 0);

    // ===================================================
    // NUMBER VALIDATION
    // ===================================================

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(stock) ||
      !Number.isFinite(minimumStock)
    ) {
      setError(
        "Price and stock must be valid numbers."
      );
      return;
    }

    // ===================================================
    // NEGATIVE VALIDATION
    // ===================================================

    if (
      purchasePrice < 0 ||
      sellingPrice < 0 ||
      stock < 0 ||
      minimumStock < 0
    ) {
      setError(
        "Price and stock cannot be negative."
      );
      return;
    }

    // ===================================================
    // PRICE VALIDATION
    // ===================================================

    if (sellingPrice < purchasePrice) {
      setError(
        "Selling price should not be less than purchase price."
      );
      return;
    }

    try {
      setSaving(true);

      // =================================================
      // FORM DATA
      // =================================================

      const data = new FormData();

      data.append(
        "name",
        formData.name.trim()
      );

      data.append(
        "sku",
        formData.sku.trim().toUpperCase()
      );

      // =================================================
      // HSN CODE
      // =================================================

      data.append(
        "hsnCode",
        hsnCode
      );

      data.append(
        "category",
        formData.category.trim()
      );

      data.append(
        "subcategory",
        formData.subcategory.trim()
      );

      data.append(
        "description",
        formData.description.trim()
      );

      // =================================================
      // SIZE
      // =================================================

      if (hasAnySize) {
        data.append(
          "length",
          String(length)
        );

        data.append(
          "breadth",
          String(breadth)
        );

        data.append(
          "height",
          String(height)
        );

        data.append(
          "sizeUnit",
          formData.sizeUnit || "cm"
        );

        const size =
          `${length} × ${breadth} × ${height} ${
            formData.sizeUnit || "cm"
          }`;

        data.append("size", size);
      } else {
        data.append("length", "");
        data.append("breadth", "");
        data.append("height", "");

        data.append(
          "sizeUnit",
          formData.sizeUnit || "cm"
        );

        data.append("size", "");
      }

      // =================================================
      // PRICING
      // =================================================

      data.append(
        "purchasePrice",
        String(purchasePrice)
      );

      data.append(
        "sellingPrice",
        String(sellingPrice)
      );

      data.append(
        "stock",
        String(stock)
      );

      data.append(
        "minimumStock",
        String(minimumStock)
      );

      // =================================================
      // ADDITIONAL
      // =================================================

      data.append(
        "supplier",
        formData.supplier.trim()
      );

      data.append(
        "status",
        formData.status
      );

      // =================================================
      // IMAGE
      // =================================================

      if (image) {
        data.append("image", image);
      }

      // =================================================
      // API
      // =================================================

      const response = await api.put(
        `/products/${id}`,
        data
      );

      setSuccess(
        response.data?.message ||
          "Product updated successfully!"
      );

      const updatedProduct =
        response.data?.product;

      if (updatedProduct?.image) {
        setPreview(
          getImageUrl(updatedProduct.image)
        );
      }

      setImage(null);

      // =================================================
      // REDIRECT
      // =================================================

      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        err
      );

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
          "Failed to update product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">

        <div className="animate-pulse space-y-6">

          <div>
            <div className="mb-3 h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />

            <div className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />

            <div className="mt-2 h-4 w-80 rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

            <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />

              <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />

              <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />

              <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />

            </div>

          </div>

          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />

        </div>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-6xl">

      {/* HEADER */}

      <div className="mb-6">

        <button
          type="button"
          onClick={() => navigate("/products")}
          className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        >
          ← Back to Products
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update product information and inventory.
            </p>

          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:block">
            Editing Product
          </div>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">

          <span className="text-lg">
            ⚠️
          </span>

          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            {error}
          </p>

        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">

          <span className="text-lg">
            ✅
          </span>

          <div>

            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {success}
            </p>

            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-500">
              Redirecting to products...
            </p>

          </div>

        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* BASIC INFORMATION */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <SectionHeader
            title="Basic Information"
            description="Update the basic details of this product."
          />

          <div className="p-5 sm:p-6">

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />

              <Input
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. VC-SW-001"
                required
              />

              {/* HSN CODE */}

              <div>
                <Input
                  label="HSN Code"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="e.g. 94036000"
                  inputMode="numeric"
                  maxLength={8}
                />

                <p className="mt-2 text-xs text-slate-400">
                  Optional • Enter 4, 6 or 8 digit HSN code
                </p>
              </div>

              {/* CATEGORY DROPDOWN */}

              <div>

                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >

                  Category

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >

                  <option value="">
                    Select Category
                  </option>

                  {CATEGORY_OPTIONS.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}

                </select>

              </div>

              <Input
                label="Subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g. Jharokha, Pen Stand"
              />

            </div>

            {/* CATEGORY INFORMATION */}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">

              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Website Collection Mapping
              </p>

              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Changing the category will automatically
                change the collection where this product
                appears on the Vraj Creation website.
              </p>

            </div>

            {/* PRODUCT SIZE */}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">

              <div className="mb-4">

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    Product Size
                  </h3>

                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    Optional
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Enter dimensions as Length × Breadth × Height.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">

                <SizeInput
                  label="Length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                />

                <SizeInput
                  label="Breadth"
                  name="breadth"
                  value={formData.breadth}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                />

                <SizeInput
                  label="Height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                />

                <div>

                  <label
                    htmlFor="sizeUnit"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    Unit
                  </label>

                  <select
                    id="sizeUnit"
                    name="sizeUnit"
                    value={formData.sizeUnit}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                  >

                    <option value="mm">
                      mm
                    </option>

                    <option value="cm">
                      cm
                    </option>

                    <option value="m">
                      m
                    </option>

                    <option value="inch">
                      inch
                    </option>

                    <option value="ft">
                      ft
                    </option>

                  </select>

                </div>

              </div>

              {(formData.length ||
                formData.breadth ||
                formData.height) && (
                <div className="mt-4 rounded-xl bg-white px-4 py-3 dark:bg-slate-900">

                  <p className="text-xs font-semibold text-slate-400">
                    Size Preview
                  </p>

                  <p className="mt-1 text-base font-black text-slate-800 dark:text-white">

                    {formData.length || "—"}
                    {" × "}
                    {formData.breadth || "—"}
                    {" × "}
                    {formData.height || "—"}
                    {" "}
                    {formData.sizeUnit || "cm"}

                  </p>

                </div>
              )}

            </div>

            {/* DESCRIPTION */}

            <div className="mt-5">

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Enter product description..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
              />

            </div>

          </div>

        </section>

        {/* PRODUCT IMAGE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <SectionHeader
            title="Product Image"
            description="Change the image associated with this product."
          />

          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">

            <div className="flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 sm:w-44">

              {preview ? (
                <img
                  src={preview}
                  alt={formData.name || "Product"}
                  className="h-full w-full object-contain p-3"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="text-center">

                  <div className="text-5xl">
                    📦
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    No image
                  </p>

                </div>
              )}

            </div>

            <div className="flex-1">

              <label
                htmlFor="product-image"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
              >
                📷 Change Image

                <input
                  id="product-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

              </label>

              {preview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-3 w-full rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 sm:ml-2 sm:mt-0 sm:w-auto"
                >
                  Remove Image
                </button>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">

                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Image requirements
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WEBP • Maximum size 5MB
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* PRICING & STOCK */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <SectionHeader
            title="Pricing & Stock"
            description="Update pricing and inventory quantities."
          />

          <div className="p-5 sm:p-6">

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <Input
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                required
              />

              <Input
                label="Selling Price"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
                required
              />

              <Input
                label="Stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
              />

              <Input
                label="Minimum Stock"
                name="minimumStock"
                type="number"
                min="0"
                value={formData.minimumStock}
                onChange={handleChange}
                placeholder="5"
              />

            </div>

          </div>

        </section>

        {/* ADDITIONAL INFORMATION */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <SectionHeader
            title="Additional Information"
            description="Update supplier and product status."
          />

          <div className="p-5 sm:p-6">

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <Input
                label="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Enter supplier name"
              />

              <div>

                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

          </div>

        </section>

        {/* ACTION BUTTONS */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 pb-8 dark:border-slate-800 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => navigate("/products")}
            disabled={saving}
            className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
          >

            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-slate-950 dark:border-t-transparent" />
                Updating...
              </>
            ) : (
              <>
                ✓ Update Product
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
};

// =====================================================
// SECTION HEADER
// =====================================================

const SectionHeader = ({
  title,
  description,
}) => {
  return (
    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">

      <h2 className="text-lg font-black text-slate-950 dark:text-white">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
};

// =====================================================
// INPUT
// =====================================================

const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  required = false,
  inputMode,
  maxLength,
}) => {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
      >

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
      />

    </div>
  );
};

// =====================================================
// SIZE INPUT
// =====================================================

const SizeInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <input
        id={name}
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min="0"
        step="0.01"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
      />

    </div>
  );
};

export default EditProduct;