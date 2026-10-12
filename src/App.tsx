import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MeditationTimerProvider } from "@/contexts/MeditationTimerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalMeditationIndicator from "@/components/GlobalMeditationIndicator";
import React, { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DoctorInbox = lazy(() => import("./pages/DoctorInbox"));
const AdminInbox = lazy(() => import("./pages/AdminInbox"));
const Profile = lazy(() => import("./pages/Profile"));
const SupportChat = lazy(() => import("./pages/SupportChat"));
const DoctorChat = lazy(() => import("./pages/DoctorChat"));

const App = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <MeditationTimerProvider>
              <Toaster />
              <GlobalMeditationIndicator />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-background">
                      <LoadingSpinner size="lg" text="Loading MEDITALK..." />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/doctor/inbox" element={<DoctorInbox />} />
                    <Route path="/admin/inbox" element={<AdminInbox />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/support" element={<SupportChat />} />
                    <Route path="/doctor-chat" element={<DoctorChat />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </MeditationTimerProvider>
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
