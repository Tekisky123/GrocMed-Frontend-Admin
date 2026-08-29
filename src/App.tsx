import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";


// Core Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import BrandsCategories from "./pages/BrandsCategories";
import Customers from "./pages/Customers";
import DeliveryPartners from "./pages/DeliveryPartners";
import CustomNotifications from "./pages/CustomNotifications";
import AdminManagement from "./pages/AdminManagement";
import Settings from "./pages/Settings";
import Banners from "./pages/Banners";
import Coupons from "./pages/Coupons";
import NotFound from "./pages/NotFound";

// Accounting & Finance Pages
import Finance from "./pages/Finance";
import Purchases from "./pages/Purchases";
import SalesRegister from "./pages/SalesRegister";
import Inventory from "./pages/Inventory";
import GSTModule from "./pages/GSTModule";
import Payroll from "./pages/Payroll";
import FixedAssets from "./pages/FixedAssets";
import StatutoryRegisters from "./pages/StatutoryRegisters";
import Reports from "./pages/Reports";
import Pincodes from "./pages/Pincodes";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const makeProtected = (Component: React.ComponentType, requiredRole?: string) => (
  <ProtectedRoute requiredRole={requiredRole}>
    <MainLayout>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </MainLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Core routes */}
            <Route path="/" element={makeProtected(Dashboard)} />
            <Route path="/orders" element={makeProtected(Orders)} />
            <Route path="/products" element={makeProtected(Products)} />
            <Route path="/brands-categories" element={makeProtected(BrandsCategories)} />
            <Route path="/customers" element={makeProtected(Customers)} />
            <Route path="/delivery-partners" element={makeProtected(DeliveryPartners)} />
            <Route path="/notifications" element={makeProtected(CustomNotifications)} />
            <Route path="/admin-management" element={makeProtected(AdminManagement, "super_admin")} />
            <Route path="/settings" element={makeProtected(Settings, "super_admin")} />
            <Route path="/banners" element={makeProtected(Banners, "super_admin")} />
            <Route path="/coupons" element={makeProtected(Coupons)} />

            {/* Accounting & Finance routes */}
            <Route path="/finance" element={makeProtected(Finance, "super_admin")} />
            <Route path="/purchases" element={makeProtected(Purchases)} />
            <Route path="/sales-register" element={makeProtected(SalesRegister, "super_admin")} />
            <Route path="/inventory" element={makeProtected(Inventory)} />
            <Route path="/gst" element={makeProtected(GSTModule)} />
            <Route path="/payroll" element={makeProtected(Payroll, "super_admin")} />
            <Route path="/assets" element={makeProtected(FixedAssets, "super_admin")} />
            <Route path="/statutory" element={makeProtected(StatutoryRegisters, "super_admin")} />
            <Route path="/reports" element={makeProtected(Reports, "super_admin")} />

            <Route path="/pincodes" element={makeProtected(Pincodes, "super_admin")} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
