import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import ProductList from "./components/products/ProductList";
import ProductForm from "./components/products/ProductForm";
import OrderList from "./components/orders/OrderList";
import OrderForm from "./components/orders/OrderForm";
import OrderDetail from "./components/orders/OrderDetail";
import InventoryList from "./components/inventory/InventoryList";
import StockAdjustment from "./components/inventory/StockAdjustment";
import ProductionJobs from "./components/production/ProductionJobs";
import JobForm from "./components/production/JobForm";
import CustomerList from "./components/customers/CustomerList";
import CustomerForm from "./components/customers/CustomerForm";
import CustomerDetail from "./components/customers/CustomerDetail";
import SupplierList from "./components/suppliers/SupplierList";
import SupplierForm from "./components/suppliers/SupplierForm";
import InvoiceList from "./components/invoicing/InvoiceList";
import InvoiceForm from "./components/invoicing/InvoiceForm";
import PaymentTracking from "./components/invoicing/PaymentTracking";
import Reports from "./components/reports/Reports";
import UserManagement from "./components/users/UserManagement";
import UserForm from "./components/users/UserForm";
import CounterDevices from "./components/counter/CounterDevices";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import { useAuth } from "./hooks/useAuth";

function PrivateRoute() {
  const { isAuthenticated, user } = useAuth();
  console.log(user);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/edit/:id" element={<ProductForm />} />

                <Route path="orders" element={<OrderList />} />
                <Route path="orders/new" element={<OrderForm />} />
                <Route path="orders/edit/:id" element={<OrderForm />} />
                <Route path="orders/:id" element={<OrderDetail />} />

                <Route path="inventory" element={<InventoryList />} />
                <Route path="inventory/adjust" element={<StockAdjustment />} />

                <Route path="production" element={<ProductionJobs />} />
                <Route path="production/new" element={<JobForm />} />
                <Route path="production/edit/:id" element={<JobForm />} />

                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/new" element={<CustomerForm />} />
                <Route path="customers/edit/:id" element={<CustomerForm />} />
                <Route path="customers/:id" element={<CustomerDetail />} />

                <Route path="suppliers" element={<SupplierList />} />
                <Route path="suppliers/new" element={<SupplierForm />} />
                <Route path="suppliers/edit/:id" element={<SupplierForm />} />

                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/new" element={<InvoiceForm />} />
                <Route path="payments" element={<PaymentTracking />} />

                <Route path="reports" element={<Reports />} />

                <Route path="dispatch" element={<CounterDevices />} />

                <Route path="users" element={<UserManagement />} />
                <Route path="users/new" element={<UserForm />} />
                <Route path="users/edit/:id" element={<UserForm />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
