import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/layout/Layout";
import FeedPage from "./pages/FeedPage";
import PostPage from "./pages/PostPage";
import CreatePostPage from "./pages/CreatePostPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminQueuePage from "./pages/AdminQueuePage";
import { useAuthStore } from "./store/authStore";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
});

function ProtectedRoute({ children, roles }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/posts/:id" element={<PostPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/submit"
              element={
                <ProtectedRoute>
                  <CreatePostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute roles={["moderator", "admin"]}>
                  <AdminQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminCategoriesPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
