// /client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout.jsx";
import Dashboard    from "./pages/Dashboard.jsx";
import Leads        from "./pages/Leads.jsx";
import Pipeline     from "./pages/Pipeline.jsx";
import Analytics    from "./pages/Analytics.jsx";
import Login        from "./pages/Login.jsx";
import NotFound     from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — wrapped in sidebar/navbar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/leads"      element={<Leads />} />
            <Route path="/pipeline"   element={<Pipeline />} />
            <Route path="/analytics"  element={<Analytics />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
