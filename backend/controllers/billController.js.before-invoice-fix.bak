const Bill = require("../models/Bill");

// =====================================================
// GET NEXT UNIQUE BILL NUMBER
// =====================================================
const getNextBillNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `VRAJ-${year}-`;

  // Current year ke bills find karo
  const bills = await Bill.find({
    billNumber: {
      $regex: `^${prefix}`,
    },
  })
    .select("billNumber")
    .lean();

  let maxNumber = 0;

  for (const bill of bills) {
    const match = String(bill.billNumber || "").match(
      new RegExp(`^VRAJ-${year}-(\\d+)$`)
    );

    if (match) {
      const number = Number(match[1]);

      if (Number.isFinite(number) && number > maxNumber) {
        maxNumber = number;
      }
    }
  }

  let nextNumber = maxNumber + 1;

  // Extra safety check
  while (true) {
    const billNumber = `${prefix}${String(nextNumber).padStart(
      3,
      "0"
    )}`;

    const exists = await Bill.exists({
      billNumber,
    });

    if (!exists) {
      return billNumber;
    }

    nextNumber++;
  }
};

// =====================================================
// GENERATE BILL
// =====================================================
const generateBill = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerGst,
      customerGSTIN,

      customer,

      customerAddress,
      customerBillingAddress,
      customerShippingAddress,
      billingAddress,
      shippingAddress,

      customerCity,
      city,

      customerState,
      state,

      customerStateCode,
      stateCode,

      customerPincode,
      pincode,

      placeOfSupply,
      placeOfSupplyState,
      placeOfSupplyStateCode,

      items,
      paymentStatus,

      // =================================================
      // INVOICE TYPE
      // =================================================
      invoiceType,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required.",
      });
    }

    // =====================================================
    // INVOICE TYPE
    // =====================================================
    const normalizedInvoiceType = String(
      invoiceType || "GST Invoice"
    ).trim();

    const isGSTInvoice =
      normalizedInvoiceType === "GST Invoice";

    // =====================================================
    // CUSTOMER DATA
    // =====================================================
    const customerData = customer || {};

    const finalCustomerName =
      customerData.name ||
      customerName ||
      "";

    const finalCustomerEmail =
      customerData.email ||
      customerEmail ||
      "";

    const finalCustomerPhone =
      customerData.phone ||
      customerPhone ||
      "";

    const finalCustomerGstin =
      customerData.gstin ||
      customerGSTIN ||
      customerGst ||
      "";

    const finalBillingAddress =
      customerData.billingAddress ||
      customerData.address ||
      customerAddress ||
      customerBillingAddress ||
      billingAddress ||
      "";

    const finalShippingAddress =
      customerData.shippingAddress ||
      customerShippingAddress ||
      shippingAddress ||
      finalBillingAddress ||
      "";

    const finalCity =
      customerData.city ||
      customerCity ||
      city ||
      "";

    const finalState =
      customerData.state ||
      customerState ||
      state ||
      "";

    const finalStateCode =
      customerData.stateCode ||
      customerStateCode ||
      stateCode ||
      "";

    const finalPincode =
      customerData.pincode ||
      customerPincode ||
      pincode ||
      "";

    // =====================================================
    // PLACE OF SUPPLY
    // =====================================================
    let finalPlaceOfSupply =
      placeOfSupply || "";

    if (!finalPlaceOfSupply && finalState) {
      finalPlaceOfSupply = finalStateCode
        ? `${finalState} (${finalStateCode})`
        : finalState;
    }

    const finalPlaceOfSupplyState =
      placeOfSupplyState ||
      finalState ||
      "";

    const finalPlaceOfSupplyStateCode =
      placeOfSupplyStateCode ||
      finalStateCode ||
      "";

    // =====================================================
    // CALCULATE ITEMS
    // =====================================================
    let subTotal = 0;
    let totalTax = 0;

    const formattedItems = items.map((item) => {
      const quantity = Math.max(
        Number(item.quantity) || 0,
        0
      );

      const price = Math.max(
        Number(item.price) || 0,
        0
      );

      // =================================================
      // GST LOGIC
      // GST Invoice = 5%
      // Non-GST Invoice = 0%
      // Without GST = 0%
      // =================================================
      const gstRate = isGSTInvoice ? 5 : 0;

      const taxableAmount =
        quantity * price;

      const taxAmount =
        (taxableAmount * gstRate) / 100;

      const totalAmount =
        taxableAmount + taxAmount;

      subTotal += taxableAmount;
      totalTax += taxAmount;

      return {
        productId:
          item.productId ||
          item.productID ||
          item.id ||
          "",

        productName:
          item.productName ||
          item.name ||
          "",

        hsnCode:
          item.hsnCode ||
          item.hsn ||
          "7326",

        quantity,
        price,
        gstRate,

        taxableAmount: Number(
          taxableAmount.toFixed(2)
        ),

        taxAmount: Number(
          taxAmount.toFixed(2)
        ),

        totalAmount: Number(
          totalAmount.toFixed(2)
        ),
      };
    });

    // =====================================================
    // ROUND TOTALS
    // =====================================================
    subTotal = Number(
      subTotal.toFixed(2)
    );

    totalTax = Number(
      totalTax.toFixed(2)
    );

    const grandTotal = Number(
      (subTotal + totalTax).toFixed(2)
    );

    // =====================================================
    // CREATE BILL WITH DUPLICATE PROTECTION
    // =====================================================

    let newBill = null;
    let lastError = null;

    // Maximum 5 attempts
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // Every attempt gets a fresh unique number
        const billNumber =
          await getNextBillNumber();

        newBill = await Bill.create({
          billNumber,

          // =================================================
          // INVOICE TYPE
          // =================================================
          invoiceType:
            normalizedInvoiceType,

          // ===================================================
          // OLD CUSTOMER FIELDS
          // ===================================================
          customerName:
            finalCustomerName,

          customerEmail:
            finalCustomerEmail,

          customerPhone:
            finalCustomerPhone,

          customerGst:
            finalCustomerGstin,

          customerGSTIN:
            finalCustomerGstin,

          // ===================================================
          // CUSTOMER OBJECT
          // ===================================================
          customer: {
            name:
              finalCustomerName,

            email:
              finalCustomerEmail,

            phone:
              finalCustomerPhone,

            gstin:
              finalCustomerGstin,

            billingAddress:
              finalBillingAddress,

            shippingAddress:
              finalShippingAddress,

            city:
              finalCity,

            state:
              finalState,

            stateCode:
              finalStateCode,

            pincode:
              finalPincode,
          },

          // ===================================================
          // FLAT CUSTOMER FIELDS
          // ===================================================
          customerAddress:
            finalBillingAddress,

          customerBillingAddress:
            finalBillingAddress,

          billingAddress:
            finalBillingAddress,

          customerShippingAddress:
            finalShippingAddress,

          shippingAddress:
            finalShippingAddress,

          customerCity:
            finalCity,

          city:
            finalCity,

          customerState:
            finalState,

          state:
            finalState,

          customerStateCode:
            finalStateCode,

          stateCode:
            finalStateCode,

          customerPincode:
            finalPincode,

          pincode:
            finalPincode,

          // ===================================================
          // PLACE OF SUPPLY
          // ===================================================
          placeOfSupply:
            finalPlaceOfSupply,

          placeOfSupplyState:
            finalPlaceOfSupplyState,

          placeOfSupplyStateCode:
            finalPlaceOfSupplyStateCode,

          // ===================================================
          // ITEMS
          // ===================================================
          items:
            formattedItems,

          // ===================================================
          // TOTALS
          // ===================================================
          subTotal,

          totalTax,

          grandTotal,

          // ===================================================
          // SUMMARY
          // ===================================================
          summary: {
            subTotal,

            totalTax,

            grandTotal,

            totalAmountBeforeTax:
              subTotal,

            totalAmountAfterTax:
              grandTotal,
          },

          // ===================================================
          // PAYMENT STATUS
          // ===================================================
          paymentStatus:
            paymentStatus || "Pending",

          // ===================================================
          // USER
          // ===================================================
          createdBy:
            req.user._id,
        });

        // Successfully created
        break;
      } catch (error) {
        lastError = error;

        // MongoDB duplicate key error
        if (
          error &&
          error.code === 11000 &&
          error.keyPattern &&
          error.keyPattern.billNumber
        ) {
          console.log(
            "Duplicate bill number detected. Retrying..."
          );

          continue;
        }

        // Any other error
        throw error;
      }
    }

    // =====================================================
    // IF BILL STILL NOT CREATED
    // =====================================================
    if (!newBill) {
      console.error(
        "BILL CREATION FAILED AFTER RETRIES:",
        lastError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to generate a unique bill number. Please try again.",
        error:
          lastError?.message ||
          "Unknown error",
      });
    }

    // =====================================================
    // SUCCESS
    // =====================================================
    return res.status(201).json({
      success: true,

      message:
        "Bill generated successfully!",

      bill:
        newBill,
    });
  } catch (error) {
    console.error(
      "GENERATE BILL ERROR:",
      error
    );

    // =====================================================
    // DUPLICATE KEY SAFETY
    // =====================================================
    if (
      error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,

        message:
          "Duplicate bill number detected. Please generate the bill again.",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate bill",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET ALL BILLS
// =====================================================
const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      count:
        bills.length,

      bills,
    });
  } catch (error) {
    console.error(
      "GET ALL BILLS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch bills",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET SINGLE BILL
// =====================================================
const getBillById = async (req, res) => {
  try {
    const bill =
      await Bill.findById(
        req.params.id
      );

    if (!bill) {
      return res.status(404).json({
        success: false,

        message:
          "Bill not found",
      });
    }

    return res.status(200).json({
      success: true,

      bill,
    });
  } catch (error) {
    console.error(
      "GET BILL BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch bill",

      error:
        error.message,
    });
  }
};

// =====================================================
// UPDATE BILL
// =====================================================
const updateBill = async (req, res) => {
  try {
    const { id } =
      req.params;

    // ===================================================
    // FIND BILL
    // ===================================================
    const bill =
      await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({
        success: false,

        message:
          "Bill not found",
      });
    }

    const data =
      req.body;

    // ===================================================
    // INVOICE TYPE
    // ===================================================
    const normalizedInvoiceType = String(
      data.invoiceType ??
      bill.invoiceType ??
      "GST Invoice"
    ).trim();

    const isGSTInvoice =
      normalizedInvoiceType === "GST Invoice";

    bill.invoiceType =
      normalizedInvoiceType;

    // ===================================================
    // CUSTOMER DATA
    // ===================================================
    const customerData =
      data.customer || {};

    const finalCustomerName =
      customerData.name ??
      data.customerName ??
      bill.customerName ??
      "";

    const finalCustomerEmail =
      customerData.email ??
      data.customerEmail ??
      bill.customerEmail ??
      "";

    const finalCustomerPhone =
      customerData.phone ??
      data.customerPhone ??
      bill.customerPhone ??
      "";

    const finalCustomerGstin =
      customerData.gstin ??
      data.customerGSTIN ??
      data.customerGst ??
      bill.customerGSTIN ??
      bill.customerGst ??
      "";

    const finalBillingAddress =
      customerData.billingAddress ??
      data.customerBillingAddress ??
      data.billingAddress ??
      data.customerAddress ??
      bill.customerBillingAddress ??
      bill.billingAddress ??
      bill.customerAddress ??
      "";

    const finalShippingAddress =
      customerData.shippingAddress ??
      data.customerShippingAddress ??
      data.shippingAddress ??
      bill.customerShippingAddress ??
      bill.shippingAddress ??
      finalBillingAddress;

    const finalCity =
      customerData.city ??
      data.customerCity ??
      data.city ??
      bill.customerCity ??
      bill.city ??
      "";

    const finalState =
      customerData.state ??
      data.customerState ??
      data.state ??
      bill.customerState ??
      bill.state ??
      "";

    const finalStateCode =
      customerData.stateCode ??
      data.customerStateCode ??
      data.stateCode ??
      bill.customerStateCode ??
      bill.stateCode ??
      "";

    const finalPincode =
      customerData.pincode ??
      data.customerPincode ??
      data.pincode ??
      bill.customerPincode ??
      bill.pincode ??
      "";

    // ===================================================
    // PLACE OF SUPPLY
    // ===================================================
    let finalPlaceOfSupply =
      data.placeOfSupply ??
      bill.placeOfSupply ??
      "";

    if (
      !finalPlaceOfSupply &&
      finalState
    ) {
      finalPlaceOfSupply =
        finalStateCode
          ? `${finalState} (${finalStateCode})`
          : finalState;
    }

    const finalPlaceOfSupplyState =
      data.placeOfSupplyState ??
      bill.placeOfSupplyState ??
      finalState;

    const finalPlaceOfSupplyStateCode =
      data.placeOfSupplyStateCode ??
      bill.placeOfSupplyStateCode ??
      finalStateCode;

    // ===================================================
    // UPDATE CUSTOMER
    // ===================================================
    bill.customerName =
      finalCustomerName;

    bill.customerEmail =
      finalCustomerEmail;

    bill.customerPhone =
      finalCustomerPhone;

    bill.customerGst =
      finalCustomerGstin;

    bill.customerGSTIN =
      finalCustomerGstin;

    bill.customer = {
      name:
        finalCustomerName,

      email:
        finalCustomerEmail,

      phone:
        finalCustomerPhone,

      gstin:
        finalCustomerGstin,

      billingAddress:
        finalBillingAddress,

      shippingAddress:
        finalShippingAddress,

      city:
        finalCity,

      state:
        finalState,

      stateCode:
        finalStateCode,

      pincode:
        finalPincode,
    };

    // ===================================================
    // UPDATE FLAT ADDRESS FIELDS
    // ===================================================
    bill.customerAddress =
      finalBillingAddress;

    bill.customerBillingAddress =
      finalBillingAddress;

    bill.billingAddress =
      finalBillingAddress;

    bill.customerShippingAddress =
      finalShippingAddress;

    bill.shippingAddress =
      finalShippingAddress;

    bill.customerCity =
      finalCity;

    bill.city =
      finalCity;

    bill.customerState =
      finalState;

    bill.state =
      finalState;

    bill.customerStateCode =
      finalStateCode;

    bill.stateCode =
      finalStateCode;

    bill.customerPincode =
      finalPincode;

    bill.pincode =
      finalPincode;

    // ===================================================
    // PLACE OF SUPPLY
    // ===================================================
    bill.placeOfSupply =
      finalPlaceOfSupply;

    bill.placeOfSupplyState =
      finalPlaceOfSupplyState;

    bill.placeOfSupplyStateCode =
      finalPlaceOfSupplyStateCode;

    // ===================================================
    // UPDATE ITEMS + CALCULATE TOTALS
    // ===================================================
    if (
      data.items &&
      Array.isArray(data.items)
    ) {
      if (
        data.items.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "At least one item is required.",
        });
      }

      let subTotal = 0;
      let totalTax = 0;

      const formattedItems =
        data.items.map((item) => {
          const quantity =
            Math.max(
              Number(
                item.quantity
              ) || 0,
              0
            );

          const price =
            Math.max(
              Number(
                item.price
              ) || 0,
              0
            );

          // =================================================
          // GST LOGIC
          // GST Invoice = 5%
          // Non-GST Invoice = 0%
          // Without GST = 0%
          // =================================================
          const gstRate =
            isGSTInvoice ? 5 : 0;

          const taxableAmount =
            quantity * price;

          const taxAmount =
            (taxableAmount *
              gstRate) /
            100;

          const totalAmount =
            taxableAmount +
            taxAmount;

          subTotal +=
            taxableAmount;

          totalTax +=
            taxAmount;

          return {
            productId:
              item.productId ||
              item.productID ||
              item.id ||
              "",

            productName:
              item.productName ||
              item.name ||
              "",

            hsnCode:
              item.hsnCode ||
              item.hsn ||
              "7326",

            quantity,

            price,

            gstRate,

            taxableAmount:
              Number(
                taxableAmount.toFixed(
                  2
                )
              ),

            taxAmount:
              Number(
                taxAmount.toFixed(
                  2
                )
              ),

            totalAmount:
              Number(
                totalAmount.toFixed(
                  2
                )
              ),
          };
        });

      subTotal =
        Number(
          subTotal.toFixed(2)
        );

      totalTax =
        Number(
          totalTax.toFixed(2)
        );

      const grandTotal =
        Number(
          (
            subTotal +
            totalTax
          ).toFixed(2)
        );

      bill.items =
        formattedItems;

      bill.subTotal =
        subTotal;

      bill.totalTax =
        totalTax;

      bill.grandTotal =
        grandTotal;

      bill.summary = {
        subTotal,

        totalTax,

        grandTotal,

        totalAmountBeforeTax:
          subTotal,

        totalAmountAfterTax:
          grandTotal,
      };
    }

    // ===================================================
    // PAYMENT STATUS
    // ===================================================
    if (
      data.paymentStatus
    ) {
      bill.paymentStatus =
        data.paymentStatus;
    }

    // ===================================================
    // SAVE
    // ===================================================
    const updatedBill =
      await bill.save();

    // ===================================================
    // SUCCESS
    // ===================================================
    return res.status(200).json({
      success: true,

      message:
        "Bill updated successfully!",

      bill:
        updatedBill,
    });
  } catch (error) {
    console.error(
      "UPDATE BILL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to update bill",

      error:
        error.message,
    });
  }
};

// =====================================================
// DELETE BILL
// =====================================================
const deleteBill = async (req, res) => {
  try {
    const { id } =
      req.params;

    const bill =
      await Bill.findByIdAndDelete(
        id
      );

    if (!bill) {
      return res.status(404).json({
        success: false,

        message:
          "Bill not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Bill deleted successfully!",
    });
  } catch (error) {
    console.error(
      "DELETE BILL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to delete bill",

      error:
        error.message,
    });
  }
};

// =====================================================
// EXPORT ALL CONTROLLERS
// =====================================================
module.exports = {
  generateBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
};