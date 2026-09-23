// =====================================================
// VRAJ CREATION - DASHBOARD BACKEND SERVER
// SECURE LOCAL VERSION
// =====================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

dotenv.config();

// =====================================================
// ENVIRONMENT
// =====================================================

const NODE_ENV =
  process.env.NODE_ENV || "development";

const IS_PRODUCTION =
  NODE_ENV === "production";

// =====================================================
// REQUIRED SECURITY SECRETS
// =====================================================

if (!process.env.JWT_SECRET) {
  console.error(
    "====================================================="
  );

  console.error(
    "ERROR: JWT_SECRET is missing in .env"
  );

  console.error(
    "Please add a strong random JWT_SECRET."
  );

  console.error(
    "====================================================="
  );

  process.exit(1);
}

// =====================================================
// SECRET STATUS
// =====================================================

console.log(
  "JWT_SECRET:",
  "LOADED"
);

console.log(
  "DASHBOARD_BACKEND_URL:",
  process.env.DASHBOARD_BACKEND_URL
    ? "CONFIGURED"
    : "NOT CONFIGURED"
);

console.log(
  "INTERNAL_STOCK_SECRET:",
  process.env.INTERNAL_STOCK_SECRET
    ? "LOADED"
    : "MISSING"
);

console.log(
  "EMAIL_USER:",
  process.env.EMAIL_USER
    ? "CONFIGURED"
    : "NOT CONFIGURED"
);

// =====================================================
// DATABASE
// =====================================================

const connectDB =
  require("./config/db");

// =====================================================
// ROUTES
// =====================================================

// Authentication
const authRoutes =
  require("./routes/authRoutes");

// Users / Admin
const userRoutes =
  require("./routes/userRoutes");

// Products
const productRoutes =
  require("./routes/productRoutes");

const publicProductRoutes =
  require("./routes/publicProductRoutes");

// Purchases
const purchaseRoutes =
  require("./routes/purchaseRoutes");

// Sales
const saleRoutes =
  require("./routes/saleRoutes");

// Other Expenses
const otherExpenseRoutes =
  require("./routes/otherExpenseRoutes");

// Bills
const billRoutes =
  require("./routes/billRoutes");

// Internal Stock
const internalStockRoutes =
  require("./routes/internalStockRoutes");

// Internal Product Verification
const internalProductRoutes =
  require("./routes/internalProductRoutes");

// Orders
const orderRoutes =
  require("./routes/orderRoutes");

// Order PDF
const orderPdfRoutes =
  require("./routes/orderPdfRoutes");

// =====================================================
// EXPRESS APP
// =====================================================

const app =
  express();

// =====================================================
// DATABASE CONNECTION
// =====================================================

connectDB();

// =====================================================
// TRUST PROXY
// =====================================================
//
// Required when deployed behind a reverse proxy such as
// Render / Nginx / similar infrastructure.
//
// Do not enable it locally unless required.
//

if (IS_PRODUCTION) {
  app.set(
    "trust proxy",
    1
  );
}

// =====================================================
// DISABLE EXPRESS FINGERPRINT
// =====================================================

app.disable(
  "x-powered-by"
);

// =====================================================
// PERFORMANCE
// =====================================================

app.use(
  compression()
);

// =====================================================
// CORS CONFIGURATION
// =====================================================
//
// Local frontend:
//
// http://localhost:5173
// http://localhost:5174
// http://127.0.0.1:5173
// http://127.0.0.1:5174
//
// FRONTEND_URL can contain multiple comma-separated
// origins.
//
// Example:
//
// FRONTEND_URL=http://localhost:5173,http://localhost:5174
//
// =====================================================

// -----------------------------------------------------
// Environment configured origins
// -----------------------------------------------------

const configuredOrigins =
  String(
    process.env.FRONTEND_URL || ""
  )
    .split(",")
    .map(
      (origin) =>
        origin
          .trim()
          .replace(/\/$/, "")
    )
    .filter(Boolean);

// -----------------------------------------------------
// Development origins
// -----------------------------------------------------

const developmentOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",

  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// -----------------------------------------------------
