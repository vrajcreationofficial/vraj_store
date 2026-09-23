import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const CATEGORY_OPTIONS = [
  "Home Décor",
  "Wall Décor",
  "Table Décor",
  "Resin Art",
  "Ethnic Home Furnishing",
  "Desk Accessories",
];

const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    hsnCode: "",
    category: "",
    subcategory: "",

    // Optional Size
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // ===================================================
    // HSN CODE
    // Only digits + maximum 8 digits
    // ===================================================

    if (name === "hsnCode") {
      newValue = value
        .replace(/\D/g, "")
        .slice(0, 8);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    // Validate image type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    // Validate image size
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    // Remove old preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");

    const fileInput = document.getElementById("product-image");

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
    // CATEGORY VALIDATION
    // ===================================================

    if (!CATEGORY_OPTIONS.includes(formData.category)) {
      setError(
        "Please select a valid product category."
      );
      return;
    }

    // ===================================================
    // HSN CODE VALIDATION
    // Optional
    // Allowed: 4, 6 or 8 digits
    // ===================================================

    const hsnCode = formData.hsnCode.trim();

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
    // NUMBER CONVERSION
    // ===================================================

    const purchasePrice = Number(
      formData.purchasePrice
    );

    const sellingPrice = Number(
      formData.sellingPrice
    );

    const stock = Number(
      formData.stock || 0
    );

    const minimumStock = Number(
      formData.minimumStock || 0
    );

    // ===================================================
    // SIZE IS OPTIONAL
    // ===================================================

    const length =
      formData.length === ""
        ? null
        : Number(formData.length);

    const breadth =
      formData.breadth === ""
        ? null
        : Number(formData.breadth);

    const height =
      formData.height === ""
        ? null
        : Number(formData.height);

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
    // SIZE VALIDATION
    // ===================================================

    if (
      (length !== null &&
        !Number.isFinite(length)) ||
      (breadth !== null &&
        !Number.isFinite(breadth)) ||
      (height !== null &&
        !Number.isFinite(height))
    ) {
      setError(
        "Length, Breadth and Height must be valid numbers."
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
      minimumStock < 0 ||
      (length !== null && length < 0) ||
      (breadth !== null && breadth < 0) ||
      (height !== null && height < 0)
    ) {
      setError(
        "Price, stock and size cannot be negative."
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
      setLoading(true);

      // =================================================
      // FORM DATA
      // =================================================

      const data = new FormData();

      // =================================================
      // BASIC INFORMATION
      // =================================================

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

      // =================================================
      // SIZE L × B × H
      // =================================================

      if (length !== null) {
        data.append(
          "length",
          String(length)
        );
      }

      if (breadth !== null) {
        data.append(
          "breadth",
          String(breadth)
        );
      }

      if (height !== null) {
        data.append(
          "height",
          String(height)
        );
      }

      data.append(
        "sizeUnit",
        formData.sizeUnit
      );

      // =================================================
      // FINAL SIZE VALUE
      // =================================================

      const sizeParts = [];

      if (length !== null) {
        sizeParts.push(length);
      }

      if (breadth !== null) {
        sizeParts.push(breadth);
      }

      if (height !== null) {
        sizeParts.push(height);
      }

      const size =
        sizeParts.length > 0
          ? `${sizeParts.join(
              " × "
            )} ${formData.sizeUnit}`
          : "";

      data.append(
        "size",
        size
      );

      // =================================================
      // OTHER DETAILS
      // =================================================

      data.append(
        "description",
        formData.description.trim()
      );

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
        data.append(
          "image",
          image
        );
      }

      // =================================================
      // API
      // =================================================

      const response = await api.post(
        "/products",
        data
      );

      setSuccess(
        response.data?.message ||
          "Product created successfully!"
      );

      // =================================================
      // RESET FORM
      // =================================================

      setFormData({
        name: "",
        sku: "",
        hsnCode: "",
        category: "",
        subcategory: "",

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

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setImage(null);
      setPreview("");

      const fileInput =
        document.getElementById(
          "product-image"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      // =================================================
      // REDIRECT
      // =================================================

      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err) {
      console.error(
        "CREATE PRODUCT ERROR:",
        err
      );

      // =================================================
      // UNAUTHORIZED
      // =================================================

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      // =================================================
      // DUPLICATE SKU
      // =================================================

      if (
        err.response?.status === 400 &&
        err.response?.data?.message
          ?.toLowerCase()
          .includes("sku")
      ) {
        setError(
          err.response.data.message
        );
        return;
      }

      // =================================================
      // HSN ERROR
      // =================================================

      if (
        err.response?.status === 400 &&
        err.response?.data?.message
          ?.toLowerCase()
          .includes("hsn")
      ) {
        setError(
          err.response.data.message
        );
        return;
      }

      // =================================================
      // OTHER ERROR
      // =================================================

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-6xl">

      {/* HEADER */}

      <div className="mb-6">

        <button
          type="button"
          onClick={() =>
            navigate("/products")
          }
          className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        >
          ← Back to Products
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Add Product
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add a new product to your inventory.
            </p>

          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:block">
            Inventory Management
          </div>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">

          <span className="text-lg">
            ⚠️
          </span>

          <div>

            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              {error}
            </p>

          </div>

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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">

            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Basic Information
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Enter the basic details of your product.
            </p>

          </div>

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

              <Input
                label="HSN Code"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                placeholder="e.g. 94036000"
                inputMode="numeric"
                maxLength={8}
              />

              {/* CATEGORY */}

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

                  {CATEGORY_OPTIONS.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* SUBCATEGORY */}

              <Input
                label="Subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g. Jharokha, Pen Stand"
              />

            </div>

            {/* HSN INFORMATION */}

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">

              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                HSN Code
              </p>

              <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                Optional • Enter exactly 4, 6 or 8 digits.
                Example: 94036000
              </p>

            </div>

            {/* CATEGORY INFORMATION */}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">

              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Website Collection Mapping
              </p>

              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Selected category will automatically determine
                which collection the product appears in on the
                Vraj Creation website.
              </p>

            </div>

            {/* SIZE */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Size (L × B × H)
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">

                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Length (L)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />

                <input
                  type="number"
                  name="breadth"
                  value={formData.breadth}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Breadth (B)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />

                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Height (H)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />

                <select
                  name="sizeUnit"
                  value={formData.sizeUnit}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >

                  <option value="cm">
                    cm
                  </option>

                  <option value="mm">
                    mm
                  </option>

                  <option value="inch">
                    inch
                  </option>

                  <option value="ft">
                    ft
                  </option>

                </select>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Optional • Enter dimensions as Length ×
                Breadth × Height
              </p>

            </div>

            {/* DESCRIPTION */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Description
              </label>

              <textarea
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">

            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Product Image
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Upload an image for your product.
            </p>

          </div>

          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">

            <div className="flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 sm:w-44">

              {preview ? (
                <img
                  src={preview}
                  alt="Product Preview"
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <div className="text-center">

                  <div className="text-5xl">
                    📦
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    No image selected
                  </p>

                </div>
              )}

            </div>

            <div className="flex-1">

              <label
                htmlFor="product-image"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
              >
                📷 Choose Image

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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">

            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Pricing & Stock
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Set product pricing and inventory quantity.
            </p>

          </div>

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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">

            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Additional Information
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Add supplier and product status information.
            </p>

          </div>

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

                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Status
                </label>

                <select
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
            onClick={() =>
              navigate("/products")
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
          >

            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-slate-950 dark:border-t-transparent" />

                Creating...
              </>
            ) : (
              <>
                ✓ Create Product
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
};

// =====================================================
// REUSABLE INPUT COMPONENT
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

export default AddProduct;