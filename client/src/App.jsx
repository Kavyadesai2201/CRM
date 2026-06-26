// /client/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary, { RouteErrorBoundary } from "./components/ErrorBoundary.jsx";
import MainLayout     from "./components/layout/MainLayout.jsx";
import Dashboard      from "./pages/Dashboard.jsx";
import Inbox          from "./pages/Inbox.jsx";
import Leads          from "./pages/Leads.jsx";
import Pipeline       from "./pages/Pipeline.jsx";
import Analytics      from "./pages/Analytics.jsx";
import Login          from "./pages/Login.jsx";
import Register       from "./pages/Register.jsx";
import Landing        from "./pages/Landing.jsx";
import NotFound       from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

export default function App() {
  return (
    // Outer boundary: catches crashes in Router itself, Login, Register, Landing
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — per-route boundary resets on navigation */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
              <Route path="/inbox"     element={<RouteErrorBoundary><Inbox /></RouteErrorBoundary>} />
              <Route path="/leads"     element={<RouteErrorBoundary><Leads /></RouteErrorBoundary>} />
              <Route path="/pipeline"  element={<RouteErrorBoundary><Pipeline /></RouteErrorBoundary>} />
              <Route path="/analytics" element={<RouteErrorBoundary><Analytics /></RouteErrorBoundary>} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
