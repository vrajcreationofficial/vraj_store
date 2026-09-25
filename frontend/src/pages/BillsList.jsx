import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo.jpeg";

// =====================================================
// VRAJ CREATION FIXED UPI ID
// =====================================================
const VRAJ_UPI_ID = "8824968974-3@ybl";

// =====================================================
// NUMBER TO WORDS - INDIAN CURRENCY
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

  const twoDigit = (value) => {
    if (value === 0) return "";

    if (value < 20) {
      return ones[value];
    }

    return (
      tens[Math.floor(value / 10)] +
      (value % 10 ? ` ${ones[value % 10]}` : "")
    );
  };

  const inWords = (value) => {
    value = Math.floor(value);

    if (value === 0) {
      return "";
    }

    let result = "";

    const crore = Math.floor(value / 10000000);
    value %= 10000000;

    const lakh = Math.floor(value / 100000);
    value %= 100000;

    const thousand = Math.floor(value / 1000);
    value %= 1000;

    const hundred = Math.floor(value / 100);
    const rest = value % 100;

    if (crore > 0) {
      result += `${twoDigit(crore)} Crore `;
    }

    if (lakh > 0) {
      result += `${twoDigit(lakh)} Lakh `;
    }

    if (thousand > 0) {
      result += `${twoDigit(thousand)} Thousand `;
    }

    if (hundred > 0) {
      result += `${ones[hundred]} Hundred `;
    }

    if (rest > 0) {
      if (result.trim() !== "") {
        result += "and ";
      }

      result += twoDigit(rest);
    }

    return result.trim();
  };

  const [wholePart, decimalPart] = numAmount
    .toFixed(2)
    .split(".");

  const whole = Number(wholePart);
  const decimal = Number(decimalPart);

  let result = `Rupees ${inWords(whole)}`;

  if (decimal > 0) {
    result += ` and ${inWords(decimal)} Paise`;
  }

  return `${result} Only`;
};

// =====================================================
// SAFE NUMBER
// =====================================================
const num = (value) => {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
};

