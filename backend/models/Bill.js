const mongoose = require("mongoose");

// =====================================================
// BILL SCHEMA
// =====================================================
const billSchema = new mongoose.Schema(
  {
    // =====================================================
    // BILL NUMBER
    // =====================================================
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =====================================================
    // INVOICE TYPE
    // =====================================================
    invoiceType: {
      type: String,
      enum: [
        "GST Invoice",
        "Non-GST Invoice",
        "Without GST",
      ],
      default: "GST Invoice",
      trim: true,
    },

    // =====================================================
    // CUSTOMER INFORMATION
    // =====================================================
    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    customerGst: {
      type: String,
      default: "",
      trim: true,
    },

    customerGSTIN: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // CUSTOMER COMPLETE OBJECT
    // =====================================================
    customer: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      gstin: {
        type: String,
        default: "",
        trim: true,
      },

      billingAddress: {
        type: String,
        default: "",
        trim: true,
      },

      shippingAddress: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
      },

      state: {
        type: String,
        default: "",
        trim: true,
      },

      stateCode: {
        type: String,
        default: "",
        trim: true,
      },

      pincode: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // =====================================================
    // CUSTOMER ADDRESS - COMPATIBILITY FIELDS
    // =====================================================
    customerAddress: {
      type: String,
      default: "",
      trim: true,
    },

    customerBillingAddress: {
      type: String,
      default: "",
      trim: true,
    },

    billingAddress: {
      type: String,
      default: "",
      trim: true,
    },

    customerShippingAddress: {
      type: String,
      default: "",
      trim: true,
    },

    shippingAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // CUSTOMER LOCATION
    // =====================================================
    customerCity: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    customerState: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    customerStateCode: {
      type: String,
      default: "",
      trim: true,
    },

    stateCode: {
      type: String,
      default: "",
      trim: true,
    },

    customerPincode: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // PLACE OF SUPPLY
    // =====================================================
    placeOfSupply: {
      type: String,
      default: "",
      trim: true,
    },

    placeOfSupplyState: {
      type: String,
      default: "",
      trim: true,
    },

    placeOfSupplyStateCode: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // BUSINESS GST
    // =====================================================
    businessGst: {
      type: String,
      default: "08AATPQ4257E1ZB",
      trim: true,
    },

    // =====================================================
    // BILL ITEMS
    // =====================================================
    items: [
      {
        // =================================================
        // PRODUCT ID
        // =================================================
        productId: {
          type: String,
          default: "",
          trim: true,
        },

        // =================================================
        // PRODUCT NAME
        // =================================================
        productName: {
          type: String,
          required: true,
          trim: true,
        },

        // =================================================
        // HSN CODE
        // =================================================
        hsnCode: {
          type: String,
          default: "7326",
          trim: true,
        },

        // =================================================
        // QUANTITY
        // =================================================
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },

        // =================================================
        // PRICE / RATE
        // =================================================
        price: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },

        // =================================================
        // GST RATE
        // =================================================
        gstRate: {
          type: Number,
          min: 0,
          default: 18,
        },

        // =================================================
        // TOTAL AMOUNT BEFORE TAX
        // =================================================
        taxableAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        // =================================================
        // TAX AMOUNT
        // =================================================
        taxAmount: {
          type: Number,
          min: 0,
          default: 0,
        },

        // =================================================
        // TOTAL AMOUNT AFTER TAX
        // =================================================
        totalAmount: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],

    // =====================================================
    // BILL TOTALS
    // =====================================================

    // Total Amount Before Tax
    subTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Total GST
    totalTax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Total Amount After Tax
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // =====================================================
    // SUMMARY
    // =====================================================
    summary: {
      // Total before tax
      subTotal: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Total tax
      totalTax: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Total after tax
      grandTotal: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Total Amount Before Tax
      totalAmountBeforeTax: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Total Amount After Tax
      totalAmountAfterTax: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // =====================================================
    // PAYMENT STATUS
    // =====================================================
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Partial",
        "Unpaid",
      ],
      default: "Pending",
    },

    // =====================================================
    // CREATED BY
    // =====================================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// EXPORT MODEL
// =====================================================
module.exports = mongoose.model("Bill", billSchema);