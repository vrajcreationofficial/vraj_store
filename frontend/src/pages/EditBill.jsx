import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo.jpeg";

// =====================================================
// FIXED VRAJ CREATION SETTINGS
// =====================================================

const VRAJ_UPI_ID = "8824968974-3@ybl";
const VRAJ_STATE_CODE = "08";
const VRAJ_STATE_NAME = "Rajasthan";
const VRAJ_GST_RATE = 5;

// =====================================================
// INDIAN STATE CODES
// =====================================================

const STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

// =====================================================
// STATE NAME -> STATE CODE
// =====================================================

const getStateCodeByName = (stateName) => {
  if (!stateName) {
    return "";
  }

  const normalized = String(stateName)
    .trim()
    .toLowerCase();

  const found = Object.entries(STATE_CODES).find(
    ([, name]) => name.toLowerCase() === normalized
  );

  return found ? found[0] : "";
};

// =====================================================
// PRODUCT HELPERS
// =====================================================

const getProductId = (product) => {
  return (
    product?.sku ||
    product?.product_id ||
    product?.productId ||
    product?.productCode ||
    product?.code ||
    product?._id ||
    product?.id ||
    ""
  );
};

const getProductName = (product) => {
  return (
    product?.name ||
    product?.productName ||
    product?.title ||
    product?.product_name ||
    ""
  );
};

const getProductPrice = (product) => {
  return (
    product?.price ??
    product?.sellingPrice ??
    product?.selling_price ??
    product?.rate ??
    product?.mrp ??
    0
  );
};

const getProductHSN = (product) => {
  return (
    product?.hsnCode ||
    product?.hsn ||
    product?.HSN ||
    "7326"
  );
};

// =====================================================
// FIND PRODUCT BY MANUAL PRODUCT ID
// =====================================================

const findProductById = (products, productId) => {
  const enteredId = String(productId || "")
    .trim()
    .toLowerCase();

  if (!enteredId) {
    return null;
  }

  return (
    products.find((product) => {
      const dbId = String(getProductId(product))
        .trim()
        .toLowerCase();

      return dbId === enteredId;
    }) || null
  );
};

// =====================================================
// NUMBER TO WORDS
// =====================================================

const convertNumberToWords = (amount) => {
  const numAmount = Number(amount);

  if (!Number.isFinite(numAmount) || numAmount === 0) {
    return "Rupees Zero Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const belowThousand = (value) => {
    let num = Math.floor(value);
    let result = "";

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      result += ones[num] + " ";
    }

    return result.trim();
  };

  const rupees = Math.floor(numAmount);
  const paise = Math.round((numAmount - rupees) * 100);

  let result = "";

  const crore = Math.floor(rupees / 10000000);

  if (crore > 0) {
    result += belowThousand(crore) + " Crore ";
  }

  const lakh = Math.floor((rupees % 10000000) / 100000);

  if (lakh > 0) {
    result += belowThousand(lakh) + " Lakh ";
  }

  const thousand = Math.floor((rupees % 100000) / 1000);

  if (thousand > 0) {
    result += belowThousand(thousand) + " Thousand ";
  }

  const remainder = rupees % 1000;

  if (remainder > 0) {
    result += belowThousand(remainder);
  }

  result = result.trim();

  if (paise > 0) {
    result += ` and ${belowThousand(paise)} Paise`;
  }

  return `Rupees ${result} Only`;
};

// =====================================================
// CURRENCY
// =====================================================

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =====================================================
// DATE FORMAT
// =====================================================

