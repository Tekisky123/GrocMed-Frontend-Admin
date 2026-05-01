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

// Core Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import DeliveryPartners from "./pages/DeliveryPartners";
import CustomNotifications from "./pages/CustomNotifications";
import AdminManagement from "./pages/AdminManagement";
import Settings from "./pages/Settings";
import Banners from "./pages/Banners";
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

const queryClient = new QueryClient();

const makeProtected = (Component: React.ComponentType) => (
  <ProtectedRoute>
    <MainLayout>
      <Component />
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
            <Route path="/customers" element={makeProtected(Customers)} />
            <Route path="/delivery-partners" element={makeProtected(DeliveryPartners)} />
            <Route path="/notifications" element={makeProtected(CustomNotifications)} />
            <Route path="/admin-management" element={makeProtected(AdminManagement)} />
            <Route path="/settings" element={makeProtected(Settings)} />
            <Route path="/banners" element={makeProtected(Banners)} />

            {/* Accounting & Finance routes */}
            <Route path="/finance" element={makeProtected(Finance)} />
            <Route path="/purchases" element={makeProtected(Purchases)} />
            <Route path="/sales-register" element={makeProtected(SalesRegister)} />
            <Route path="/inventory" element={makeProtected(Inventory)} />
            <Route path="/gst" element={makeProtected(GSTModule)} />
            <Route path="/payroll" element={makeProtected(Payroll)} />
            <Route path="/assets" element={makeProtected(FixedAssets)} />
            <Route path="/statutory" element={makeProtected(StatutoryRegisters)} />
            <Route path="/reports" element={makeProtected(Reports)} />

            <Route path="/pincodes" element={makeProtected(Pincodes)} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
