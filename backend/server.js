const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
  console.error("=====================================================");
  console.error("ERROR: JWT_SECRET is missing in .env");
  console.error("Please add a strong random JWT_SECRET.");
  console.error("=====================================================");
  process.exit(1);
}

console.log("JWT_SECRET:", "LOADED");

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

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const publicProductRoutes = require("./routes/publicProductRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");
const otherExpenseRoutes = require("./routes/otherExpenseRoutes");
const billRoutes = require("./routes/billRoutes");
const internalStockRoutes = require("./routes/internalStockRoutes");
const internalProductRoutes = require("./routes/internalProductRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderPdfRoutes = require("./routes/orderPdfRoutes");

const app = express();

connectDB();

if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(compression());

const configuredOrigins = String(
  process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((origin) =>
    origin
      .trim()
      .replace(/\/$/, "")
  )
  .filter(Boolean);

const developmentOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const allowedOrigins = [
  ...configuredOrigins,
  ...developmentOrigins,
];

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

console.log(
  "Allowed CORS Origins:",
  uniqueAllowedOrigins
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = String(origin)
      .trim()
      .replace(/\/$/, "");

    if (
      uniqueAllowedOrigins.includes(
        normalizedOrigin
      )
    ) {
      return callback(null, true);
    }

    console.warn(
      "CORS BLOCKED:",
      normalizedOrigin
    );

    return callback(
      new Error("CORS origin not allowed.")
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Internal-Secret",
  ],

  exposedHeaders: [
    "Content-Disposition",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 5,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again after 15 minutes.",
  },

  standardHeaders: true,

  legacyHeaders: false,

  skipSuccessfulRequests: false,
});

const internalStockLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,

  max: 120,

  message: {
    success: false,
    message:
      "Too many internal stock requests. Please try again later.",
  },

  standardHeaders: true,

  legacyHeaders: false,
});

app.use(
  "/api/auth/login",
  loginLimiter
);

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

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/bills",
  billRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/internal/stock",
  internalStockLimiter,
  internalStockRoutes
);

app.use(
  "/api/internal/products",
  internalProductRoutes
);

app.use(
  "/api/order-pdf",
  orderPdfRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/public/products",
  publicProductRoutes
);

app.use(
  "/api/purchases",
  purchaseRoutes
);

app.use(
  "/api/sales",
  saleRoutes
);

app.use(
  "/api/other-expenses",
  otherExpenseRoutes
);

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      status: "OK",
      message:
        "Vraj Creation API is running",
      environment: NODE_ENV,
    });
  }
);

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Vraj Creation Store Backend is running",
      environment: NODE_ENV,
    });
  }
);

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        "API route not found",
    });
  }
);

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

    if (
      err instanceof SyntaxError &&
      err.status === 400 &&
      "body" in err
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON request.",
      });
    }

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

    if (
      err.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A record with this information already exists.",
      });
    }

    if (IS_PRODUCTION) {
      return res.status(500).json({
        success: false,
        message:
          "Internal server error.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error.",
      error: err.message,
    });
  }
);

const PORT =
  process.env.PORT || 5000;

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
      uniqueAllowedOrigins.join(", ")
    );

    console.log(
      "JWT_SECRET: LOADED"
    );

    console.log(
      "====================================================="
    );
  }
);