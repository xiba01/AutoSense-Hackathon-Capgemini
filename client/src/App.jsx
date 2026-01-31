import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { supabase } from "./config/supabaseClient";
import { setSession } from "./store/slices/authSlice";
import { fetchDealerProfile } from "./store/slices/dealerSlice";

import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import OnboardingLayout from "./layouts/OnboardingLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Landing/Home";
import Login from "./pages/Auth/Login";
import Inventory from "./pages/Dashboard/Inventory";
import DashboardHome from "./pages/Dashboard/DashboardHome";
import StudioPage from "./pages/Dashboard/Studio/StudioPage";
import ViewerPage from "./pages/Player/ViewerPage";
import PublicLayout from "./layouts/PublicLayout";
import Showroom from "./pages/Microsite/Showroom";
import VehicleDetail from "./pages/Microsite/VehicleDetail";

import AccountStep from "./pages/Onboarding/AccountStep";
import PaymentStep from "./pages/Onboarding/PaymentStep";
import BrandingStep from "./pages/Onboarding/BrandingStep";
import EditorPage from "./pages/Dashboard/Studio/EditorPage";

import StudioWizard from "./pages/Dashboard/Studio/Wizard/StudioWizard";

function App() {
  const dispatch = useDispatch();


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setSession(session));
      if (session?.user) {
        dispatch(fetchDealerProfile(session.user.id));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession(session));
      if (session?.user) {
        dispatch(fetchDealerProfile(session.user.id));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/onboarding" element={<OnboardingLayout />}>
        <Route path="account" element={<AccountStep />} />
        <Route path="payment" element={<PaymentStep />} />
        <Route path="branding" element={<BrandingStep />} />
      </Route>

      <Route path="/onboarding" element={<OnboardingLayout />}>
        <Route path="account" element={<AccountStep />} />
        <Route path="payment" element={<PaymentStep />} />
        <Route path="branding" element={<BrandingStep />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="studio/published" element={<StudioPage />} />
          <Route path="studio/trash" element={<StudioPage />} />

          <Route path="studio/wizard" element={<StudioWizard />} />
          <Route path="editor/:storyId" element={<EditorPage />} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>
      </Route>
      <Route path="/experience/:storyId" element={<ViewerPage />} />
      <Route path="/sites/:dealerId" element={<PublicLayout />}>
        <Route index element={<Showroom />} />
        <Route path="inventory/:carId" element={<VehicleDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