// Final allowed origins
// -----------------------------------------------------
//
// IMPORTANT:
// No Netlify origin is hard-coded here.
//

const allowedOrigins = [
  ...configuredOrigins,
  ...developmentOrigins,
];

// -----------------------------------------------------
// Remove duplicates
// -----------------------------------------------------

const uniqueAllowedOrigins = [
  ...new Set(
    allowedOrigins
      .map((origin) =>
        String(origin)
          .trim()
          .replace(/\/$/, "")
      )
      .filter(Boolean)
  ),
];

// =====================================================
// SHOW CORS CONFIG
// =====================================================

console.log(
  "Allowed CORS Origins:",
  uniqueAllowedOrigins
);

// =====================================================
// CORS CONFIGURATION
// =====================================================

const corsOptions = {
  origin: (
    origin,
    callback
  ) => {

    // -------------------------------------------------
    // Server-to-server / Postman / health checks
    // -------------------------------------------------

    if (!origin) {
      return callback(
        null,
        true
      );
    }

    // -------------------------------------------------
    // Normalize origin
    // -------------------------------------------------

    const normalizedOrigin =
      String(origin)
        .trim()
        .replace(/\/$/, "");

    // -------------------------------------------------
    // WHITELIST CHECK
    // -------------------------------------------------

    if (
      uniqueAllowedOrigins.includes(
        normalizedOrigin
      )
    ) {
      return callback(
        null,
        true
      );
    }

    // -------------------------------------------------
    // BLOCK UNKNOWN ORIGIN
    // -------------------------------------------------

    console.warn(
      "CORS BLOCKED:",
      normalizedOrigin
    );

    return callback(
      new Error(
        "CORS origin not allowed."
      )
    );
  },

  // ---------------------------------------------------
  // Credentials
  // ---------------------------------------------------

  credentials: true,

  // ---------------------------------------------------
  // Methods
  // ---------------------------------------------------

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  // ---------------------------------------------------
  // Headers
  // ---------------------------------------------------

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Internal-Secret",
  ],

  // ---------------------------------------------------
  // Exposed headers
  // ---------------------------------------------------

  exposedHeaders: [
    "Content-Disposition",
  ],

  // ---------------------------------------------------
  // Preflight response
  // ---------------------------------------------------

  optionsSuccessStatus: 204,
};

// =====================================================
// APPLY CORS
// =====================================================

app.use(
  cors(corsOptions)
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "2mb",

    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: false,

    limit: "2mb",
  })
);

// =====================================================
// LOGIN RATE LIMIT
// =====================================================
//
// Protects login endpoint against repeated automated
// login attempts.
//
// 5 requests / 15 minutes per IP.
//

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 5,

    message: {
      success: false,

      message:
        "Too many login attempts. Please try again after 15 minutes.",
    },

    standardHeaders: true,

    legacyHeaders: false,

    skipSuccessfulRequests:
      false,
  });

// =====================================================
// INTERNAL STOCK RATE LIMIT
// =====================================================
//
// Internal stock synchronization can legitimately make
// multiple requests, so the limit is higher.
//

const internalStockLimiter =
  rateLimit({
    windowMs:
      1 * 60 * 1000,

    max: 120,

    message: {
      success: false,

      message:
        "Too many internal stock requests. Please try again later.",
    },

    standardHeaders: true,

    legacyHeaders: false,
  });

// =====================================================
// AUTH LOGIN RATE LIMIT
// =====================================================

app.use(
  "/api/auth/login",
  loginLimiter
);

// =====================================================
// LOCAL UPLOADS
// =====================================================
//
// Static uploads are served without directory listing.
//

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    ),
    {
      maxAge: "1d",

      index: false,

      dotfiles: "deny",
    }
  )
);

// =====================================================
// API ROUTES
// =====================================================

// =====================================================
// AUTHENTICATION
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

// =====================================================
// USERS / ADMIN
// =====================================================

app.use(
  "/api/users",
  userRoutes
);

// =====================================================
// BILLS
// =====================================================

app.use(
  "/api/bills",
  billRoutes
);

