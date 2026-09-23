import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductView from "./pages/ProductView";

import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import OtherExpenses from "./pages/OtherExpenses";

import AdminApprovals from "./pages/AdminApprovals";

import CreateBill from "./pages/CreateBill";
import BillsList from "./pages/BillsList";
import EditBill from "./pages/EditBill";

import AdminLayout from "./components/AdminLayout";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

const ProtectedRoute = ({
  children,
}) => {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950 dark:border-slate-700 dark:border-t-white" />

          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  const token =
    localStorage.getItem("token");

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

const AdminPage = ({
  children,
}) => {
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

const AppRoutes = () => {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950 dark:border-slate-700 dark:border-t-white" />

          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
            Loading Vraj Creation...
          </p>
        </div>
      </div>
    );
  }

  const token =
    localStorage.getItem("token");

  const isAuthenticated =
    Boolean(
      token && user
    );

  return (
    <Routes>

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Register />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <AdminPage>
            <Dashboard />
          </AdminPage>
        }
      />

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

      <Route
        path="/sales"
        element={
          <AdminPage>
            <SalesPage />
          </AdminPage>
        }
      />

      <Route
        path="/purchases"
        element={
          <AdminPage>
            <PurchasesPage />
          </AdminPage>
        }
      />

      <Route
        path="/other-expenses"
        element={
          <AdminPage>
            <OtherExpenses />
          </AdminPage>
        }
      />

      <Route
        path="/admin/approvals"
        element={
          <AdminPage>
            <AdminApprovals />
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

      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;