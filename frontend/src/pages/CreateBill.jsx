import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo.jpeg";

// =====================================================
// INDIAN STATE CODE MAP
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
// REVERSE STATE CODE
// =====================================================
const getStateCodeByName = (stateName) => {
  if (!stateName) return "";

  const normalized = String(stateName)
    .trim()
    .toLowerCase();

  const found = Object.entries(STATE_CODES).find(
    ([, name]) => name.toLowerCase() === normalized
  );

  return found ? found[0] : "";
};

// =====================================================
// NUMBER TO WORDS
// =====================================================
const convertNumberToWords = (amount) => {
  const numAmount = Number(amount);

  if (!Number.isFinite(numAmount) || numAmount <= 0) {
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

  const twoDigitWords = (num) => {
    if (num === 0) return "";

    if (num < 20) {
      return ones[num];
    }

    return `${tens[Math.floor(num / 10)]}${
      num % 10 ? ` ${ones[num % 10]}` : ""
    }`;
  };

  const integerToWords = (num) => {
    if (num === 0) return "";

    let result = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    const hundred = Math.floor(num / 100);
    const remainder = num % 100;

    if (crore) {
      result += `${twoDigitWords(crore)} Crore `;
    }

    if (lakh) {
      result += `${twoDigitWords(lakh)} Lakh `;
    }

    if (thousand) {
      result += `${twoDigitWords(thousand)} Thousand `;
    }

    if (hundred) {
      result += `${ones[hundred]} Hundred `;
    }

    if (remainder) {
      if (result.trim()) {
        result += "and ";
      }

      result += twoDigitWords(remainder);
    }

    return result.trim();
  };

  const fixed = numAmount.toFixed(2);
  const [wholePart, decimalPart] = fixed.split(".");

  const whole = Number(wholePart);
  const paise = Number(decimalPart);

  let result = `Rupees ${
    integerToWords(whole) || "Zero"
  }`;

  if (paise > 0) {
    result += ` and ${integerToWords(paise)} Paise`;
  }

  return `${result} Only`;
};

// =====================================================
// FORMAT CURRENCY
// =====================================================
const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =====================================================
// DEFAULT CUSTOMER
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
// CREATE EMPTY ITEM
// =====================================================
const createEmptyItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  productId: "",
  productName: "",
  hsnCode: "",
  quantity: 1,
  price: 0,

  // GST DEFAULT 5%
  gstRate: 5,
});