// =====================================================
// ORDERS
// =====================================================

app.use(
  "/api/orders",
  orderRoutes
);

// =====================================================
// INTERNAL STOCK SYNC
// =====================================================

app.use(
  "/api/internal/stock",
  internalStockLimiter,
  internalStockRoutes
);

// =====================================================
// INTERNAL PRODUCT VERIFICATION
// =====================================================

app.use(
  "/api/internal/products",
  internalProductRoutes
);

// =====================================================
// ORDER PDF
// =====================================================

app.use(
  "/api/order-pdf",
  orderPdfRoutes
);

// =====================================================
// PRODUCTS - ADMIN DASHBOARD
// =====================================================

app.use(
  "/api/products",
  productRoutes
);

// =====================================================
// PRODUCTS - PUBLIC WEBSITE
// =====================================================

app.use(
  "/api/public/products",
  publicProductRoutes
);

// =====================================================
// PURCHASES
// =====================================================

app.use(
  "/api/purchases",
  purchaseRoutes
);

// =====================================================
// SALES
// =====================================================

app.use(
  "/api/sales",
  saleRoutes
);

// =====================================================
// OTHER EXPENSES
// =====================================================

app.use(
  "/api/other-expenses",
  otherExpenseRoutes
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      status: "OK",

      message:
        "Vraj Creation API is running",

      environment:
        NODE_ENV,
    });
  }
);

// =====================================================
// 404 - API ROUTE NOT FOUND
// =====================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        "API route not found",
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    // -------------------------------------------------
    // CORS ERROR
    // -------------------------------------------------

    if (
      err.message ===
      "CORS origin not allowed."
    ) {
      return res.status(403).json({
        success: false,

        message:
          "Origin not allowed.",
      });
    }

    // -------------------------------------------------
    // BODY TOO LARGE
    // -------------------------------------------------

    if (
      err.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,

        message:
          "Request payload is too large.",
      });
    }

    // -------------------------------------------------
    // INVALID JSON
    // -------------------------------------------------

    if (
      err instanceof
        SyntaxError &&
      err.status === 400 &&
      "body" in err
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid JSON request.",
      });
    }

    // -------------------------------------------------
    // MULTER ERROR
    // -------------------------------------------------

    if (
      err.name ===
      "MulterError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "File upload failed.",
      });
    }

    // -------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -------------------------------------------------

    if (
      err.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid request data.",
      });
    }

    // -------------------------------------------------
    // MONGOOSE CAST ERROR
    // -------------------------------------------------

    if (
      err.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid request data.",
      });
    }

    // -------------------------------------------------
    // DUPLICATE KEY ERROR
    // -------------------------------------------------

    if (
      err.code === 11000
    ) {
      return res.status(409).json({
        success: false,

        message:
          "A record with this information already exists.",
      });
    }

    // -------------------------------------------------
    // PRODUCTION ERROR RESPONSE
    // -------------------------------------------------

    if (IS_PRODUCTION) {
      return res.status(500).json({
        success: false,

        message:
          "Internal server error.",
      });
    }

    // -------------------------------------------------
    // DEVELOPMENT RESPONSE
    // -------------------------------------------------

    return res.status(500).json({
      success: false,

      message:
        "Internal server error.",

      error:
        err.message,
    });
  }
);

// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT ||
  5000;

app.listen(
  PORT,
  () => {

    console.log(
      "====================================================="
    );

    console.log(
      `Vraj Creation Backend running on port ${PORT}`
    );

    console.log(
      `Environment: ${NODE_ENV}`
    );

    console.log(
      `API Base: http://localhost:${PORT}/api`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Other Expenses: http://localhost:${PORT}/api/other-expenses`
    );

    console.log(
      "Internal Stock: /api/internal/stock"
    );

    console.log(
      "Internal Product Verification: /api/internal/products/verify"
    );

    console.log(
      "Allowed CORS Origins:",
      uniqueAllowedOrigins.join(
        ", "
      )
    );

    console.log(
      "JWT_SECRET: LOADED"
    );

    console.log(
      "====================================================="
    );
  }
);