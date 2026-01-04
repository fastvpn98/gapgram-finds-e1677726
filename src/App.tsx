import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import SubmitAd from "./pages/SubmitAd";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import EditAd from "./pages/EditAd";
import AdminPanel from "./pages/AdminPanel";
import Analytics from "./pages/Analytics";
import ManageRoles from "./pages/ManageRoles";
import ManageAds from "./pages/ManageAds";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/submit-ad" element={<SubmitAd />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/edit-ad/:id" element={<EditAd />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/manage-roles" element={<ManageRoles />} />
              <Route path="/manage-ads" element={<ManageAds />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
