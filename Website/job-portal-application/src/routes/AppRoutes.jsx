import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import { useAuth } from "../context/AuthContext";

export default function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      {/* Protected Home Route */}
      <Route
        path="/"
        element={session ? <Home /> : <Navigate to="/signin" replace />}
      />

      {/* SignIn Route - Redirect if already logged in */}
      <Route
        path="/signin"
        element={!session ? <SignIn /> : <Navigate to="/" replace />}
      />

      {/* SignUp Route - Redirect if already logged in */}
      <Route
        path="/signup"
        element={!session ? <SignUp /> : <Navigate to="/" replace />}
      />

      {/* Optional: catch-all redirect to home or sign-in */}
      <Route
        path="*"
        element={<Navigate to={session ? "/" : "/signin"} replace />}
      />
    </Routes>
  );
}
