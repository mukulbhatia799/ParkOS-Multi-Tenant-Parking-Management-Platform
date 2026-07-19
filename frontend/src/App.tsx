import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { VehicleLocator } from "./pages/VehicleLocator";
import { Cameras } from "./pages/Cameras";
import { Billing } from "./pages/Billing";
import { LotMapBuilder } from "./pages/LotMapBuilder";
import { Users } from "./pages/Users";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/locator"
        element={
          <ProtectedRoute>
            <Layout>
              <VehicleLocator />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cameras"
        element={
          <ProtectedRoute>
            <Layout>
              <Cameras />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <Layout>
              <Billing />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map-builder"
        element={
          <ProtectedRoute>
            <Layout>
              <LotMapBuilder />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