const formatDateForInput = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  try {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

// =====================================================
// EMPTY CUSTOMER
// =====================================================

const DEFAULT_CUSTOMER = {
  name: "",
  phone: "",
  billingAddress: "",
  shippingAddress: "",
  city: "",
  state: "",
  stateCode: "",
  pincode: "",
  gstin: "",
};

// =====================================================
// NEW ITEM
// =====================================================

const createEmptyItem = () => {
  return {
    id: `${Date.now()}-${Math.random()}`,
    productId: "",
    productName: "",
    hsnCode: "",
    quantity: 1,
    price: 0,
    gstRate: VRAJ_GST_RATE,
  };
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const EditBill = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ===================================================
  // BUSINESS
  // ===================================================

  const [businessInfo, setBusinessInfo] = useState({
    name: "VRAJ CREATION",
    logo: logoImg,
    address: "Madhuban Colony, Basni, Jodhpur (Raj.)",
    cityState: "Jodhpur, Rajasthan",
    state: VRAJ_STATE_NAME,
    stateCode: VRAJ_STATE_CODE,
    phone: "",
    email: "",
    gstin: "08AADPO3512A1ZB",
    pan: "AADPO3512A",
    bankName: "Union Bank of India",
    accountHolder: "VRAJ CREATION",
    accountNo: "401701010035985",
    ifsc: "UBIN0540170",
    branch: "Basni Jodhpur",
    upiId: VRAJ_UPI_ID,
    terms:
      "1. All disputes subject to Jodhpur jurisdiction.\n2. Responsibility ceases after goods leave factory.\n3. Once sold, goods will not be taken back/exchanged.\n4. Interest @ 24% will be charged if payment is not made within 15 days.",
    signature: "",
  });

  // ===================================================
  // INVOICE STATES
  // ===================================================

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceType, setInvoiceType] = useState("GST Invoice");

  const [customer, setCustomer] = useState(DEFAULT_CUSTOMER);

  const [items, setItems] = useState([createEmptyItem()]);

  const [shippingCharges, setShippingCharges] = useState(0);

  const [dbProducts, setDbProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState("");

  // ===================================================
  // LOAD BUSINESS SETTINGS
  // ===================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "vraj_business_settings"
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        setBusinessInfo((prev) => ({
          ...prev,
          ...parsed,

          // Always fixed
          upiId: VRAJ_UPI_ID,
          state: VRAJ_STATE_NAME,
          stateCode: VRAJ_STATE_CODE,
        }));
      }
    } catch (err) {
      console.error(
        "Business settings load error:",
        err
      );
    }
  }, []);

  // ===================================================
  // LOAD BILL + PRODUCTS
  // ===================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [billResponse, productsResponse] =
          await Promise.all([
            api.get(`/bills/${id}`),
            api.get("/products"),
          ]);

        // ---------------------------------------------
        // BILL
        // ---------------------------------------------

        const bill =
          billResponse?.data?.bill ||
          billResponse?.data?.data ||
          billResponse?.data;

        if (!bill) {
          throw new Error("Bill data not found.");
        }

        // ---------------------------------------------
        // INVOICE
        // ---------------------------------------------

        setInvoiceNo(
          bill.invoiceNo ||
            bill.invoiceNumber ||
            bill.billNumber ||
            `VC-${Date.now().toString().slice(-6)}`
        );

        setInvoiceDate(
          formatDateForInput(
            bill.invoiceDate ||
              bill.date ||
              bill.createdAt
          )
        );

        setDueDate(formatDateForInput(bill.dueDate));

        setInvoiceType(
          bill.invoiceType ||
            bill.type ||
            "GST Invoice"
        );

        // ---------------------------------------------
        // CUSTOMER
        // ---------------------------------------------

        const billCustomer = bill.customer || {};

        const loadedCustomer = {
          name:
            billCustomer.name ||
            bill.customerName ||
            "",

          phone:
            billCustomer.phone ||
            bill.customerPhone ||
            bill.mobile ||
            "",

          billingAddress:
            billCustomer.billingAddress ||
            billCustomer.address ||
            bill.customerBillingAddress ||
            bill.customerAddress ||
            bill.billingAddress ||
            "",

          shippingAddress:
            billCustomer.shippingAddress ||
            bill.customerShippingAddress ||
            bill.shippingAddress ||
            "",

          city:
            billCustomer.city ||
            bill.customerCity ||
            bill.city ||
            "",

          state:
            billCustomer.state ||
            bill.customerState ||
            bill.state ||
            "",

          stateCode:
            billCustomer.stateCode ||
            bill.customerStateCode ||
            bill.stateCode ||
            "",

          pincode:
            billCustomer.pincode ||
            bill.customerPincode ||
            bill.pincode ||
            "",

          gstin:
            billCustomer.gstin ||
            billCustomer.GSTIN ||
            bill.customerGst ||
            bill.customerGSTIN ||
            bill.gstin ||
            "",
        };

        if (
          !loadedCustomer.stateCode &&
          loadedCustomer.state
        ) {
          loadedCustomer.stateCode =
            getStateCodeByName(
              loadedCustomer.state
            );
        }

        if (
          !loadedCustomer.state &&
          loadedCustomer.stateCode
        ) {
          const code = String(
            loadedCustomer.stateCode
          )
            .replace(/\D/g, "")
            .slice(0, 2)
            .padStart(2, "0");

          loadedCustomer.state =
            STATE_CODES[code] || "";
        }

        setCustomer(loadedCustomer);

        // ---------------------------------------------
        // PRODUCTS
        // ---------------------------------------------

        const products =
          Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : Array.isArray(
                productsResponse?.data?.products
              )
            ? productsResponse.data.products
            : [];

        setDbProducts(products);

        // ---------------------------------------------
        // BILL ITEMS
        // ---------------------------------------------

        const billItems = Array.isArray(bill.items)
          ? bill.items
          : [];

        if (billItems.length > 0) {
          const mappedItems = billItems.map(
            (item, index) => ({
              id:
                item.id ||
                item._id ||
                `${Date.now()}-${index}-${Math.random()}`,

              productId:
                item.productId ||
                item.sku ||
                item.productCode ||
                "",

              productName:
                item.productName ||
                item.name ||
                "",

              hsnCode:
                item.hsnCode ||
                item.hsn ||
                "7326",

              quantity:
                Number(item.quantity) || 1,

              price:
                Number(
                  item.price ??
                    item.rate ??
                    item.sellingPrice ??
                    0
                ) || 0,

              gstRate: VRAJ_GST_RATE,
            })
          );

          const finalItems = mappedItems.map((item) => {
            const product = findProductById(
              products,
              item.productId
            );

            if (!product) {
              return item;
            }

            return {
              ...item,

              productName:
                getProductName(product) ||
                item.productName,

              hsnCode:
                getProductHSN(product) ||
                item.hsnCode,

              price:
                item.price > 0
                  ? item.price
                  : Number(
                      getProductPrice(product)
                    ) || 0,

              gstRate: VRAJ_GST_RATE,
            };
          });

          setItems(finalItems);
        } else {
          setItems([createEmptyItem()]);
        }

        // ---------------------------------------------
        // SHIPPING
        // ---------------------------------------------

        setShippingCharges(
          Number(
            bill.shippingCharges ??
              bill.summary?.shippingCharges ??
              0
          ) || 0
        );
      } catch (err) {
        console.error(
          "Edit bill load error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load invoice."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // ===================================================
  // CUSTOMER FIELD
  // ===================================================

  const handleCustomerChange = (field, value) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "pincode") {
      setPincodeMessage("");
    }
  };

  // ===================================================
  // STATE NAME
  // ===================================================

  const handleStateChange = (value) => {
    const stateCode = getStateCodeByName(value);

    setCustomer((prev) => ({
      ...prev,
      state: value,
      stateCode: stateCode || prev.stateCode || "",
    }));
  };

  // ===================================================
  // STATE CODE
  // ===================================================

  const handleStateCodeChange = (value) => {
    const cleanCode = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 2);

    setCustomer((prev) => ({
      ...prev,
      stateCode: cleanCode,
      state:
        STATE_CODES[cleanCode] ||
        prev.state ||
        "",
    }));
  };

  // ===================================================
  // PINCODE API
  // ===================================================

  const handlePincodeLookup = async (value) => {
    const cleanPincode = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    setCustomer((prev) => ({
      ...prev,
      pincode: cleanPincode,
    }));

    setPincodeMessage("");

    if (cleanPincode.length !== 6) {
      return;
    }

    try {
      setPincodeLoading(true);

      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPincode}`
      );

      if (!response.ok) {
        throw new Error(
          "Pincode API request failed."
        );
      }

      const data = await response.json();

      if (
        !Array.isArray(data) ||
        data[0]?.Status !== "Success" ||
        !Array.isArray(data[0]?.PostOffice) ||
        data[0].PostOffice.length === 0
      ) {
        setPincodeMessage("Pincode not found.");
        return;
      }

      const office = data[0].PostOffice[0];

      const state = office?.State || "";

      const city =
        office?.District ||
        office?.Division ||
        office?.Block ||
        office?.Name ||
        "";

      const stateCode = getStateCodeByName(state);

      setCustomer((prev) => ({
        ...prev,
        pincode: cleanPincode,
        city,
        state,
        stateCode:
          stateCode || prev.stateCode || "",
      }));

      setPincodeMessage(
        `${city}${state ? `, ${state}` : ""}`
      );
    } catch (err) {
      console.error(
        "Pincode lookup error:",
        err
      );

      setPincodeMessage(
        "Unable to fetch pincode details."
      );
    } finally {
      setPincodeLoading(false);
    }
  };

  // ===================================================
  // PRODUCT ID MANUAL INPUT
  // ===================================================

  const handleProductIdChange = (rowId, value) => {
    const productId = String(value || "");

    // -----------------------------------------------
    // FIRST UPDATE MANUAL ID
    // -----------------------------------------------

    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              productId,
            }
          : item
      )
    );

    // -----------------------------------------------
    // EMPTY ID
    // -----------------------------------------------

    if (!productId.trim()) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? {
                ...item,
                productId: "",
                productName: "",
                hsnCode: "",
                price: 0,
                gstRate: VRAJ_GST_RATE,
              }
            : item
        )
      );

      return;
    }

    // -----------------------------------------------
    // FIND PRODUCT
    // -----------------------------------------------

    const selectedProduct = findProductById(
      dbProducts,
      productId
    );

    // -----------------------------------------------
    // NOT FOUND
    // -----------------------------------------------

    if (!selectedProduct) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? {
                ...item,
                productId,
                productName: "",
                hsnCode: "",
                price: 0,
                gstRate: VRAJ_GST_RATE,
              }
            : item
        )
      );

      return;
    }

    // -----------------------------------------------
    // FOUND
    // -----------------------------------------------

    const actualProductId =
      getProductId(selectedProduct);

    const productName =
      getProductName(selectedProduct);

    const hsnCode =
      getProductHSN(selectedProduct);

    const price =
      Number(
        getProductPrice(selectedProduct)
      ) || 0;

    // -----------------------------------------------
    // AUTO-FILL PRODUCT
    // -----------------------------------------------

    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              productId:
                actualProductId || productId,
              productName:
                productName || "",
              hsnCode:
                hsnCode || "7326",
              price,
              gstRate:
                VRAJ_GST_RATE,
            }
          : item
      )
    );
  };

  // ===================================================
  // ITEM CHANGE
  // ===================================================

  const handleItemChange = (
    rowId,
    field,
    value
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) {
          return item;
        }

        if (field === "gstRate") {
          return {
            ...item,
            gstRate: VRAJ_GST_RATE,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // ===================================================
  // ADD ITEM
  // ===================================================

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      createEmptyItem(),
    ]);
  };

  // ===================================================
  // REMOVE ITEM
  // ===================================================

  const removeItem = (rowId) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter(
        (item) => item.id !== rowId
      );
    });
  };

  // ===================================================
  // CALCULATE TOTALS
  // ===================================================

  const calculateTotals = useMemo(() => {
    let subtotal = 0;
    let totalTaxable = 0;
    let totalGst = 0;

    const rawStateCode = String(
      customer.stateCode || ""
    )
      .replace(/\D/g, "")
      .slice(0, 2);

    const customerStateCode = rawStateCode
      ? rawStateCode.padStart(2, "0")
      : "";

    const customerState = String(
      customer.state || ""
    )
      .trim()
      .toLowerCase();

    const sellerState = VRAJ_STATE_NAME
      .trim()
      .toLowerCase();

    let isInterstate = false;

    if (customerStateCode) {
      isInterstate =
        customerStateCode !== VRAJ_STATE_CODE;
    } else if (customerState) {
      isInterstate =
        customerState !== sellerState;
    }

    items.forEach((item) => {
      const quantity =
        Number(item.quantity) || 0;

      const price =
        Number(item.price) || 0;

      const taxable =
        quantity * price;

      const gstRate =
        invoiceType === "GST Invoice"
          ? VRAJ_GST_RATE
          : 0;

      const gst =
        (taxable * gstRate) / 100;

      subtotal += taxable;
      totalTaxable += taxable;
      totalGst += gst;
    });

    // -----------------------------------------------
    // INTRASTATE
    // CGST 2.5 + SGST 2.5
    // -----------------------------------------------

    const cgst =
      invoiceType === "GST Invoice" &&
      !isInterstate
        ? totalGst / 2
        : 0;

    const sgst =
      invoiceType === "GST Invoice" &&
      !isInterstate
        ? totalGst / 2
        : 0;

    // -----------------------------------------------
    // INTERSTATE
    // IGST 5 ONLY
    // -----------------------------------------------

    const igst =
      invoiceType === "GST Invoice" &&
      isInterstate
        ? totalGst
        : 0;

    const shipping =
      Number(shippingCharges) || 0;

    const beforeRoundOff =
      totalTaxable +
      totalGst +
      shipping;

    const grandTotal =
      Math.round(beforeRoundOff);

    const roundOff =
      grandTotal - beforeRoundOff;

    return {
      subtotal,
      totalTaxable,
      totalGst,
      cgst,
      sgst,
      igst,
      shipping,
      beforeRoundOff,
      grandTotal,
      roundOff,
      isInterstate,
    };
  }, [
    items,
    customer.state,
    customer.stateCode,
    invoiceType,
    shippingCharges,
  ]);

  // ===================================================
  // PLACE OF SUPPLY
  // ===================================================

  const placeOfSupply = useMemo(() => {
    const rawCode = String(
      customer.stateCode || ""
    )
      .replace(/\D/g, "")
      .slice(0, 2);

    const code = rawCode
      ? rawCode.padStart(2, "0")
      : "";

    if (customer.state && code) {
      return `${customer.state} (${code})`;
    }

    if (customer.state) {
      return customer.state;
    }

    if (code) {
      return STATE_CODES[code] || code;
    }

    return "-";
  }, [
    customer.state,
    customer.stateCode,
  ]);

  // ===================================================
  // UPI QR
  // ===================================================

  const upiQrData = useMemo(() => {
    const amount =
      Number(
        calculateTotals.grandTotal
      ) || 0;

    return (
      `upi://pay?pa=${encodeURIComponent(
        VRAJ_UPI_ID
      )}` +
      `&pn=${encodeURIComponent(
        "Vraj Creation"
      )}` +
      `&am=${amount.toFixed(2)}` +
      `&cu=INR`
    );
  }, [
    calculateTotals.grandTotal,
  ]);

  const upiQrUrl = useMemo(() => {
    return (
      "https://api.qrserver.com/v1/create-qr-code/" +
      "?size=300x300" +
      "&margin=8" +
      `&data=${encodeURIComponent(
        upiQrData
      )}`
    );
  }, [upiQrData]);

  // ===================================================
  // UPDATE INVOICE
  // ===================================================

  const handleUpdateInvoice = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (!invoiceNo.trim()) {
        setError(
          "Invoice number is required."
        );
        return;
      }

      if (!customer.name.trim()) {
        setError(
          "Customer name is required."
        );
        return;
      }

      if (!customer.billingAddress.trim()) {
        setError(
          "Customer billing address is required."
        );
        return;
      }

      const validItems = items.filter(
        (item) =>
          String(
            item.productName || ""
          ).trim() &&
          Number(item.quantity) > 0
      );

      if (validItems.length === 0) {
        setError(
          "Please add at least one valid product."
        );
        return;
      }

      // ---------------------------------------------
      // CLEAN CUSTOMER
      // ---------------------------------------------

      const cleanCustomer = {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        billingAddress:
          customer.billingAddress.trim(),
        shippingAddress:
          customer.shippingAddress.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        stateCode:
          customer.stateCode.trim(),
        pincode:
          customer.pincode.trim(),
        gstin:
          customer.gstin.trim(),
      };

      // ---------------------------------------------
      // CLEAN ITEMS
      // ---------------------------------------------

      const cleanItems =
        validItems.map((item) => ({
          productId:
            String(
              item.productId || ""
            ).trim(),

          productName:
            String(
              item.productName || ""
            ).trim(),

          hsnCode:
            String(
              item.hsnCode || "7326"
            ).trim(),

          quantity:
            Number(item.quantity) || 1,

          price:
            Number(item.price) || 0,

          gstRate:
            invoiceType ===
            "GST Invoice"
              ? VRAJ_GST_RATE
              : 0,
        }));

      // ---------------------------------------------
      // API PAYLOAD
      // ---------------------------------------------

      const payload = {
        invoiceNo:
          invoiceNo.trim(),

        invoiceNumber:
          invoiceNo.trim(),

        billNumber:
          invoiceNo.trim(),

        invoiceDate,

        dueDate,

        invoiceType,

        customer:
          cleanCustomer,

        customerName:
          cleanCustomer.name,

        customerPhone:
          cleanCustomer.phone,

        customerGst:
          cleanCustomer.gstin,

        customerGSTIN:
          cleanCustomer.gstin,

        customerAddress:
          cleanCustomer.billingAddress,

        customerBillingAddress:
          cleanCustomer.billingAddress,

        billingAddress:
          cleanCustomer.billingAddress,

        customerShippingAddress:
          cleanCustomer.shippingAddress,

        shippingAddress:
          cleanCustomer.shippingAddress,

        customerCity:
          cleanCustomer.city,

        city:
          cleanCustomer.city,

        customerState:
          cleanCustomer.state,

        state:
          cleanCustomer.state,

        customerStateCode:
          cleanCustomer.stateCode,

        stateCode:
          cleanCustomer.stateCode,

        customerPincode:
          cleanCustomer.pincode,

        pincode:
          cleanCustomer.pincode,

        placeOfSupply,

        items:
          cleanItems,

        summary: {
          subtotal:
            calculateTotals.subtotal,

          subTotal:
            calculateTotals.subtotal,

          totalTaxable:
            calculateTotals.totalTaxable,

          totalGst:
            calculateTotals.totalGst,

          totalTax:
            calculateTotals.totalGst,

          cgst:
            calculateTotals.cgst,

          sgst:
            calculateTotals.sgst,

          igst:
            calculateTotals.igst,

          shippingCharges:
            calculateTotals.shipping,

          roundOff:
            calculateTotals.roundOff,

          grandTotal:
            calculateTotals.grandTotal,

          totalAmountAfterTax:
            calculateTotals.grandTotal,

          amountInWords:
            convertNumberToWords(
              calculateTotals.grandTotal
            ),

          gstRate:
            invoiceType ===
            "GST Invoice"
              ? VRAJ_GST_RATE
              : 0,

          isInterstate:
            calculateTotals.isInterstate,
        },

        subtotal:
          calculateTotals.subtotal,

        subTotal:
          calculateTotals.subtotal,

        totalTax:
          calculateTotals.totalGst,

        totalGst:
          calculateTotals.totalGst,

        cgst:
          calculateTotals.cgst,

        sgst:
          calculateTotals.sgst,

        igst:
          calculateTotals.igst,

        shippingCharges:
          calculateTotals.shipping,

        roundOff:
          calculateTotals.roundOff,

        grandTotal:
          calculateTotals.grandTotal,

        totalAmountBeforeTax:
          calculateTotals.totalTaxable,

        totalAmountAfterTax:
          calculateTotals.grandTotal,

        amountInWords:
          convertNumberToWords(
            calculateTotals.grandTotal
          ),

        isInterstate:
          calculateTotals.isInterstate,

        // FIXED UPI
        upiId: VRAJ_UPI_ID,

        payment: {
          upiId: VRAJ_UPI_ID,
        },
      };

      // ---------------------------------------------
      // UPDATE API
      // ---------------------------------------------

      await api.put(
        `/bills/${id}`,
        payload
      );

      setSuccess(
        "Invoice updated successfully!"
      );

      setTimeout(() => {
        navigate("/bills");
      }, 1000);
    } catch (err) {
      console.error(
        "Update invoice error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update invoice."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Loading Invoice...
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-6 print:p-0 print:bg-white">

      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
            background: white !important;
            color: #111827 !important;
          }

          input,
          textarea,
          select {
            border: none !important;
            background: transparent !important;
            color: #111827 !important;
            box-shadow: none !important;
          }

          .print-qr {
            display: block !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto print-container">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <p className="text-sm font-medium text-blue-600">
              Invoice Management
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Edit Invoice
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Update invoice details and save changes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/bills")}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold"
          >
            ← Back to Bills
          </button>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="no-print mb-5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="no-print mb-5 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        {/* =================================================
            INVOICE CARD
        ================================================= */}

        <div className="print-card bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* =================================================
              BUSINESS HEADER
          ================================================= */}

          <div className="p-6 border-b border-slate-200 dark:border-slate-700">

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

              <div className="flex items-start gap-4">

                {businessInfo.logo && (
                  <img
                    src={businessInfo.logo}
                    alt="Vraj Creation Logo"
                    className="w-20 h-20 object-contain rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                )}

                <div>

                  <h2 className="text-2xl font-extrabold tracking-wide">
                    {businessInfo.name}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {businessInfo.address}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {businessInfo.cityState}
                  </p>

                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">

                    {businessInfo.phone && (
                      <p>
                        <strong>Phone:</strong>{" "}
                        {businessInfo.phone}
                      </p>
                    )}

                    {businessInfo.email && (
                      <p>
                        <strong>Email:</strong>{" "}
                        {businessInfo.email}
                      </p>
                    )}

                    <p>
                      <strong>GSTIN:</strong>{" "}
                      {businessInfo.gstin}
                    </p>

                    <p>
                      <strong>PAN:</strong>{" "}
                      {businessInfo.pan}
                    </p>

                  </div>

                </div>

              </div>

              <div className="md:text-right">

                <h3 className="text-3xl font-black text-blue-600">
                  INVOICE
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Original for Recipient
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              INVOICE DETAILS
          ================================================= */}

          <div className="p-6 border-b border-slate-200 dark:border-slate-700">

            <SectionTitle title="Invoice Details" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <InputField
                label="Invoice Number"
                value={invoiceNo}
                onChange={(e) =>
                  setInvoiceNo(e.target.value)
                }
              />

              <InputField
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) =>
                  setInvoiceDate(e.target.value)
                }
              />

              <InputField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
              />

              <div>

                <label className="block text-sm font-semibold mb-1.5">
                  Invoice Type
                </label>

                <select
                  value={invoiceType}
                  onChange={(e) =>
                    setInvoiceType(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GST Invoice">
                    GST Invoice
                  </option>

                  <option value="Non-GST Invoice">
                    Non-GST Invoice
                  </option>
                </select>

              </div>

            </div>

          </div>

          {/* =================================================
              CUSTOMER DETAILS
          ================================================= */}

          <div className="p-6 border-b border-slate-200 dark:border-slate-700">

            <SectionTitle title="Customer Details" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <InputField
                label="Customer Name *"
                value={customer.name}
                onChange={(e) =>
                  handleCustomerChange(
                    "name",
                    e.target.value
                  )
                }
              />

              <InputField
                label="Mobile Number"
                value={customer.phone}
                onChange={(e) =>
                  handleCustomerChange(
                    "phone",
                    e.target.value
                  )
                }
              />

              {invoiceType === "GST Invoice" && (
                <InputField
                  label="Customer GSTIN"
                  value={customer.gstin}
                  onChange={(e) =>
                    handleCustomerChange(
                      "gstin",
                      e.target.value.toUpperCase()
                    )
                  }
                />
              )}

              {/* PINCODE */}

              <div>

                <label className="block text-sm font-semibold mb-1.5">
                  Pincode
                </label>

                <div className="relative">

                  <input
                    type="text"
                    value={customer.pincode}
                    maxLength={6}
                    onChange={(e) =>
                      handlePincodeLookup(
                        e.target.value
                      )
                    }
                    placeholder="Enter 6 digit pincode"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {pincodeLoading && (
                    <span className="absolute right-3 top-3 text-xs text-blue-600">
                      Loading...
                    </span>
                  )}

                </div>

                {/* AUTO CITY + STATE */}
                {pincodeMessage && (
                  <p className="mt-1.5 text-xs font-semibold text-blue-600">
                    {pincodeMessage}
                  </p>
                )}

              </div>

              <InputField
                label="City"
                value={customer.city}
                onChange={(e) =>
                  handleCustomerChange(
                    "city",
                    e.target.value
                  )
                }
              />

              <InputField
                label="State"
                value={customer.state}
                onChange={(e) =>
                  handleStateChange(
                    e.target.value
                  )
                }
                placeholder="Rajasthan"
              />

              <InputField
                label="State Code"
                value={customer.stateCode}
                maxLength={2}
                onChange={(e) =>
                  handleStateCodeChange(
                    e.target.value
                  )
                }
                placeholder="08"
              />

              {/* BILLING ADDRESS */}

              <div className="md:col-span-2">

                <label className="block text-sm font-semibold mb-1.5">
                  Billing Address *
                </label>

                <textarea
                  rows={3}
                  value={
                    customer.billingAddress
                  }
                  onChange={(e) =>
                    handleCustomerChange(
                      "billingAddress",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Customer billing address"
                />

              </div>

              {/* SHIPPING ADDRESS */}

              <div className="md:col-span-2">

                <label className="block text-sm font-semibold mb-1.5">
                  Shipping Address
                </label>

                <textarea
                  rows={3}
                  value={
                    customer.shippingAddress
                  }
                  onChange={(e) =>
                    handleCustomerChange(
                      "shippingAddress",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Shipping address"
                />

              </div>

              {/* PLACE OF SUPPLY */}

              <InputField
                label="Place of Supply"
                value={placeOfSupply}
                readOnly
              />

              {/* GST TYPE */}

              <div>

                <label className="block text-sm font-semibold mb-1.5">
                  GST Type
                </label>

                <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5">

                  {invoiceType !==
                  "GST Invoice" ? (
                    <span className="font-bold text-slate-600">
                      Non-GST Invoice
                    </span>
                  ) : calculateTotals.isInterstate ? (
                    <span className="font-bold text-orange-600">
                      IGST 5% — Interstate
                    </span>
                  ) : (
                    <span className="font-bold text-green-600">
                      CGST 2.5% + SGST 2.5%
                    </span>
                  )}

                </div>

              </div>

              {/* FIXED GST */}

              {invoiceType === "GST Invoice" && (
                <div>

                  <label className="block text-sm font-semibold mb-1.5">
                    GST Rate
                  </label>

                  <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-2.5">
                    <span className="font-bold text-green-700 dark:text-green-400">
                      5% Fixed GST
                    </span>
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className="p-6 border-b border-slate-200 dark:border-slate-700">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

              <SectionTitle title="Products / Items" />

              <button
                type="button"
                onClick={addItem}
                className="no-print px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                + Add Product
              </button>

            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">

              <table className="w-full min-w-[1050px] text-sm">

                <thead className="bg-slate-100 dark:bg-slate-800">

                  <tr>

                    <th className="px-3 py-3 text-left">
                      #
                    </th>

                    <th className="px-3 py-3 text-left">
                      Product ID
                    </th>

                    <th className="px-3 py-3 text-left">
                      Product Name
                    </th>

                    <th className="px-3 py-3 text-left">
                      HSN
                    </th>

                    <th className="px-3 py-3 text-left">
                      Qty
                    </th>

                    <th className="px-3 py-3 text-left">
                      Rate
                    </th>

                    {invoiceType ===
                      "GST Invoice" && (
                      <th className="px-3 py-3 text-left">
                        GST
                      </th>
                    )}

                    <th className="px-3 py-3 text-right">
                      Amount
                    </th>

                    <th className="px-3 py-3 text-center no-print">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {items.map(
                    (item, index) => {
                      const quantity =
                        Number(item.quantity) || 0;

                      const price =
                        Number(item.price) || 0;

                      const amount =
                        quantity * price;

                      const matchedProduct =
                        findProductById(
                          dbProducts,
                          item.productId
                        );

                      return (
                        <tr
                          key={item.id}
                          className="border-t border-slate-200 dark:border-slate-700"
                        >

                          {/* NUMBER */}

                          <td className="px-3 py-3 font-semibold">
                            {index + 1}
                          </td>

                          {/* ==================================
                              PRODUCT ID
                              MANUAL TEXT INPUT
                          ================================== */}

                          <td className="px-3 py-3">

                            <input
                              type="text"
                              value={
                                item.productId
                              }
                              onChange={(e) =>
                                handleProductIdChange(
                                  item.id,
                                  e.target.value
                                )
                              }
                              className="w-full min-w-[150px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter Product ID"
                              autoComplete="off"
                            />

                            {item.productId &&
                              matchedProduct && (
                                <p className="mt-1 text-[11px] font-semibold text-green-600">
                                  ✓ Product found
                                </p>
                              )}

                            {item.productId &&
                              !matchedProduct && (
                                <p className="mt-1 text-[11px] font-semibold text-orange-600">
                                  Product ID not found
                                </p>
                              )}

                          </td>

                          {/* ==================================
                              PRODUCT NAME
                              AUTO FILLED + READ ONLY
                          ================================== */}

                          <td className="px-3 py-3">

                            <input
                              type="text"
                              value={
                                item.productName
                              }
                              readOnly
                              className="w-full min-w-[180px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2 py-2 outline-none cursor-not-allowed"
                              placeholder="Auto-filled from Product ID"
                            />

                          </td>

                          {/* HSN */}

                          <td className="px-3 py-3">

                            <input
                              type="text"
                              value={
                                item.hsnCode
                              }
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "hsnCode",
                                  e.target.value
                                )
                              }
                              className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="7326"
                            />

                          </td>

                          {/* QUANTITY */}

                          <td className="px-3 py-3">

                            <input
                              type="number"
                              min="1"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                          </td>

                          {/* RATE */}

                          <td className="px-3 py-3">

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.price
                              }
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "price",
                                  e.target.value
                                )
                              }
                              className="w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                          </td>

                          {/* GST */}

                          {invoiceType ===
                            "GST Invoice" && (
                            <td className="px-3 py-3">

                              <div className="w-20 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-2 py-2 text-center font-bold text-green-700 dark:text-green-400">
                                5%
                              </div>

                            </td>
                          )}

                          {/* AMOUNT */}

                          <td className="px-3 py-3 text-right font-bold whitespace-nowrap">
                            ₹
                            {formatCurrency(
                              amount
                            )}
                          </td>

                          {/* DELETE */}

                          <td className="px-3 py-3 text-center no-print">

                            <button
                              type="button"
                              disabled={
                                items.length === 1
                              }
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Delete
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            <p className="no-print mt-3 text-xs text-slate-500 dark:text-slate-400">
              Product ID manually type karein.
              Exact Product ID database me milte
              hi Product Name automatically fill
              hoga.
            </p>

          </div>

          {/* =================================================
              BANK + SUMMARY
          ================================================= */}

          <div className="p-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* =============================================
                  BANK DETAILS
              ============================================= */}

              <div>

                <SectionTitle title="Bank Details" />

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-sm">

                  <p>
                    <strong>Bank:</strong>{" "}
                    {businessInfo.bankName}
                  </p>

                  <p>
                    <strong>
                      Account Holder:
                    </strong>{" "}
                    {
                      businessInfo.accountHolder
                    }
                  </p>

                  <p>
                    <strong>
                      Account No:
                    </strong>{" "}
                    {businessInfo.accountNo}
                  </p>

                  <p>
                    <strong>IFSC:</strong>{" "}
                    {businessInfo.ifsc}
                  </p>

                  <p>
                    <strong>Branch:</strong>{" "}
                    {businessInfo.branch}
                  </p>

                  <p>
                    <strong>UPI:</strong>{" "}
                    <span className="font-bold text-blue-600">
                      {VRAJ_UPI_ID}
                    </span>
                  </p>

                </div>

                {/* TERMS */}

                <div className="mt-6">

                  <SectionTitle title="Terms & Conditions" />

                  <textarea
                    rows={7}
                    value={
                      businessInfo.terms
                    }
                    onChange={(e) =>
                      setBusinessInfo(
                        (prev) => ({
                          ...prev,
                          terms:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />

                </div>

              </div>

              {/* =============================================
                  SUMMARY
              ============================================= */}

              <div>

                <SectionTitle title="Invoice Summary" />

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                  <SummaryRow
                    label="Total Amount Before Tax"
                    value={`₹${formatCurrency(
                      calculateTotals.totalTaxable
                    )}`}
                  />

                  {invoiceType ===
                    "GST Invoice" && (
                    <>
                      {!calculateTotals.isInterstate ? (
                        <>
                          <SummaryRow
                            label="CGST @ 2.5%"
                            value={`₹${formatCurrency(
                              calculateTotals.cgst
                            )}`}
                          />

                          <SummaryRow
                            label="SGST @ 2.5%"
                            value={`₹${formatCurrency(
                              calculateTotals.sgst
                            )}`}
                          />
                        </>
                      ) : (
                        <SummaryRow
                          label="IGST @ 5%"
                          value={`₹${formatCurrency(
                            calculateTotals.igst
                          )}`}
                        />
                      )}

                      <SummaryRow
                        label="Total GST @ 5%"
                        value={`₹${formatCurrency(
                          calculateTotals.totalGst
                        )}`}
                      />
                    </>
                  )}

                  {/* SHIPPING */}

                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 dark:border-slate-700">

                    <span className="font-semibold">
                      Shipping Charges
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        shippingCharges
                      }
                      onChange={(e) =>
                        setShippingCharges(
                          e.target.value
                        )
                      }
                      className="w-36 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-right outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* ROUND OFF */}

                  <SummaryRow
                    label="Round Off"
                    value={`₹${formatCurrency(
                      calculateTotals.roundOff
                    )}`}
                  />

                  {/* GRAND TOTAL */}

                  <div className="flex items-center justify-between px-4 py-4 bg-blue-600 text-white">

                    <span className="text-lg font-black">
                      Total Amount After Tax
                    </span>

                    <span className="text-xl font-black">
                      ₹
                      {formatCurrency(
                        calculateTotals.grandTotal
                      )}
                    </span>

                  </div>

                  {/* AMOUNT WORDS */}

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">

                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                      Amount in Words
                    </p>

                    <p className="font-semibold text-sm">
                      {convertNumberToWords(
                        calculateTotals.grandTotal
                      )}
                    </p>

                  </div>

                  {/* PLACE OF SUPPLY */}

                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">

                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                      Place of Supply
                    </p>

                    <p className="font-semibold">
                      {placeOfSupply}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                UPI PAYMENT QR
            ================================================= */}

            <div className="mt-8 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-5">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>

                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                    Fixed UPI Payment
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    UPI QR Payment
                  </h3>

                  <p className="mt-1 text-sm">
                    UPI ID:{" "}
                    <strong>
                      {VRAJ_UPI_ID}
                    </strong>
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    QR final invoice amount ke
                    saath generate hoga.
                  </p>

                </div>

                <div className="flex items-center gap-5">

                  <div className="bg-white p-3 rounded-xl border border-blue-200">

                    <img
                      src={upiQrUrl}
                      alt="UPI Payment QR"
                      className="w-32 h-32 object-contain"
                    />

                  </div>

                  <div className="rounded-xl border border-blue-200 bg-white dark:bg-slate-900 px-5 py-4 text-center">

                    <p className="text-xs font-bold text-slate-500">
                      INVOICE AMOUNT
                    </p>

                    <p className="text-2xl font-black text-blue-600">
                      ₹
                      {formatCurrency(
                        calculateTotals.grandTotal
                      )}
                    </p>

                    <p className="mt-1 text-xs font-semibold">
                      {VRAJ_UPI_ID}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                SIGNATURE
            ================================================= */}

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">

              <div className="flex flex-col md:flex-row md:justify-between gap-8">

                {/* CUSTOMER */}

                <div>

                  <p className="text-sm text-slate-500">
                    Customer Signature
                  </p>

                  <div className="h-20" />

                </div>

                {/* QR + AUTH SIGNATORY */}

                <div className="flex items-end gap-6">

                  <div className="text-center">

                    <img
                      src={upiQrUrl}
                      alt="Scan and Pay"
                      className="print-qr w-24 h-24 object-contain bg-white border border-slate-200 rounded-lg p-1"
                    />

                    <p className="mt-1 text-[10px] font-black">
                      SCAN & PAY
                    </p>

                    <p className="text-[10px] font-bold text-blue-600">
                      ₹
                      {formatCurrency(
                        calculateTotals.grandTotal
                      )}
                    </p>

                    <p className="text-[9px] text-slate-500">
                      {VRAJ_UPI_ID}
                    </p>

                  </div>

                  <div className="md:text-right">

                    <p className="text-sm font-semibold">
                      For {businessInfo.name}
                    </p>

                    {businessInfo.signature ? (
                      <img
                        src={
                          businessInfo.signature
                        }
                        alt="Authorized Signature"
                        className="w-36 h-20 object-contain ml-auto mt-2"
                      />
                    ) : (
                      <div className="h-20" />
                    )}

                    <p className="text-sm text-slate-500">
                      Authorized Signatory
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="no-print flex flex-col sm:flex-row justify-end gap-3 mt-6">

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
          >
            🖨 Print Preview
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={
              handleUpdateInvoice
            }
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold"
          >
            {saving
              ? "Updating Invoice..."
              : "✓ Update Invoice"}
          </button>

        </div>

      </div>

    </div>
  );
};

// =====================================================
// INPUT COMPONENT
// =====================================================

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  maxLength,
  readOnly = false,
}) => {
  return (
    <div>

      <label className="block text-sm font-semibold mb-1.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${
          readOnly
            ? "bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed"
            : "bg-white dark:bg-slate-800"
        }`}
      />

    </div>
  );
};

// =====================================================
// SECTION TITLE
// =====================================================

const SectionTitle = ({ title }) => {
  return (
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
      {title}
    </h3>
  );
};

// =====================================================
// SUMMARY ROW
// =====================================================

const SummaryRow = ({
  label,
  value,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">

      <span className="font-semibold">
        {label}
      </span>

      <span className="font-bold">
        {value}
      </span>

    </div>
  );
};

export default EditBill;