// =====================================================
// CREATE BILL
// =====================================================
const CreateBill = () => {
  const navigate = useNavigate();

  // ===================================================
  // BUSINESS INFORMATION
  // ===================================================
  const [businessInfo, setBusinessInfo] = useState({
    name: "VRAJ CREATION",
    logo: logoImg,

    address: "Jodhpur, Rajasthan",
    cityState: "Jodhpur, Rajasthan",
    state: "Rajasthan",
    stateCode: "08",

    phone: "+91 8824968974",
    email: "vrajcreationofficial@gmail.com",

    gstin: "08AADPO3512A1ZB",
    pan: "AADPO3512A",

    bankName: "Union Bank of India",
    accountHolder: "VRAJ CREATION",
    accountNo: "401701010035985",
    ifsc: "UBIN0540170",
    branch: "Basni Jodhpur",
    upiId: "8824968974-3@ybl",

    terms:
      "1. Goods once sold will not be taken back.\n2. All disputes subject to Jodhpur jurisdiction.\n3. Payment should be made within the agreed terms.\n4. Interest @24% p.a. will be charged on delayed payment.",

    signature: "",
  });

  // ===================================================
  // INVOICE
  // ===================================================
  const [invoiceNo, setInvoiceNo] = useState(
    `VC-${Date.now().toString().slice(-6)}`
  );

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dueDate, setDueDate] = useState("");

  const [invoiceType, setInvoiceType] =
    useState("GST Invoice");

  // ===================================================
  // CUSTOMER
  // ===================================================
  const [customer, setCustomer] =
    useState(DEFAULT_CUSTOMER);

  // ===================================================
  // ITEMS
  // ===================================================
  const [items, setItems] = useState([
    createEmptyItem(),
  ]);

  // ===================================================
  // SHIPPING
  // ===================================================
  const [shippingCharges, setShippingCharges] =
    useState(0);

  // ===================================================
  // UI STATES
  // ===================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pincodeLoading, setPincodeLoading] =
    useState(false);

  const [pincodeMessage, setPincodeMessage] =
    useState("");

  // ===================================================
  // LOAD BUSINESS SETTINGS + DRAFT
  // ===================================================
  useEffect(() => {
    const loadData = async () => {
      // ===============================================
      // BUSINESS SETTINGS
      // ===============================================
      const savedInfo = localStorage.getItem(
        "vraj_business_settings"
      );

      if (savedInfo) {
        try {
          const parsedInfo = JSON.parse(savedInfo);

          setBusinessInfo((prev) => ({
            ...prev,
            ...parsedInfo,

            logo:
              parsedInfo.logo &&
              !String(parsedInfo.logo).includes(
                "via.placeholder.com"
              )
                ? parsedInfo.logo
                : logoImg,
          }));
        } catch (err) {
          console.error(
            "Business settings error:",
            err
          );
        }
      }

      // ===============================================
      // RESTORE DRAFT
      // ===============================================
      const savedDraft = sessionStorage.getItem(
        "vraj_bill_draft"
      );

      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);

          if (parsed.customer) {
            setCustomer({
              ...DEFAULT_CUSTOMER,
              ...parsed.customer,
            });
          }

          // ===========================================
          // RESTORE INVOICE TYPE FIRST
          // ===========================================
          const restoredInvoiceType =
            parsed.invoiceType ||
            "GST Invoice";

          if (parsed.invoiceType) {
            setInvoiceType(
              parsed.invoiceType
            );
          }

          if (
            Array.isArray(parsed.items) &&
            parsed.items.length
          ) {
            setItems(
              parsed.items.map((item) => ({
                ...createEmptyItem(),
                ...item,

                // =====================================
                // WITHOUT GST = 0
                // GST INVOICE = 5
                // =====================================
                gstRate:
                  restoredInvoiceType ===
                  "Without GST"
                    ? 0
                    : 5,
              }))
            );
          }

          if (
            parsed.shippingCharges !== undefined
          ) {
            setShippingCharges(
              parsed.shippingCharges
            );
          }

          if (parsed.invoiceNo) {
            setInvoiceNo(parsed.invoiceNo);
          }

          if (parsed.invoiceDate) {
            setInvoiceDate(parsed.invoiceDate);
          }

          if (parsed.dueDate) {
            setDueDate(parsed.dueDate);
          }
        } catch (err) {
          console.error(
            "Draft restore error:",
            err
          );
        }
      }
    };

    loadData();
  }, []);

  // ===================================================
  // AUTO SAVE DRAFT
  // ===================================================
  useEffect(() => {
    const draftData = {
      customer,
      items,
      shippingCharges,
      invoiceNo,
      invoiceDate,
      dueDate,
      invoiceType,
    };

    sessionStorage.setItem(
      "vraj_bill_draft",
      JSON.stringify(draftData)
    );
  }, [
    customer,
    items,
    shippingCharges,
    invoiceNo,
    invoiceDate,
    dueDate,
    invoiceType,
  ]);

  // ===================================================
  // CUSTOMER CHANGE
  // ===================================================
  const handleCustomerChange = (
    field,
    value
  ) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "pincode") {
      setPincodeMessage("");
    }
  };

  // ===================================================
  // STATE NAME CHANGE
  // ===================================================
  const handleStateChange = (value) => {
    const stateName = value.trim();

    const stateCode =
      getStateCodeByName(stateName);

    setCustomer((prev) => ({
      ...prev,
      state: stateName,
      stateCode:
        stateCode || prev.stateCode || "",
    }));

    // Clear old pincode result if manually changing state
    if (
      stateName &&
      stateName.toLowerCase() !==
        String(customer.state || "").toLowerCase()
    ) {
      setPincodeMessage("");
    }
  };

  // ===================================================
  // STATE CODE CHANGE
  // ===================================================
  const handleStateCodeChange = (value) => {
    const cleanedCode = String(value)
      .replace(/\D/g, "")
      .slice(0, 2);

    const stateName =
      STATE_CODES[cleanedCode] || "";

    setCustomer((prev) => ({
      ...prev,
      stateCode: cleanedCode,

      state:
        stateName ||
        prev.state ||
        "",
    }));
  };

  // ===================================================
  // PINCODE -> CITY + STATE + STATE CODE
  // ===================================================
  const fetchPincodeDetails = async (
    pincode
  ) => {
    const cleanPincode = String(pincode || "")
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

      setPincodeMessage(
        "Fetching city and state..."
      );

      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPincode}`
      );

      if (!response.ok) {
        throw new Error(
          "Pincode service unavailable"
        );
      }

      const data = await response.json();

      const result = data?.[0];

      if (
        !result ||
        result.Status !== "Success" ||
        !Array.isArray(result.PostOffice) ||
        result.PostOffice.length === 0
      ) {
        setPincodeMessage(
          "Invalid pincode or details not found."
        );

        return;
      }

      const postOffice = result.PostOffice[0];

      const stateName =
        postOffice.State || "";

      const district =
        postOffice.District || "";

      const division =
        postOffice.Division || "";

      const cityName =
        district ||
        division ||
        postOffice.Block ||
        postOffice.Name ||
        "";

      const stateCode =
        getStateCodeByName(stateName);

      setCustomer((prev) => ({
        ...prev,

        pincode: cleanPincode,

        city:
          cityName ||
          prev.city ||
          "",

        state:
          stateName ||
          prev.state ||
          "",

        stateCode:
          stateCode ||
          prev.stateCode ||
          "",
      }));

      // =============================================
      // SHOW ONLY CITY + STATE
      // =============================================
      setPincodeMessage(
        `${cityName}${
          stateName
            ? `, ${stateName}`
            : ""
        }`
      );
    } catch (err) {
      console.error(
        "Pincode fetch error:",
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
  // INVOICE TYPE CHANGE
  // ===================================================
  const handleInvoiceTypeChange = (value) => {
    setInvoiceType(value);

    // ===============================================
    // WITHOUT GST = GST RATE MUST BE ZERO
    // ===============================================
    if (value === "Without GST") {
      setItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          gstRate: 0,
        }))
      );

      return;
    }

    // ===============================================
    // GST INVOICE = GST RATE 5%
    // ===============================================
    if (value === "GST Invoice") {
      setItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          gstRate: 5,
        }))
      );

      return;
    }

    // ===============================================
    // NON-GST EXISTING BEHAVIOUR
    // ===============================================
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        gstRate: 0,
      }))
    );
  };

  // ===================================================
  // ITEM CHANGE
  // ===================================================
  const handleItemChange = (
    id,
    field,
    value
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,

              [field]:
                field === "gstRate"
                  ? invoiceType === "Without GST"
                    ? 0
                    : 5
                  : value,

              // =====================================
              // WITHOUT GST = 0
              // OTHERWISE EXISTING GST VALUE
              // =====================================
              gstRate:
                invoiceType === "Without GST"
                  ? 0
                  : 5,
            }
          : item
      )
    );
  };

  // ===================================================
  // ADD ITEM
  // ===================================================
  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        ...createEmptyItem(),

        // =============================================
        // NEW ITEM GST
        // =============================================
        gstRate:
          invoiceType === "Without GST"
            ? 0
            : 5,
      },
    ]);
  };

  // ===================================================
  // REMOVE ITEM
  // ===================================================
  const removeItemRow = (id) => {
    if (items.length <= 1) {
      return;
    }

    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // ===================================================
  // CALCULATE TOTALS
  // ===================================================
  const calculateTotals = useMemo(() => {
    let subtotal = 0;
    let totalTaxable = 0;
    let totalGst = 0;

    // =================================================
    // VRAJ CREATION IS IN RAJASTHAN
    // STATE CODE = 08
    // =================================================
    const businessStateCode = "08";

    const customerStateCode = String(
      customer.stateCode || ""
    )
      .trim()
      .padStart(2, "0");

    const customerState = String(
      customer.state || ""
    )
      .trim()
      .toLowerCase();

    // =================================================
    // GST TYPE
    // =================================================
    let isInterstate = false;

    if (customerStateCode) {
      isInterstate =
        customerStateCode !==
        businessStateCode;
    } else if (customerState) {
      isInterstate =
        customerState !==
        "rajasthan";
    }

    // ===============================================
    // IMPORTANT GST FLAG
    // ONLY GST INVOICE CAN HAVE GST
    // WITHOUT GST = ALWAYS ZERO
    // ===============================================
    const isGSTInvoice =
      String(invoiceType || "").trim() ===
      "GST Invoice";

    const isWithoutGST =
      String(invoiceType || "").trim() ===
      "Without GST";

    // ===============================================
    // GST GROUPS
    // ===============================================
    const gstGroups = {};

    items.forEach((item) => {
      const quantity =
        Number(item.quantity) || 0;

      const price =
        Number(item.price) || 0;

      // =============================================
      // GST RATE
      // =============================================
      const gstRate = isGSTInvoice
        ? 5
        : 0;

      // =============================================
      // EXTRA SAFETY
      // WITHOUT GST ALWAYS ZERO
      // =============================================
      const finalGstRate = isWithoutGST
        ? 0
        : gstRate;

      const lineTaxable =
        quantity * price;

      const lineGst =
        (lineTaxable * finalGstRate) /
        100;

      subtotal += lineTaxable;
      totalTaxable += lineTaxable;
      totalGst += lineGst;

      if (finalGstRate > 0) {
        if (!gstGroups[finalGstRate]) {
          gstGroups[finalGstRate] = {
            rate: finalGstRate,
            taxable: 0,
            gst: 0,
          };
        }

        gstGroups[finalGstRate].taxable +=
          lineTaxable;

        gstGroups[finalGstRate].gst +=
          lineGst;
      }
    });

    // ===============================================
    // TAX SPLIT
    // ===============================================
    const cgst =
      isGSTInvoice &&
      !isWithoutGST &&
      !isInterstate
        ? totalGst / 2
        : 0;

    const sgst =
      isGSTInvoice &&
      !isWithoutGST &&
      !isInterstate
        ? totalGst / 2
        : 0;

    const igst =
      isGSTInvoice &&
      !isWithoutGST &&
      isInterstate
        ? totalGst
        : 0;

    // ===============================================
    // SHIPPING
    // ===============================================
    const shipping =
      Number(shippingCharges) || 0;

    // ===============================================
    // TOTAL BEFORE ROUNDING
    // ===============================================
    const beforeRoundOff =
      totalTaxable +
      totalGst +
      shipping;

    // ===============================================
    // GRAND TOTAL
    // ===============================================
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

      gstGroups:
        Object.values(gstGroups),
    };
  }, [
    items,
    shippingCharges,
    invoiceType,
    customer.state,
    customer.stateCode,
  ]);

  const calc = calculateTotals;

  // ===================================================
  // PLACE OF SUPPLY
  // ===================================================
  const placeOfSupply = useMemo(() => {
    const state =
      String(
        customer.state || ""
      ).trim();

    const code =
      String(
        customer.stateCode || ""
      )
        .trim()
        .padStart(2, "0");

    if (state && code) {
      return `${state} (${code})`;
    }

    if (state) {
      return state;
    }

    if (code && STATE_CODES[code]) {
      return `${STATE_CODES[code]} (${code})`;
    }

    return "-";
  }, [
    customer.state,
    customer.stateCode,
  ]);

  // ===================================================
  // AMOUNT IN WORDS
  // ===================================================
  const amountInWords =
    convertNumberToWords(
      calc.grandTotal
    );

  // ===================================================
  // SAVE INVOICE
  // ===================================================
  const handleSaveInvoice = async (
    e
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    // ===============================================
    // VALIDATE CUSTOMER NAME
    // ===============================================
    if (!customer.name?.trim()) {
      setError(
        "Please enter customer name."
      );

      setLoading(false);
      return;
    }

    // ===============================================
    // VALIDATE ADDRESS
    // ===============================================
    if (
      !customer.billingAddress?.trim()
    ) {
      setError(
        "Please enter customer address."
      );

      setLoading(false);
      return;
    }

    // ===============================================
    // VALID ITEMS
    // ===============================================
    const validItems = items
      .filter(
        (item) =>
          item.productName?.trim() ||
          item.productId ||
          Number(item.price) > 0
      )
      .map((item) => ({
        productId:
          item.productId
            ?.toString()
            .trim() || "",

        productName:
          item.productName?.trim() ||
          "Item",

        hsnCode:
          item.hsnCode?.trim() ||
          "7326",

        quantity:
          Number(item.quantity) || 1,

        price:
          Number(item.price) || 0,

        // =========================================
        // WITHOUT GST = 0
        // GST INVOICE = 5
        // =========================================
        gstRate:
          invoiceType === "GST Invoice" &&
          invoiceType !== "Without GST"
            ? 5
            : 0,
      }));

    if (!validItems.length) {
      setError(
        "Please add at least one product."
      );

      setLoading(false);
      return;
    }

    // ===============================================
    // NORMALIZE CUSTOMER DATA
    // ===============================================
    const cleanCustomer = {
      name:
        customer.name?.trim() || "",

      phone:
        customer.phone?.trim() || "",

      gstin:
        customer.gstin?.trim() || "",

      billingAddress:
        customer.billingAddress?.trim() || "",

      shippingAddress:
        customer.shippingAddress?.trim() || "",

      city:
        customer.city?.trim() || "",

      state:
        customer.state?.trim() || "",

      stateCode:
        customer.stateCode
          ?.toString()
          .trim() || "",

      pincode:
        customer.pincode
          ?.toString()
          .trim() || "",
    };

    // ===============================================
    // PAYLOAD
    // ===============================================
    const payload = {
      invoiceNo,
      invoiceDate,
      dueDate,
      invoiceType,

      // CUSTOMER OBJECT
      customer: cleanCustomer,

      // CUSTOMER FLAT FIELDS
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

      // PLACE OF SUPPLY
      placeOfSupply,

      placeOfSupplyState:
        cleanCustomer.state,

      placeOfSupplyStateCode:
        cleanCustomer.stateCode,

      // PRODUCTS
      items: validItems,

      // SUMMARY
      summary: {
        subtotal:
          calc.subtotal,

        totalTaxable:
          calc.totalTaxable,

        totalAmountBeforeTax:
          calc.totalTaxable,

        totalGst:
          calc.totalGst,

        cgst:
          calc.cgst,

        sgst:
          calc.sgst,

        igst:
          calc.igst,

        shippingCharges:
          calc.shipping,

        roundOff:
          calc.roundOff,

        grandTotal:
          calc.grandTotal,

        totalAmountAfterTax:
          calc.grandTotal,

        amountInWords,
      },

      // BACKWARD COMPATIBILITY
      subTotal:
        calc.subtotal,

      totalTax:
        calc.totalGst,

      totalGst:
        calc.totalGst,

      cgst:
        calc.cgst,

      sgst:
        calc.sgst,

      igst:
        calc.igst,

      shippingCharges:
        calc.shipping,

      grandTotal:
        calc.grandTotal,

      totalAmountBeforeTax:
        calc.totalTaxable,

      totalAmountAfterTax:
        calc.grandTotal,

      roundOff:
        calc.roundOff,

      isInterstate:
        calc.isInterstate,
    };

    console.log(
      "===================================="
    );

    console.log(
      "GENERATE BILL PAYLOAD:"
    );

    console.log(
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    console.log(
      "CUSTOMER:",
      cleanCustomer
    );

    console.log(
      "PLACE OF SUPPLY:",
      placeOfSupply
    );

    console.log(
      "GST TYPE:",
      invoiceType === "Without GST"
        ? "Without GST — GST 0%"
        : invoiceType === "Non-GST Invoice"
        ? "Non-GST Invoice"
        : calc.isInterstate
        ? "IGST 5%"
        : "CGST 2.5% + SGST 2.5%"
    );

    console.log(
      "GST TOTAL:",
      invoiceType === "Without GST"
        ? 0
        : calc.totalGst
    );

    console.log(
      "CGST:",
      invoiceType === "Without GST"
        ? 0
        : calc.cgst
    );

    console.log(
      "SGST:",
      invoiceType === "Without GST"
        ? 0
        : calc.sgst
    );

    console.log(
      "IGST:",
      invoiceType === "Without GST"
        ? 0
        : calc.igst
    );

    console.log(
      "GRAND TOTAL:",
      calc.grandTotal
    );

    console.log(
      "===================================="
    );

    // ===============================================
    // API
    // ===============================================
    try {
      const response = await api.post(
        "/bills/generate",
        payload
      );

      console.log(
        "BILL GENERATED:",
        response.data
      );

      // =============================================
      // CLEAR DRAFT
      // =============================================
      sessionStorage.removeItem(
        "vraj_bill_draft"
      );

      setSuccess(
        "Invoice Generated Successfully!"
      );

      // =============================================
      // REDIRECT
      // =============================================
      setTimeout(() => {
        navigate("/bills");
      }, 1200);
    } catch (err) {
      console.error(
        "Generate bill error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate invoice."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // PRINT PREVIEW
  // ===================================================
  const handlePrintPreview = () => {
    window.print();
  };

  // ===================================================
  // GST BREAKDOWN
  // ===================================================
  const renderGSTBreakdown = () => {
    // ===============================================
    // WITHOUT GST / NON GST = NO GST BREAKDOWN
    // ===============================================
    if (
      invoiceType !== "GST Invoice"
    ) {
      return null;
    }

    if (
      calc.gstGroups.length === 0
    ) {
      return (
        <div className="text-xs text-slate-500">
          No GST applicable.
        </div>
      );
    }

    return (
      <div className="space-y-3">

        {calc.isInterstate ? (
          <>
            <div className="flex justify-between">
              <span>
                IGST 5%
              </span>

              <span className="font-semibold">
                ₹
                {formatCurrency(
                  calc.igst
                )}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span>
                CGST 2.5%
              </span>

              <span className="font-semibold">
                ₹
                {formatCurrency(
                  calc.cgst
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                SGST 2.5%
              </span>

              <span className="font-semibold">
                ₹
                {formatCurrency(
                  calc.sgst
                )}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Total GST</span>

          <span>
            ₹
            {formatCurrency(
              calc.totalGst
            )}
          </span>
        </div>

      </div>
    );
  };

  // ===================================================
  // UI
  // ===================================================
  return (
    <>
      <style>
        {`
          @media print {
            body {
              background: #fff !important;
            }

            .no-print {
              display: none !important;
            }

            .print-container {
              max-width: none !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .print-card {
              box-shadow: none !important;
              border: 1px solid #222 !important;
              break-inside: avoid;
            }

            input,
            select,
            textarea {
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
            }

            @page {
              size: A4;
              margin: 10mm;
            }
          }
        `}
      </style>

      <div className="print-container mx-auto min-h-screen max-w-7xl bg-slate-50 p-4 font-sans text-slate-800 sm:p-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}
        <div className="no-print mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">
              Invoice Management
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Create New Invoice
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create GST invoice with
              automatic CGST, SGST and IGST
              calculation.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/bills")
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            ← Back to Bills
          </button>
        </div>

        {/* =================================================
            INVOICE FORM
        ================================================= */}
        <form
          onSubmit={handleSaveInvoice}
          className="space-y-6"
        >

          {/* =================================================
              BUSINESS HEADER
          ================================================= */}
          <div className="print-card rounded-2xl border border-slate-300 bg-white shadow-sm">

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-[1fr_auto]">

              <div>
                <h2 className="text-3xl font-black uppercase tracking-wide text-slate-900">
                  {businessInfo.name}
                </h2>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>
                    {businessInfo.address}
                  </p>

                  <p>
                    Phone:{" "}
                    {businessInfo.phone}
                  </p>

                  {businessInfo.email && (
                    <p>
                      Email:{" "}
                      {businessInfo.email}
                    </p>
                  )}

                  <p>
                    GSTIN:{" "}
                    <b>
                      {businessInfo.gstin}
                    </b>
                  </p>

                  <p>
                    PAN:{" "}
                    <b>
                      {businessInfo.pan}
                    </b>
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-end">
                {businessInfo.logo ? (
                  <img
                    src={businessInfo.logo}
                    alt="Business Logo"
                    className="h-24 w-32 rounded-lg object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror =
                        null;

                      e.currentTarget.src =
                        logoImg;
                    }}
                  />
                ) : (
                  <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-amber-600 text-2xl font-black text-white">
                    VC
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-slate-800 px-6 py-3 text-center">
              <h3 className="text-lg font-black uppercase">
                {invoiceType}
              </h3>
            </div>
          </div>

          {/* =================================================
              INVOICE DETAILS
          ================================================= */}
          <div className="no-print rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-amber-600">
              Invoice Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* INVOICE NUMBER */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Invoice Number
                </label>

                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) =>
                    setInvoiceNo(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* INVOICE DATE */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Invoice Date
                </label>

                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) =>
                    setInvoiceDate(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* DUE DATE */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* INVOICE TYPE */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Invoice Type
                </label>

                <select
                  value={invoiceType}
                  onChange={(e) =>
                    handleInvoiceTypeChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="GST Invoice">
                    GST Invoice
                  </option>

                  <option value="Non-GST Invoice">
                    Non-GST Invoice
                  </option>

                  <option value="Without GST">
                    Without GST
                  </option>
                </select>
              </div>

            </div>
          </div>

          {/* =================================================
              CUSTOMER
          ================================================= */}
          <div className="print-card rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">

            <h3 className="mb-5 border-b border-slate-300 pb-3 text-sm font-black uppercase tracking-wider">
              Details of Receiver / Billed To
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* NAME */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Customer Name *
                </label>

                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) =>
                    handleCustomerChange(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Customer Name"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Mobile Number
                </label>

                <input
                  type="text"
                  value={customer.phone}
                  onChange={(e) =>
                    handleCustomerChange(
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="Mobile Number"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* GSTIN */}
              {invoiceType ===
                "GST Invoice" && (
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Customer GSTIN
                  </label>

                  <input
                    type="text"
                    value={
                      customer.gstin
                    }
                    onChange={(e) =>
                      handleCustomerChange(
                        "gstin",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="GSTIN"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm uppercase text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* PINCODE */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Pincode
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={
                    customer.pincode
                  }
                  onChange={(e) =>
                    fetchPincodeDetails(
                      e.target.value
                    )
                  }
                  placeholder="Enter 6 digit Pincode"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />

                {/* AUTO CITY + STATE */}
                {pincodeLoading && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">
                    Fetching city, state...
                  </p>
                )}

                {!pincodeLoading &&
                  pincodeMessage && (
                    <div className="mt-1 rounded-md bg-emerald-50 px-2 py-1">
                      <p className="text-[11px] font-bold text-emerald-700">
                        📍 {pincodeMessage}
                      </p>
                    </div>
                  )}
              </div>

              {/* ADDRESS */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className="mb-1 block text-xs font-bold">
                  Customer Address *
                </label>

                <textarea
                  rows={2}
                  value={
                    customer.billingAddress
                  }
                  onChange={(e) =>
                    handleCustomerChange(
                      "billingAddress",
                      e.target.value
                    )
                  }
                  placeholder="Enter complete customer address"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* CITY */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  City
                </label>

                <input
                  type="text"
                  value={customer.city}
                  onChange={(e) =>
                    handleCustomerChange(
                      "city",
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* STATE */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  State
                </label>

                <input
                  type="text"
                  value={customer.state}
                  onChange={(e) =>
                    handleStateChange(
                      e.target.value
                    )
                  }
                  placeholder="Rajasthan"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />

                {customer.state && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                    State Code:{" "}
                    {customer.stateCode ||
                      "Not found"}
                  </p>
                )}
              </div>

              {/* STATE CODE */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  State Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={
                    customer.stateCode
                  }
                  onChange={(e) =>
                    handleStateCodeChange(
                      e.target.value
                    )
                  }
                  placeholder="08"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                />

                {customer.stateCode &&
                  STATE_CODES[
                    customer.stateCode
                  ] && (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                      {
                        STATE_CODES[
                          customer.stateCode
                        ]
                      }
                    </p>
                  )}
              </div>

              {/* SHIPPING ADDRESS */}
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Shipping Address
                </label>

                <input
                  type="text"
                  value={
                    customer.shippingAddress
                  }
                  onChange={(e) =>
                    handleCustomerChange(
                      "shippingAddress",
                      e.target.value
                    )
                  }
                  placeholder="Shipping Address"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              {/* PLACE OF SUPPLY */}
              <div className="md:col-span-2 lg:col-span-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        Place of Supply
                      </p>

                      <p className="mt-1 text-base font-black text-emerald-900">
                        {placeOfSupply}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-black uppercase text-slate-500">
                        GST Type
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {invoiceType ===
                        "Without GST"
                          ? "Without GST"
                          : invoiceType ===
                            "Non-GST Invoice"
                          ? "Non-GST"
                          : calc.isInterstate
                          ? "Inter-State — IGST 5%"
                          : "Intra-State — CGST 2.5% + SGST 2.5%"}
                      </p>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* =================================================
              PRODUCTS
          ================================================= */}
          <div className="print-card overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">

            {/* PRODUCTS HEADER */}
            <div className="no-print flex flex-col gap-3 border-b border-slate-300 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">

              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-600">
                  Products / Items
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Product ID manually enter karein.
                  Product database se koi selection nahi hoga.
                </p>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="w-full shrink-0 rounded-xl bg-amber-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-amber-700 sm:w-auto"
              >
                + Add Item
              </button>
            </div>

            {/* =================================================
                DESKTOP TABLE
            ================================================= */}
            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full min-w-[1050px] border-collapse text-xs">

                <thead>
                  <tr className="bg-slate-100 text-left text-[11px] font-black uppercase text-slate-600">

                    <th className="border p-3 text-center">
                      #
                    </th>

                    <th className="border p-3">
                      Product ID
                    </th>

                    <th className="border p-3">
                      Product Name
                    </th>

                    <th className="border p-3">
                      HSN
                    </th>

                    <th className="border p-3 text-center">
                      Qty
                    </th>

                    <th className="border p-3 text-right">
                      Rate
                    </th>

                    {invoiceType === "GST Invoice" && (
                      <th className="border p-3 text-center">
                        GST
                      </th>
                    )}

                    <th className="border p-3 text-right">
                      Amount
                    </th>

                    <th className="no-print border p-3 text-center">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const qty =
                      Number(item.quantity) || 0;

                    const rate =
                      Number(item.price) || 0;

                    // =========================================
                    // ONLY GST INVOICE HAS GST
                    // WITHOUT GST = 0
                    // =========================================
                    const gstRate =
                      invoiceType === "GST Invoice"
                        ? 5
                        : 0;

                    const taxable =
                      qty * rate;

                    const gst =
                      (taxable * gstRate) / 100;

                    const total =
                      taxable + gst;

                    return (
                      <tr
                        key={item.id}
                        className="border-b"
                      >

                        {/* SERIAL */}
                        <td className="border p-2 text-center font-bold">
                          {index + 1}
                        </td>

                        {/* PRODUCT ID */}
                        <td className="border p-2">
                          <input
                            type="text"
                            value={item.productId || ""}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "productId",
                                e.target.value
                              )
                            }
                            placeholder="Product ID"
                            className="w-full min-w-[150px] rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* PRODUCT NAME */}
                        <td className="border p-2">
                          <input
                            type="text"
                            value={item.productName || ""}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "productName",
                                e.target.value
                              )
                            }
                            placeholder="Product Name"
                            className="w-full min-w-[220px] rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* HSN */}
                        <td className="border p-2">
                          <input
                            type="text"
                            value={item.hsnCode || ""}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "hsnCode",
                                e.target.value
                              )
                            }
                            placeholder="HSN"
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 outline-none focus:border-amber-500"
                          />
                        </td>

                        {/* QTY */}
                        <td className="border p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-20 rounded-lg border border-slate-300 bg-white p-2 text-center text-xs text-slate-800 outline-none"
                          />
                        </td>

                        {/* RATE */}
                        <td className="border p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "price",
                                e.target.value
                              )
                            }
                            className="w-24 rounded-lg border border-slate-300 bg-white p-2 text-right text-xs text-slate-800 outline-none"
                          />
                        </td>

                        {/* GST */}
                        {invoiceType === "GST Invoice" && (
                          <td className="border p-2">
                            <div className="flex h-[34px] w-20 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-xs font-black text-amber-700">
                              5%
                            </div>
                          </td>
                        )}

                        {/* AMOUNT */}
                        <td className="border p-2 text-right font-black">
                          ₹{formatCurrency(total)}
                        </td>

                        {/* DELETE */}
                        <td className="no-print border p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeItemRow(item.id)
                              }
                              className="rounded-lg bg-rose-100 px-2 py-1 font-black text-rose-600 transition hover:bg-rose-200"
                            >
                              ✕
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>

            {/* =================================================
                MOBILE / TABLET CARD VIEW
            ================================================= */}
            <div className="space-y-4 p-3 sm:p-4 lg:hidden">

              {items.map((item, index) => {
                const qty =
                  Number(item.quantity) || 0;

                const rate =
                  Number(item.price) || 0;

                // =========================================
                // ONLY GST INVOICE HAS GST
                // WITHOUT GST = 0
                // =========================================
                const gstRate =
                  invoiceType === "GST Invoice"
                    ? 5
                    : 0;

                const taxable =
                  qty * rate;

                const gst =
                  (taxable * gstRate) / 100;

                const total =
                  taxable + gst;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >

                    {/* ITEM HEADER */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">

                      <div className="flex min-w-0 items-center gap-2">

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Item
                          </p>

                          <p className="truncate text-sm font-black text-slate-800">
                            {item.productName?.trim() ||
                              item.productId?.trim() ||
                              `Product ${index + 1}`}
                          </p>
                        </div>

                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeItemRow(item.id)
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-sm font-black text-rose-600 transition hover:bg-rose-200"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          ✕
                        </button>
                      )}

                    </div>

                    {/* ITEM BODY */}
                    <div className="space-y-4 p-3 sm:p-4">

                      {/* PRODUCT ID + HSN */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                        {/* PRODUCT ID */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Product ID
                          </label>

                          <input
                            type="text"
                            value={item.productId || ""}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "productId",
                                e.target.value
                              )
                            }
                            placeholder="Enter Product ID"
                            className="w-full min-w-0 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          />
                        </div>

                        {/* HSN */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                            HSN Code
                          </label>

                          <input
                            type="text"
                            value={item.hsnCode || ""}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "hsnCode",
                                e.target.value
                              )
                            }
                            placeholder="7326"
                            className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          />
                        </div>

                      </div>

                      {/* PRODUCT NAME */}
                      <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Product Name
                        </label>

                        <input
                          type="text"
                          value={item.productName || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "productName",
                              e.target.value
                            )
                          }
                          placeholder="Enter Product Name"
                          className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                        />
                      </div>

                      {/* QTY + RATE + GST */}
                      <div
                        className={
                          invoiceType === "GST Invoice"
                            ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
                            : "grid grid-cols-2 gap-3"
                        }
                      >

                        {/* QTY */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-center text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          />
                        </div>

                        {/* RATE */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Rate
                          </label>

                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                              ₹
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "price",
                                  e.target.value
                                )
                              }
                              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 pl-8 text-right text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                            />
                          </div>
                        </div>

                        {/* GST */}
                        {invoiceType === "GST Invoice" && (
                          <div className="col-span-2 sm:col-span-1">
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                              GST
                            </label>

                            <div className="flex h-[46px] w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-sm font-black text-amber-700">
                              5%
                            </div>
                          </div>
                        )}

                      </div>

                      {/* AMOUNT */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">

                        <div className="flex items-center justify-between gap-3">

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Item Amount
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {qty} × ₹{formatCurrency(rate)}
                              {invoiceType === "GST Invoice"
                                ? " + GST"
                                : ""}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-slate-900">
                              ₹{formatCurrency(total)}
                            </p>
                          </div>

                        </div>

                        {invoiceType === "GST Invoice" && (
                          <div className="mt-2 border-t border-slate-100 pt-2 text-right text-[11px] font-semibold text-slate-500">
                            Taxable: ₹
                            {formatCurrency(taxable)}
                            {" • "}
                            GST 5%: ₹
                            {formatCurrency(gst)}
                          </div>
                        )}

                      </div>

                    </div>
                  </div>
                );
              })}

            </div>

          </div>

          {/* =================================================
              BOTTOM SECTION
          ================================================= */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* BANK DETAILS */}
            <div className="print-card rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">

              <h3 className="mb-4 border-b border-slate-300 pb-3 text-sm font-black uppercase tracking-wider">
                Bank Details
              </h3>

              <div className="space-y-2 text-sm">

                <div className="flex justify-between gap-4">
                  <span className="font-bold">
                    Bank Name:
                  </span>

                  <span>
                    {businessInfo.bankName}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-bold">
                    A/C Holder:
                  </span>

                  <span>
                    {businessInfo.accountHolder}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-bold">
                    A/C Number:
                  </span>

                  <span>
                    {businessInfo.accountNo}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-bold">
                    IFSC Code:
                  </span>

                  <span>
                    {businessInfo.ifsc}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-bold">
                    Branch:
                  </span>

                  <span>
                    {businessInfo.branch}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-bold">
                    UPI ID:
                  </span>

                  <span>
                    {businessInfo.upiId}
                  </span>
                </div>

              </div>

              {/* TERMS */}
              <div className="mt-6">

                <h4 className="mb-2 text-xs font-black uppercase">
                  Terms & Conditions
                </h4>

                <textarea
                  rows={6}
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
                  className="no-print w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 outline-none focus:border-amber-500"
                />

                <div className="hidden whitespace-pre-line text-[10px] leading-5 print:block">
                  {businessInfo.terms}
                </div>

              </div>

            </div>

            {/* SUMMARY */}
            <div className="print-card rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">

              <h3 className="mb-4 border-b border-slate-300 pb-3 text-sm font-black uppercase tracking-wider">
                Invoice Summary
              </h3>

              {/* TOTAL BEFORE TAX */}
              <div className="flex justify-between border-b py-2 text-sm">

                <span className="font-bold">
                  Total Amount Before Tax
                </span>

                <span className="font-bold">
                  ₹
                  {formatCurrency(
                    calc.totalTaxable
                  )}
                </span>

              </div>

              {/* GST */}
              {invoiceType ===
                "GST Invoice" && (
                <div className="border-b py-3">

                  <h4 className="mb-2 text-xs font-black uppercase text-slate-500">
                    GST Details
                  </h4>

                  {renderGSTBreakdown()}

                </div>
              )}

              {/* SHIPPING */}
              <div className="flex items-center justify-between border-b py-3 text-sm">

                <span>
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
                  className="no-print w-28 rounded-lg border border-slate-300 bg-white p-2 text-right text-slate-800"
                />

                <span className="hidden font-bold print:block">
                  ₹
                  {formatCurrency(
                    calc.shipping
                  )}
                </span>

              </div>

              {/* ROUND OFF */}
              <div className="flex justify-between border-b py-2 text-sm text-slate-500">

                <span>
                  Round Off
                </span>

                <span>
                  ₹
                  {formatCurrency(
                    calc.roundOff
                  )}
                </span>

              </div>

              {/* TOTAL AFTER TAX */}
              <div className="mt-3 flex justify-between rounded-xl bg-slate-900 px-4 py-4 text-lg font-black text-white">

                <span>
                  Total Amount After Tax
                </span>

                <span>
                  ₹
                  {formatCurrency(
                    calc.grandTotal
                  )}
                </span>

              </div>

              {/* AMOUNT WORDS */}
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">

                <p className="mb-1 text-[10px] font-black uppercase text-amber-800">
                  Amount in Words
                </p>

                <p className="text-sm font-bold text-slate-800">
                  {amountInWords}
                </p>

              </div>

              {/* PLACE OF SUPPLY SUMMARY */}
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <div className="flex justify-between gap-4">

                  <span className="text-xs font-black uppercase text-emerald-700">
                    Place of Supply
                  </span>

                  <span className="text-sm font-black text-emerald-900">
                    {placeOfSupply}
                  </span>

                </div>

              </div>

              {/* GST SUMMARY */}
              {invoiceType ===
                "GST Invoice" && (
                <div className="mt-4 rounded-xl border border-slate-300 p-4">

                  <p className="mb-2 text-[10px] font-black uppercase text-slate-500">
                    Tax Summary
                  </p>

                  {calc.isInterstate ? (
                    <div className="flex justify-between text-sm font-bold">

                      <span>
                        IGST 5% Total
                      </span>

                      <span>
                        ₹
                        {formatCurrency(
                          calc.igst
                        )}
                      </span>

                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm font-bold">

                        <span>
                          CGST 2.5% Total
                        </span>

                        <span>
                          ₹
                          {formatCurrency(
                            calc.cgst
                          )}
                        </span>

                      </div>

                      <div className="mt-1 flex justify-between text-sm font-bold">

                        <span>
                          SGST 2.5% Total
                        </span>

                        <span>
                          ₹
                          {formatCurrency(
                            calc.sgst
                          )}
                        </span>

                      </div>
                    </>
                  )}

                  <div className="mt-2 flex justify-between border-t pt-2 text-sm font-black">

                    <span>
                      Total GST
                    </span>

                    <span>
                      ₹
                      {formatCurrency(
                        calc.totalGst
                      )}
                    </span>

                  </div>

                </div>
              )}

            </div>
          </div>

          {/* =================================================
              SIGNATURE
          ================================================= */}
          <div className="print-card rounded-3xl border border-slate-300 bg-white p-6">

            <div className="flex min-h-[145px] items-end justify-end">

              <div className="w-56 text-center">

                {businessInfo.signature && (
                  <img
                    src={
                      businessInfo.signature
                    }
                    alt="Signature"
                    className="mx-auto mb-2 h-16 object-contain"
                  />
                )}

                <div className="border-t border-slate-800 pt-2 text-xs font-bold">
                  Authorized Signature
                </div>

                <p className="mt-1 text-xs">
                  For {businessInfo.name}
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}
          {error && (
            <div className="no-print rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              ⚠️ {error}
            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}
          {success && (
            <div className="no-print rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              ✅ {success}
            </div>
          )}

          {/* =================================================
              BUTTONS
          ================================================= */}
          <div className="no-print flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={
                handlePrintPreview
              }
              className="flex-1 rounded-2xl bg-slate-800 p-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-700"
            >
              🖨️ Print Preview
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-2xl bg-amber-600 p-4 text-sm font-black text-white shadow-lg transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Generating Invoice..."
                : "Save & Generate Invoice →"}
            </button>

          </div>

        </form>
      </div>
    </>
  );
};

export default CreateBill;