// =====================================================
// FORMAT MONEY
// =====================================================
const money = (value) => {
  return num(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =====================================================
// INVOICE TYPE HELPERS
// =====================================================
const normalizeInvoiceType = (value) => {
  const type = String(value || "GST Invoice")
    .trim()
    .toLowerCase();

  if (type === "without gst" || type === "withoutgst") {
    return "Without GST";
  }

  if (type === "non-gst invoice" || type === "nongst invoice") {
    return "Non-GST Invoice";
  }

  return "GST Invoice";
};

// =====================================================
// GST CALCULATION
// =====================================================
const calculateGST = (
  items,
  customerStateCode,
  customerState,
  invoiceType = "GST Invoice"
) => {
  let taxableTotal = 0;

  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const stateCode = String(
    customerStateCode || ""
  ).trim();

  const stateName = String(
    customerState || ""
  )
    .trim()
    .toLowerCase();

  const normalizedInvoiceType =
    normalizeInvoiceType(invoiceType);

  const isWithoutGST =
    normalizedInvoiceType === "Without GST";

  const isRajasthan =
    stateCode === "08" ||
    stateName === "rajasthan";

  items.forEach((item) => {
    const quantity = num(item.quantity);
    const price = num(item.price);
    const itemDiscount = num(item.discount);

    const gstRate = isWithoutGST ? 0 : 5;

    const gross = quantity * price;

    const taxable = Math.max(
      0,
      gross - itemDiscount
    );

    taxableTotal += taxable;

    if (!isWithoutGST) {
      if (isRajasthan) {
        totalCGST +=
          (taxable * 2.5) / 100;

        totalSGST +=
          (taxable * 2.5) / 100;
      } else {
        totalIGST +=
          (taxable * gstRate) / 100;
      }
    }
  });

  const totalGST = isWithoutGST
    ? 0
    : isRajasthan
      ? totalCGST + totalSGST
      : totalIGST;

  return {
    taxableTotal,
    totalCGST,
    totalSGST,
    totalIGST,
    totalGST,
    isRajasthan,
  };
};

// =====================================================
// GET BILL DATA
// =====================================================
const getBillPrintData = (bill) => {
  const items = Array.isArray(bill?.items)
    ? bill.items
    : [];

  const invoiceNo =
    bill.invoiceNo ||
    bill.billNumber ||
    "-";

  const invoiceDate =
    bill.invoiceDate ||
    bill.createdAt;

  const formattedDate =
    invoiceDate
      ? new Date(invoiceDate).toLocaleDateString(
          "en-IN"
        )
      : "-";

  const invoiceType = normalizeInvoiceType(
    bill.invoiceType ||
      bill.type ||
      bill.invoice_type ||
      "GST Invoice"
  );

  const customer =
    bill.customer || {};

  const customerName =
    customer.name ||
    bill.customerName ||
    "Walk-in Customer";

  const customerAddress =
    customer.billingAddress ||
    customer.address ||
    bill.billingAddress ||
    "";

  const customerShippingAddress =
    customer.shippingAddress ||
    customerAddress ||
    "";

  const customerPhone =
    customer.phone ||
    customer.mobile ||
    bill.customerPhone ||
    bill.mobile ||
    "";

  const customerEmail =
    customer.email ||
    bill.customerEmail ||
    "";

  const customerGST =
    customer.gstin ||
    customer.gstIn ||
    customer.GSTIN ||
    bill.customerGSTIN ||
    "";

  const customerPincode =
    customer.pincode ||
    customer.pinCode ||
    bill.pincode ||
    "";

  const customerCity =
    customer.city ||
    bill.city ||
    "";

  const customerState =
    customer.state ||
    bill.state ||
    "";

  const customerStateCode =
    customer.stateCode ||
    customer.state_code ||
    bill.stateCode ||
    bill.state_code ||
    "";

  const placeOfSupply =
    customerState
      ? `${customerState}${
          customerStateCode
            ? ` (${customerStateCode})`
            : ""
        }`
      : "-";

  const gstData = calculateGST(
    items,
    customerStateCode,
    customerState,
    invoiceType
  );

  const taxableTotal =
    gstData.taxableTotal;

  const grandTotal = Math.round(
    taxableTotal + gstData.totalGST
  );

  const amountInWords =
    convertNumberToWords(
      grandTotal
    );

  const upiId = VRAJ_UPI_ID;

  const upiQrData =
    `upi://pay?pa=${encodeURIComponent(
      upiId
    )}` +
    `&pn=${encodeURIComponent(
      "Vraj Creation"
    )}` +
    `&am=${grandTotal.toFixed(2)}` +
    `&cu=INR`;

  const upiQrUrl =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=300x300` +
    `&margin=8` +
    `&data=${encodeURIComponent(
      upiQrData
    )}`;

  const fullCustomerAddress = [
    customerAddress,
    customerCity,
    customerState
      ? `${customerState}${
          customerStateCode
            ? ` (${customerStateCode})`
            : ""
        }`
      : "",
    customerPincode
      ? `PIN - ${customerPincode}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  const fullShippingAddress = [
    customerShippingAddress,
    customerCity,
    customerState
      ? `${customerState}${
          customerStateCode
            ? ` (${customerStateCode})`
            : ""
        }`
      : "",
    customerPincode
      ? `PIN - ${customerPincode}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    items,
    invoiceNo,
    formattedDate,
    invoiceType,
    customerName,
    customerPhone,
    customerEmail,
    customerGST,
    customerStateCode,
    placeOfSupply,
    gstData,
    taxableTotal,
    grandTotal,
    amountInWords,
    upiId,
    upiQrUrl,
    fullCustomerAddress,
    fullShippingAddress,
  };
};

// =====================================================
// INVOICE CSS
// =====================================================
const invoiceCss = `
  * {
    box-sizing: border-box;
  }

  .invoice-preview-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .invoice-paper {
    position: relative;
    width: 190mm;
    min-height: 287mm;
    margin: 0 auto;
    border: 1.5px solid #222;
    display: flex;
    flex-direction: column;
    background: #fff;
    color: #111;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    box-sizing: border-box;
  }

  .invoice-watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .invoice-watermark img {
    width: 400px;
    height: 400px;
    object-fit: contain;
    opacity: 0.10;
    filter: grayscale(100%);
  }

  .invoice-paper > *:not(.invoice-watermark) {
    position: relative;
    z-index: 1;
  }

  .seller-header {
    text-align: center;
    padding: 7px 10px 5px;
    border-bottom: 1px solid #222;
  }

  .seller-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .seller-header p {
    margin: 1px 0;
    font-size: 9px;
    line-height: 1.2;
  }

  .invoice-title {
    text-align: center;
    font-size: 11px;
    font-weight: 900;
    margin-top: 3px;
    letter-spacing: 0.5px;
  }

  .customer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #222;
  }

  .customer-box {
    min-height: 75px;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .customer-box:first-child {
    border-right: 1px solid #222;
  }

  .customer-row {
    margin: 2px 0;
    padding: 0 5px;
    font-size: 8.5px;
    line-height: 1.25;
    box-sizing: border-box;
    width: 100%;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .address {
    margin-top: 1px;
    line-height: 1.25;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .invoice-details {
    width: 100%;
    border-collapse: collapse;
  }

  .invoice-details td {
    border: 1px solid #555;
    padding: 4px 5px;
    font-size: 9px;
    vertical-align: top;
  }

  .invoice-paper table {
    width: 100%;
    border-collapse: collapse;
  }

  .invoice-paper th,
  .invoice-paper td {
    border: 1px solid #555;
    padding: 3px 4px;
    font-size: 8.5px;
  }

  .invoice-paper th {
    background: #f1f1f1;
    font-weight: 900;
    text-align: center;
    vertical-align: middle;
  }

  .center {
    text-align: center;
  }

  .right {
    text-align: right;
  }

  .items-table {
    margin-top: 0;
    table-layout: fixed;
  }

  .items-table th:nth-child(1) {
    width: 30px;
  }

  .items-table th:nth-child(2) {
    width: auto;
  }

  .items-table th:nth-child(3) {
    width: 55px;
  }

  .items-table th:nth-child(4) {
    width: 42px;
  }

  .items-table th:nth-child(5) {
    width: 65px;
  }

  .items-table th:nth-child(6) {
    width: 45px;
  }

  .items-table th:nth-child(7) {
    width: 75px;
  }

  .items-table th:nth-child(8) {
    width: 75px;
  }

  .product-cell {
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .bottom-area {
    margin-top: auto;
    width: 100%;
  }

  .summary-wrapper {
    display: grid;
    grid-template-columns: 1fr 240px;
    border-top: 1px solid #222;
  }

  .words-box {
    padding: 5px 7px;
    border-right: 1px solid #222;
    font-size: 9px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .tax-table td {
    padding: 3px 4px;
    font-size: 8.5px;
  }

  .tax-table .total-row td {
    font-size: 9.5px;
    font-weight: 900;
    border-top: 1px solid #222;
    background: #fafafa;
  }

  .bank-terms {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid #222;
    width: 100%;
  }

  .bank-box,
  .terms-box {
    min-width: 0;
    box-sizing: border-box;
  }

  .bank-box {
    border-right: 1px solid #222;
  }

  .bank-row {
    display: grid;
    grid-template-columns: 75px minmax(0, 1fr);
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
    padding: 2px 5px;
    font-size: 8.5px;
    line-height: 1.25;
  }

  .bank-row span {
    min-width: 0;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .terms-box ol {
    margin: 0;
    padding: 4px 7px 4px 20px;
    box-sizing: border-box;
  }

  .terms-box li {
    font-size: 7.5px;
    line-height: 1.25;
    margin-bottom: 1px;
  }

  .signature-payment {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    min-height: 105px;
    padding: 7px 10px 9px;
    border-top: 1px solid #222;
  }

  .payment-qr-box {
    width: 160px;
    min-height: 95px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .qr-label {
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .payment-qr {
    width: 78px;
    height: 78px;
    object-fit: contain;
    display: block;
  }

  .qr-title {
    margin-top: 2px;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.3px;
  }

  .qr-amount {
    font-size: 8.5px;
    font-weight: 900;
    margin-top: 1px;
  }

  .qr-upi {
    font-size: 6.5px;
    color: #444;
    margin-top: 1px;
    word-break: break-all;
    max-width: 150px;
  }

  .signature {
    width: 190px;
    min-height: 85px;
    padding: 0;
    border: none;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .signature-line {
    width: 160px;
    border-top: 1px solid #222;
    padding-top: 3px;
    text-align: center;
    font-size: 8.5px;
  }

  .invoice-footer {
    text-align: center;
    border-top: 1px solid #222;
    padding: 3px;
    font-size: 7.5px;
  }

  @media screen and (max-width: 768px) {
    .invoice-preview-wrapper {
      display: block;
      width: 100%;
    }

    .invoice-paper {
      width: 100%;
      min-height: auto;
      margin: 0;
      border-width: 1px;
      transform: none;
    }

    .seller-header {
      padding: 8px 6px 6px;
    }

    .seller-header h1 {
      font-size: 16px;
    }

    .seller-header p {
      font-size: 7px;
    }

    .invoice-title {
      font-size: 9px;
    }

    .customer-grid {
      grid-template-columns: 1fr 1fr;
    }

    .customer-box {
      min-height: 0;
    }

    .customer-row {
      font-size: 6.5px;
      padding: 0 3px;
      line-height: 1.25;
    }

    .customer-box > div:first-child {
      font-size: 6.8px !important;
      padding: 4px 3px !important;
    }

    .address {
      font-size: 6.5px;
    }

    .invoice-details td {
      padding: 3px 2px;
      font-size: 6.5px;
    }

    .invoice-paper th,
    .invoice-paper td {
      padding: 2px 2px;
      font-size: 6px;
    }

    .items-table th:nth-child(1) {
      width: 21px;
    }

    .items-table th:nth-child(3) {
      width: 34px;
    }

    .items-table th:nth-child(4) {
      width: 25px;
    }

    .items-table th:nth-child(5) {
      width: 47px;
    }

    .items-table th:nth-child(6) {
      width: 34px;
    }

    .items-table th:nth-child(7) {
      width: 55px;
    }

    .items-table th:nth-child(8) {
      width: 55px;
    }

    .summary-wrapper {
      grid-template-columns: 1fr 43%;
    }

    .words-box {
      padding: 4px;
      font-size: 6.5px;
    }

    .tax-table td {
      padding: 2px;
      font-size: 6px;
    }

    .tax-table .total-row td {
      font-size: 6.5px;
    }

    .bank-terms {
      grid-template-columns: 1fr 1fr;
    }

    .bank-row {
      grid-template-columns: 48px minmax(0, 1fr);
      gap: 2px;
      padding: 2px 3px;
      font-size: 6px;
    }

    .terms-box ol {
      padding: 3px 3px 3px 13px;
    }

    .terms-box li {
      font-size: 5.5px;
      line-height: 1.25;
    }

    .signature-payment {
      min-height: 82px;
      padding: 5px;
    }

    .payment-qr-box {
      width: 110px;
      min-height: 70px;
    }

    .qr-label {
      font-size: 5.5px;
    }

    .payment-qr {
      width: 55px;
      height: 55px;
    }

    .qr-title {
      font-size: 6px;
    }

    .qr-amount {
      font-size: 6.5px;
    }

    .qr-upi {
      font-size: 5px;
      max-width: 105px;
    }

    .signature {
      width: 125px;
      min-height: 65px;
    }

    .signature-line {
      width: 110px;
      font-size: 6.5px;
    }

    .invoice-footer {
      padding: 3px;
      font-size: 5.5px;
    }

    .invoice-watermark img {
      width: 220px;
      height: 220px;
    }
  }

  @media print {
    .invoice-paper {
      width: 190mm !important;
      min-height: 287mm !important;
      height: 287mm !important;
      margin: 0 auto !important;
      border: 1.5px solid #222 !important;
      overflow: hidden !important;
      background: #fff !important;
    }

    .invoice-paper,
    .invoice-paper * {
      visibility: visible !important;
    }

    .invoice-paper {
      page-break-inside: avoid !important;
    }

    .invoice-watermark img {
      opacity: 0.10 !important;
    }

    .seller-header h1 {
      font-size: 20px !important;
    }

    .seller-header p {
      font-size: 9px !important;
    }

    .invoice-title {
      font-size: 11px !important;
    }

    .customer-row {
      font-size: 8.5px !important;
    }

    .invoice-paper th,
    .invoice-paper td {
      font-size: 8.5px !important;
      padding: 3px 4px !important;
    }

    .invoice-details td {
      font-size: 9px !important;
      padding: 4px 5px !important;
    }

    .words-box {
      font-size: 9px !important;
    }

    .tax-table td {
      font-size: 8.5px !important;
    }

    .bank-row {
      font-size: 8.5px !important;
    }

    .terms-box li {
      font-size: 7.5px !important;
    }

    .signature-payment {
      min-height: 105px !important;
    }

    .payment-qr {
      width: 78px !important;
      height: 78px !important;
    }

    .qr-label {
      font-size: 7px !important;
    }

    .qr-title {
      font-size: 8px !important;
    }

    .qr-amount {
      font-size: 8.5px !important;
    }

    .qr-upi {
      font-size: 6.5px !important;
    }

    .signature-line {
      font-size: 8.5px !important;
    }

    .invoice-footer {
      font-size: 7.5px !important;
    }
  }
`;

// =====================================================
// INVOICE COMPONENT
// =====================================================
const InvoiceContent = ({
  bill,
}) => {
  const data =
    getBillPrintData(bill);

  const {
    items,
    invoiceNo,
    formattedDate,
    invoiceType,
    customerName,
    customerPhone,
    customerEmail,
    customerGST,
    customerStateCode,
    placeOfSupply,
    gstData,
    taxableTotal,
    grandTotal,
    amountInWords,
    upiId,
    upiQrUrl,
    fullCustomerAddress,
    fullShippingAddress,
  } = data;

  return (
    <>
      <style>{invoiceCss}</style>

      <div className="invoice-preview-wrapper">
        <div className="invoice-paper">

          <div className="invoice-watermark">
            <img
              src={logoImg}
              alt="Vraj Creation Logo"
            />
          </div>

          <div className="seller-header">
            <h1>VRAJ CREATION</h1>

            <p>
              Madhuban Colony, Basni, Jodhpur (Raj.)
            </p>

            <p>
              GSTIN: 08AADPO3512A1ZB
              &nbsp;&nbsp; | &nbsp;&nbsp;
              PAN: AADPO3512A
            </p>

            <div className="invoice-title">
              {invoiceType}
            </div>
          </div>

          <div className="customer-grid">

            <div className="customer-box">

              <div className="!m-0 !block !w-full !border-b !border-black !px-1 !py-1 !box-border text-[9px] font-black uppercase leading-tight">
                Details of Receiver / Billed To
              </div>

              <div className="customer-row">
                <b>Name:</b>{" "}
                {customerName}
              </div>

              <div className="customer-row">
                <b>Address:</b>

                <div className="address">
                  {fullCustomerAddress ||
                    "N/A"}
                </div>
              </div>

              <div className="customer-row">
                <b>Mobile:</b>{" "}
                {customerPhone ||
                  "N/A"}
              </div>

              {customerEmail ? (
                <div className="customer-row">
                  <b>Email:</b>{" "}
                  {customerEmail}
                </div>
              ) : null}

              {invoiceType === "GST Invoice" && (
                <div className="customer-row">
                  <b>Customer GSTIN:</b>{" "}
                  {customerGST ||
                    "N/A"}
                </div>
              )}

              <div className="customer-row">
                <b>State Code:</b>{" "}
                {customerStateCode ||
                  "N/A"}
              </div>
            </div>

            <div className="customer-box">

              <div className="!m-0 !block !w-full !border-b !border-black !px-1 !py-1 !box-border text-[9px] font-black uppercase leading-tight">
                Details of Consignee / Shipped To
              </div>

              <div className="customer-row">
                <b>Name:</b>{" "}
                {customerName}
              </div>

              <div className="customer-row">
                <b>Shipping Address:</b>

                <div className="address">
                  {fullShippingAddress ||
                    "N/A"}
                </div>
              </div>

              <div className="customer-row">
                <b>Mobile:</b>{" "}
                {customerPhone ||
                  "N/A"}
              </div>

              {invoiceType === "GST Invoice" && (
                <div className="customer-row">
                  <b>Customer GSTIN:</b>{" "}
                  {customerGST ||
                    "N/A"}
                </div>
              )}

              <div className="customer-row">
                <b>State Code:</b>{" "}
                {customerStateCode ||
                  "N/A"}
              </div>
            </div>
          </div>

          <table className="invoice-details">
            <tbody>
              <tr>
                <td>
                  <b>Invoice No.</b>
                  <br />
                  {invoiceNo}
                </td>

                <td>
                  <b>Invoice Date</b>
                  <br />
                  {formattedDate}
                </td>

                <td>
                  <b>Place of Supply</b>
                  <br />
                  {placeOfSupply}
                </td>

                <td>
                  <b>State Code</b>
                  <br />
                  {customerStateCode ||
                    "-"}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="items-table">
            <thead>
              <tr>
                <th>S.No</th>

                <th>
                  Product ID - Name of Product
                </th>

                <th>
                  HSN
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Rate
                </th>

                {invoiceType === "GST Invoice" && (
                  <th>
                    GST
                  </th>
                )}

                <th>
                  Taxable Value
                </th>

                <th>
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length > 0 ? (
                items.map(
                  (item, index) => {
                    const productId =
                      item.productId ||
                      item.productCode ||
                      item.sku ||
                      item.id ||
                      "-";

                    const productName =
                      item.productName ||
                      item.name ||
                      "Item";

                    const hsnCode =
                      item.hsnCode ||
                      item.hsn ||
                      "-";

                    const quantity =
                      num(
                        item.quantity
                      );

                    const price =
                      num(item.price);

                    const gstRate =
                      invoiceType === "Without GST"
                        ? 0
                        : 5;

                    const itemDiscount =
                      num(
                        item.discount
                      );

                    const gross =
                      quantity * price;

                    const taxable =
                      Math.max(
                        0,
                        gross -
                          itemDiscount
                      );

                    const gstAmount =
                      (taxable *
                        gstRate) /
                      100;

                    const total =
                      taxable +
                      gstAmount;

                    return (
                      <tr
                        key={`${productId}-${index}`}
                      >
                        <td className="center">
                          {index + 1}
                        </td>

                        <td className="product-cell">
                          <strong>
                            {productId}
                          </strong>{" "}
                          -{" "}
                          {productName}
                        </td>

                        <td className="center">
                          {hsnCode}
                        </td>

                        <td className="center">
                          {quantity}
                        </td>

                        <td className="right">
                          ₹
                          {money(price)}
                        </td>

                        {invoiceType === "GST Invoice" && (
                          <td className="center">
                            {gstRate}%
                          </td>
                        )}

                        <td className="right">
                          ₹
                          {money(
                            taxable
                          )}
                        </td>

                        <td className="right">
                          ₹
                          {money(total)}
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={
                      invoiceType === "GST Invoice"
                        ? 8
                        : 7
                    }
                    className="center"
                  >
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="bottom-area">

            <div className="summary-wrapper">

              <div className="words-box">
                <b>
                  Amount in Words:
                </b>

                <br />

                {amountInWords}
              </div>

              <table className="tax-table">
                <tbody>

                  <tr>
                    <td>
                      <b>
                        Total Amount Before Tax
                      </b>
                    </td>

                    <td className="right">
                      ₹
                      {money(
                        taxableTotal
                      )}
                    </td>
                  </tr>

                  {invoiceType === "GST Invoice" && (
                    <>
                      {gstData.isRajasthan ? (
                        <>
                          <tr>
                            <td>
                              <b>
                                CGST (2.5%)
                              </b>
                            </td>

                            <td className="right">
                              ₹
                              {money(
                                gstData.totalCGST
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <b>
                                SGST (2.5%)
                              </b>
                            </td>

                            <td className="right">
                              ₹
                              {money(
                                gstData.totalSGST
                              )}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td>
                            <b>
                              IGST (5%)
                            </b>
                          </td>

                          <td className="right">
                            ₹
                            {money(
                              gstData.totalIGST
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )}

                  <tr className="total-row">
                    <td>
                      <b>
                        Total Amount After Tax
                      </b>
                    </td>

                    <td className="right">
                      ₹
                      {money(
                        grandTotal
                      )}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            <div className="bank-terms">

              <div className="bank-box">

                <div className="!m-0 !block !w-full !border-b !border-black !px-1 !py-1 !box-border text-[9px] font-black uppercase leading-tight">
                  Bank Details
                </div>

                <div className="bank-row">
                  <b>
                    Bank Name
                  </b>

                  <span>
                    Union Bank of India
                  </span>
                </div>

                <div className="bank-row">
                  <b>
                    Branch
                  </b>

                  <span>
                    Basni Jodhpur
                  </span>
                </div>

                <div className="bank-row">
                  <b>
                    A/C No.
                  </b>

                  <span>
                    401701010035985
                  </span>
                </div>

                <div className="bank-row">
                  <b>
                    IFSC Code
                  </b>

                  <span>
                    UBIN0540170
                  </span>
                </div>
              </div>

              <div className="terms-box">

                <div className="!m-0 !block !w-full !border-b !border-black !px-1 !py-1 !box-border text-[9px] font-black uppercase leading-tight">
                  Terms & Conditions
                </div>

                <ol className="!m-0 !w-full !box-border !py-1 !pr-1 !pl-5">

                  <li className="mb-[2px] text-[7.5px] leading-tight">
                    All disputes subject to Jodhpur jurisdiction.
                  </li>

                  <li className="mb-[2px] text-[7.5px] leading-tight">
                    Our responsibility ceases after goods leave our factory.
                  </li>

                  <li className="mb-[2px] text-[7.5px] leading-tight">
                    Once sold, goods will not be taken back or exchanged.
                  </li>

                  <li className="text-[7.5px] leading-tight">
                    Interest @ 24% will be charged if payment is not made within 15 days.
                  </li>

                </ol>
              </div>
            </div>

            <div className="signature-payment">

              <div className="payment-qr-box">

                <div className="qr-label">
                  PAYMENT QR
                </div>

                <img
                  src={upiQrUrl}
                  className="payment-qr"
                  alt="UPI Payment QR"
                />

                <div className="qr-title">
                  SCAN & PAY
                </div>

                <div className="qr-amount">
                  ₹{money(grandTotal)}
                </div>

                <div className="qr-upi">
                  {upiId}
                </div>
              </div>

              <div className="signature">
                <div className="signature-line">
                  Authorized Signatory
                  <br />
                  <b>
                    VRAJ CREATION
                  </b>
                </div>
              </div>
            </div>

            <div className="invoice-footer">
              This is a computer-generated {invoiceType || "invoice"}.
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

// =====================================================
// PREVIEW MODAL
// =====================================================
const InvoicePreviewModal = ({
  bill,
  onClose,
  onPrint,
  darkMode,
}) => {
  if (!bill) {
    return null;
  }

  return (
    <div className="preview-modal fixed inset-0 z-[9999] bg-black/70">

      <div
        className={`flex h-[100dvh] w-full flex-col ${
          darkMode
            ? "bg-gray-950"
            : "bg-gray-100"
        }`}
      >

        {/* HEADER */}
        <div
          className={`flex shrink-0 items-center justify-between border-b px-3 py-3 shadow-sm md:px-5 ${
            darkMode
              ? "border-gray-800 bg-gray-900"
              : "border-gray-200 bg-white"
          }`}
        >

          <div className="min-w-0">
            <h2
              className={`truncate text-base font-bold md:text-lg ${
                darkMode
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              Invoice Preview
            </h2>

            <p
              className={`truncate text-[11px] md:text-xs ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              {bill.invoiceNo ||
                bill.billNumber ||
                "Invoice"}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                darkMode
                  ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Close
            </button>

          </div>
        </div>

        {/* PREVIEW AREA */}
        <div
          className={`min-h-0 flex-1 overflow-auto p-2 sm:p-4 md:p-8 ${
            darkMode
              ? "bg-gray-800"
              : "bg-gray-200"
          }`}
        >

          <div className="mx-auto w-full max-w-[900px]">

            <InvoiceContent
              bill={bill}
            />

          </div>

        </div>
      </div>
    </div>
  );
};

// =====================================================
// MOBILE BILL CARD
// =====================================================
const MobileBillCard = ({
  bill,
  deletingId,
  onEdit,
  onPreview,
  onPrint,
  onDelete,
  darkMode,
}) => {
  const id =
    bill._id ||
    bill.id;

  const billNo =
    bill.invoiceNo ||
    bill.billNumber ||
    "-";

  const customer =
    bill.customer ||
    {};

  const customerName =
    customer.name ||
    bill.customerName ||
    "Walk-in Customer";

  const grandTotal =
    bill.grandTotal ??
    bill.total ??
    bill.totalAmount ??
    0;

  const date =
    bill.invoiceDate ||
    bill.createdAt;

  const formattedDate =
    date
      ? new Date(
          date
        ).toLocaleDateString(
          "en-IN"
        )
      : "-";

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        darkMode
          ? "border-gray-800 bg-gray-900"
          : "border-gray-200 bg-white"
      }`}
    >

      {/* TOP */}
      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${
              darkMode
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            Bill No
          </p>

          <p
            className={`mt-0.5 break-all text-sm font-bold ${
              darkMode
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            {billNo}
          </p>

        </div>

        <div className="shrink-0 text-right">

          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${
              darkMode
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            Total
          </p>

          <p
            className={`mt-0.5 text-base font-bold ${
              darkMode
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            ₹{money(grandTotal)}
          </p>

        </div>
      </div>

      {/* DETAILS */}
      <div
        className={`mt-4 grid grid-cols-2 gap-3 border-t pt-3 ${
          darkMode
            ? "border-gray-800"
            : "border-gray-100"
        }`}
      >

        <div className="min-w-0">
          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${
              darkMode
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            Customer
          </p>

          <p
            className={`mt-0.5 truncate text-sm font-medium ${
              darkMode
                ? "text-gray-200"
                : "text-gray-800"
            }`}
          >
            {customerName}
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${
              darkMode
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            Date
          </p>

          <p
            className={`mt-0.5 text-sm ${
              darkMode
                ? "text-gray-300"
                : "text-gray-700"
            }`}
          >
            {formattedDate}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-4 grid grid-cols-2 gap-2">

        <button
          type="button"
          onClick={() =>
            onEdit(bill)
          }
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            darkMode
              ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() =>
            onPreview(bill)
          }
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            darkMode
              ? "border-blue-900 bg-blue-950 text-blue-300 hover:bg-blue-900"
              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          Preview
        </button>

        <button
          type="button"
          onClick={() =>
            onPrint(bill)
          }
          className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          Print
        </button>

        <button
          type="button"
          disabled={
            deletingId === id
          }
          onClick={() =>
            onDelete(bill)
          }
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingId === id
            ? "Deleting..."
            : "Delete"}
        </button>

      </div>
    </div>
  );
};

// =====================================================
// GLOBAL THEME DETECTOR
// =====================================================
// Header/global theme ko detect karta hai.
// Koi naya Light/Dark toggle nahi banaya gaya.
// =====================================================
const getGlobalDarkMode = () => {
  const htmlDark =
    document.documentElement.classList.contains(
      "dark"
    );

  const bodyDark =
    document.body.classList.contains(
      "dark"
    );

  const htmlTheme =
    document.documentElement.getAttribute(
      "data-theme"
    );

  const bodyTheme =
    document.body.getAttribute(
      "data-theme"
    );

  return (
    htmlDark ||
    bodyDark ||
    htmlTheme === "dark" ||
    bodyTheme === "dark"
  );
};

// =====================================================
// BILLS LIST
// =====================================================
const BillsList = () => {
  const [bills, setBills] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const [previewBill, setPreviewBill] =
    useState(null);

  const [printingBill, setPrintingBill] =
    useState(null);

  // ===================================================
  // GLOBAL HEADER THEME
  // ===================================================
  const [darkMode, setDarkMode] =
    useState(() =>
      getGlobalDarkMode()
    );

  const navigate =
    useNavigate();

  // ===================================================
  // LISTEN TO HEADER THEME CHANGES
  // ===================================================
  useEffect(() => {
    const updateTheme = () => {
      setDarkMode(
        getGlobalDarkMode()
      );
    };

    updateTheme();

    const observer =
      new MutationObserver(
        updateTheme
      );

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: [
          "class",
          "data-theme",
        ],
      }
    );

    observer.observe(
      document.body,
      {
        attributes: true,
        attributeFilter: [
          "class",
          "data-theme",
        ],
      }
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  // ===================================================
  // FETCH BILLS
  // ===================================================
  const fetchBills = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/bills");

      const data =
        response.data;

      if (
        Array.isArray(
          data?.bills
        )
      ) {
        setBills(
          data.bills
        );
      } else if (
        Array.isArray(data)
      ) {
        setBills(data);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error(
        "Failed to fetch bills:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
        "Failed to load bills."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // ===================================================
  // AFTER PRINT
  // ===================================================
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintingBill(null);
    };

    window.addEventListener(
      "afterprint",
      handleAfterPrint
    );

    return () => {
      window.removeEventListener(
        "afterprint",
        handleAfterPrint
      );
    };
  }, []);

  // ===================================================
  // DELETE BILL
  // ===================================================
  const handleDeleteBill = async (
    bill
  ) => {
    const id =
      bill._id ||
      bill.id;

    const billNo =
      bill.invoiceNo ||
      bill.billNumber ||
      "this bill";

    if (!id) {
      alert(
        "Bill ID not found."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${billNo}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await api.delete(
        `/bills/${id}`
      );

      setBills((prev) =>
        prev.filter(
          (item) =>
            (item._id ||
              item.id) !== id
        )
      );

      if (
        previewBill &&
        (previewBill._id ||
          previewBill.id) === id
      ) {
        setPreviewBill(null);
      }
    } catch (err) {
      console.error(
        "Delete bill error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
        "Failed to delete bill."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // EDIT BILL
  // ===================================================
  const handleEditBill = (
    bill
  ) => {
    const id =
      bill._id ||
      bill.id;

    if (!id) {
      alert(
        "Bill ID not found."
      );

      return;
    }

    navigate(
      `/edit-bill/${id}`
    );
  };

  // ===================================================
  // PREVIEW BILL
  // ===================================================
  const handlePreviewBill = (
    bill
  ) => {
    setPreviewBill(bill);
  };

  // ===================================================
  // PRINT BILL
  // ===================================================
  const handlePrintBill = (
    bill
  ) => {
    if (!bill) {
      return;
    }

    setPreviewBill(null);
    setPrintingBill(bill);
  };

  // ===================================================
  // START PRINT
  // ===================================================
  useEffect(() => {
    if (!printingBill) {
      return;
    }

    let cancelled = false;

    const startPrint = async () => {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            250
          )
      );

      if (cancelled) {
        return;
      }

      const printArea =
        document.querySelector(
          ".print-area"
        );

      if (!printArea) {
        return;
      }

      const images =
        Array.from(
          printArea.querySelectorAll(
            "img"
          )
        );

      if (images.length > 0) {
        await Promise.all(
          images.map(
            (image) => {
              if (
                image.complete
              ) {
                return Promise.resolve();
              }

              return new Promise(
                (resolve) => {
                  let finished = false;

                  const done =
                    () => {
                      if (
                        finished
                      ) {
                        return;
                      }

                      finished = true;
                      resolve();
                    };

                  image.addEventListener(
                    "load",
                    done,
                    {
                      once: true,
                    }
                  );

                  image.addEventListener(
                    "error",
                    done,
                    {
                      once: true,
                    }
                  );

                  setTimeout(
                    done,
                    3000
                  );
                }
              );
            }
          )
        );
      }

      if (cancelled) {
        return;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            200
          )
      );

      if (!cancelled) {
        window.print();
      }
    };

    startPrint();

    return () => {
      cancelled = true;
    };
  }, [printingBill]);

  // ===================================================
  // LOADING
  // ===================================================
  if (loading) {
    return (
      <div
        className={`flex min-h-[400px] items-center justify-center ${
          darkMode
            ? "bg-gray-950"
            : "bg-gray-50"
        }`}
      >

        <div className="text-center">

          <div
            className={`mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 ${
              darkMode
                ? "border-gray-700 border-t-gray-200"
                : "border-gray-300 border-t-gray-800"
            }`}
          />

          <p
            className={`text-sm ${
              darkMode
                ? "text-gray-300"
                : "text-gray-600"
            }`}
          >
            Loading bills...
          </p>

        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN
  // ===================================================
  return (
    <>
      {/* =================================================
          PRINT CSS
      ================================================= */}
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 5mm 10mm;
          }

          @media print {

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm !important;
              min-width: 210mm !important;
              background: #ffffff !important;
              color: #111111 !important;
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

            .screen-only,
            .preview-modal {
              display: none !important;
              visibility: hidden !important;
            }

            .print-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            .print-area .invoice-preview-wrapper {
              display: block !important;
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-area .invoice-paper {
              display: flex !important;
              width: 190mm !important;
              height: 287mm !important;
              min-height: 287mm !important;
              max-height: 287mm !important;
              margin: 0 auto !important;
              border: 1.5px solid #222 !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }
          }
        `}
      </style>

      {/* =================================================
          SCREEN UI
      ================================================= */}
      <div
        className={`screen-only min-h-screen p-3 transition-colors sm:p-4 md:p-6 ${
          darkMode
            ? "bg-gray-950 text-gray-100"
            : "bg-gray-50 text-gray-900"
        }`}
      >

        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">

            <h1
              className={`text-xl font-bold sm:text-2xl ${
                darkMode
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              All Generated Bills & Invoices
            </h1>

            <p
              className={`mt-1 text-xs sm:text-sm ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              View, preview, edit, print and manage generated bills.
            </p>

          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/generate-bill"
                )
              }
              className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 sm:w-auto"
            >
              + Generate New Bill
            </button>

          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              darkMode
                ? "border-red-900 bg-red-950/50 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}
        <div
          className={`hidden overflow-hidden rounded-xl border shadow-sm md:block ${
            darkMode
              ? "border-gray-800 bg-gray-900"
              : "border-gray-200 bg-white"
          }`}
        >

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead>
                <tr
                  className={`border-b ${
                    darkMode
                      ? "border-gray-800 bg-gray-800"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >

                  <th
                    className={`whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Bill No
                  </th>

                  <th
                    className={`whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Customer Name
                  </th>

                  <th
                    className={`whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Grand Total
                  </th>

                  <th
                    className={`whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Date
                  </th>

                  <th
                    className={`whitespace-nowrap px-5 py-3 text-right text-xs font-bold uppercase tracking-wide ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  darkMode
                    ? "divide-gray-800"
                    : "divide-gray-100"
                }`}
              >

                {bills.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-16 text-center"
                    >
                      <div
                        className={
                          darkMode
                            ? "text-gray-600"
                            : "text-gray-400"
                        }
                      >
                        <div className="mb-2 text-4xl">
                          📄
                        </div>

                        <p
                          className={`text-base font-semibold ${
                            darkMode
                              ? "text-gray-300"
                              : "text-gray-600"
                          }`}
                        >
                          No bills found
                        </p>

                        <p
                          className={`mt-1 text-sm ${
                            darkMode
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          Generate your first bill to see it here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bills.map(
                    (bill) => {

                      const id =
                        bill._id ||
                        bill.id;

                      const billNo =
                        bill.invoiceNo ||
                        bill.billNumber ||
                        "-";

                      const customer =
                        bill.customer ||
                        {};

                      const customerName =
                        customer.name ||
                        bill.customerName ||
                        "Walk-in Customer";

                      const grandTotal =
                        bill.grandTotal ??
                        bill.total ??
                        bill.totalAmount ??
                        0;

                      const date =
                        bill.invoiceDate ||
                        bill.createdAt;

                      const formattedDate =
                        date
                          ? new Date(
                              date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-";

                      return (
                        <tr
                          key={id}
                          className={`transition ${
                            darkMode
                              ? "hover:bg-gray-800"
                              : "hover:bg-gray-50"
                          }`}
                        >

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-sm font-semibold ${
                              darkMode
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {billNo}
                          </td>

                          <td
                            className={`max-w-[220px] truncate px-5 py-4 text-sm ${
                              darkMode
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            {customerName}
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-sm font-bold ${
                              darkMode
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            ₹
                            {money(
                              grandTotal
                            )}
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-sm ${
                              darkMode
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {formattedDate}
                          </td>

                          <td className="px-5 py-4">

                            <div className="flex flex-wrap justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditBill(
                                    bill
                                  )
                                }
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  darkMode
                                    ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handlePreviewBill(
                                    bill
                                  )
                                }
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  darkMode
                                    ? "border-blue-900 bg-blue-950 text-blue-300 hover:bg-blue-900"
                                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                }`}
                              >
                                Preview
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handlePrintBill(
                                    bill
                                  )
                                }
                                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                              >
                                Print
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  id
                                }
                                onClick={() =>
                                  handleDeleteBill(
                                    bill
                                  )
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                  id
                                  ? "Deleting..."
                                  : "Delete"}
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

        {/* =================================================
            MOBILE LIST
        ================================================= */}
        <div className="space-y-3 md:hidden">

          {bills.length === 0 ? (
            <div
              className={`rounded-xl border px-5 py-16 text-center shadow-sm ${
                darkMode
                  ? "border-gray-800 bg-gray-900"
                  : "border-gray-200 bg-white"
              }`}
            >

              <div className="mb-2 text-4xl">
                📄
              </div>

              <p
                className={`text-base font-semibold ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-600"
                }`}
              >
                No bills found
              </p>

              <p
                className={`mt-1 text-sm ${
                  darkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                Generate your first bill to see it here.
              </p>

            </div>
          ) : (
            bills.map(
              (bill) => (
                <MobileBillCard
                  key={
                    bill._id ||
                    bill.id
                  }
                  bill={bill}
                  deletingId={
                    deletingId
                  }
                  onEdit={
                    handleEditBill
                  }
                  onPreview={
                    handlePreviewBill
                  }
                  onPrint={
                    handlePrintBill
                  }
                  onDelete={
                    handleDeleteBill
                  }
                  darkMode={
                    darkMode
                  }
                />
              )
            )
          )}

        </div>

        {/* BILL COUNT */}
        {bills.length > 0 && (
          <div
            className={`mt-4 text-xs sm:text-sm ${
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >

            Total bills:{" "}

            <span
              className={`font-semibold ${
                darkMode
                  ? "text-gray-200"
                  : "text-gray-700"
              }`}
            >
              {bills.length}
            </span>

          </div>
        )}

      </div>

      {/* =================================================
          PREVIEW MODAL
      ================================================= */}
      {previewBill && (
        <InvoicePreviewModal
          bill={previewBill}

          onClose={() =>
            setPreviewBill(null)
          }

          onPrint={() =>
            handlePrintBill(
              previewBill
            )
          }

          darkMode={
            darkMode
          }
        />
      )}

      {/* =================================================
          PRINT AREA
      ================================================= */}
      <div
        className="print-area"
        style={{
          display: "none",
        }}
      >
        {printingBill && (
          <InvoiceContent
            bill={printingBill}
          />
        )}
      </div>
    </>
  );
};

export default BillsList;