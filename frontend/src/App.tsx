import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import MyPredictionsPage from "./pages/MyPredictions";
import ProtectedRoute from "@/components/ProtectedRoute";
import WalletPage from "./pages/Wallet";
import ProfileDashboardPage from "./pages/ProfileDashboard";
import EditProfilePage from "./pages/EditProfile";
import ChangePasswordPage from "./pages/ChangePassword";
import AdminLoginPage from "./pages/AdminLogin";
import AdminDashboardPage from "./pages/AdminDashboard";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import AdminProfilePage from "./pages/AdminProfile";
import ColorGamePage from "./pages/ColorGame";
import IPLPage from "./pages/IPL";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BottomNav />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/ipl" element={<IPLPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Color Game */}
          <Route path="/color-game" element={<ColorGamePage />} />

          {/* Protected User Routes */}
          <Route path="/my-predictions" element={<ProtectedRoute><MyPredictionsPage /></ProtectedRoute>} />
          <Route path="/my-bets"        element={<ProtectedRoute><MyPredictionsPage /></ProtectedRoute>} />
          <Route path="/wallet"         element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/profile"        element={<ProtectedRoute><ProfileDashboardPage /></ProtectedRoute>} />
          <Route path="/profile/edit"   element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="/profile/password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin"         element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
          <Route path="/admin/profile" element={<AdminProtectedRoute><AdminProfilePage /></AdminProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
