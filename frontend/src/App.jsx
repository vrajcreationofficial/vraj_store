import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout
import AdminLayout from "./components/AdminLayout";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Products
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductView from "./pages/ProductView";

// Accounts
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import OtherExpenses from "./pages/OtherExpenses";

// Admin
import AdminApprovals from "./pages/AdminApprovals";

// Bills
import CreateBill from "./pages/CreateBill";
import BillsList from "./pages/BillsList";
import EditBill from "./pages/EditBill";

// Daily Wages
import DailyWagesForm from "./pages/DailyWagesForm";
import DailyWagesList from "./pages/DailyWagesList";

/* =========================================================
   LOADING SCREEN
========================================================= */

const LoadingScreen = ({ message = "Loading Vraj Creation..." }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950 dark:border-slate-700 dark:border-t-white" />

        <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* =========================================================
   ADMIN PAGE WRAPPER
========================================================= */

const AdminPage = ({ children }) => {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

/* =========================================================
   APP ROUTES
========================================================= */

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const token = localStorage.getItem("token");

  const isAuthenticated = Boolean(token && user);

  return (
    <Routes>
      {/* =====================================================
          AUTH ROUTES
      ===================================================== */}

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register />
          )
        }
      />

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <AdminPage>
            <Dashboard />
          </AdminPage>
        }
      />

      {/* =====================================================
          BILLING
      ===================================================== */}

      <Route
        path="/create-bill"
        element={
          <AdminPage>
            <CreateBill />
          </AdminPage>
        }
      />

      <Route
        path="/invoices"
        element={
          <AdminPage>
            <BillsList />
          </AdminPage>
        }
      />

      <Route
        path="/edit-bill/:id"
        element={
          <AdminPage>
            <EditBill />
          </AdminPage>
        }
      />

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <Route
        path="/products"
        element={
          <AdminPage>
            <Products />
          </AdminPage>
        }
      />

      <Route
        path="/products/add"
        element={
          <AdminPage>
            <AddProduct />
          </AdminPage>
        }
      />

      <Route
        path="/products/:id"
        element={
          <AdminPage>
            <ProductView />
          </AdminPage>
        }
      />

      <Route
        path="/products/edit/:id"
        element={
          <AdminPage>
            <EditProduct />
          </AdminPage>
        }
      />

      {/* =====================================================
          SALES
      ===================================================== */}

      <Route
        path="/sales"
        element={
          <AdminPage>
            <SalesPage />
          </AdminPage>
        }
      />

      {/* =====================================================
          PURCHASES
      ===================================================== */}

      <Route
        path="/purchases"
        element={
          <AdminPage>
            <PurchasesPage />
          </AdminPage>
        }
      />

      {/* =====================================================
          OTHER EXPENSES
      ===================================================== */}

      <Route
        path="/other-expenses"
        element={
          <AdminPage>
            <OtherExpenses />
          </AdminPage>
        }
      />

      {/* =====================================================
          DAILY WAGES
      ===================================================== */}

      <Route
        path="/daily-wages"
        element={
          <AdminPage>
            <DailyWagesForm />
          </AdminPage>
        }
      />

      <Route
        path="/daily-wages/list"
        element={
          <AdminPage>
            <DailyWagesList />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN APPROVALS
      ===================================================== */}

      <Route
        path="/admin/approvals"
        element={
          <AdminPage>
            <AdminApprovals />
          </AdminPage>
        }
      />

      {/* =====================================================
          ROOT
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      {/* =====================================================
          404 / UNKNOWN ROUTE
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
};

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;