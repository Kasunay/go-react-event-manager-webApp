import { ThemeProvider } from "next-themes"
import { BrowserRouter, Routes, Route } from 'react-router';
import HomePage from './pages/HomePage';
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import './App.css'
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './contexts/AuthContext'; // Adjust the path as needed
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CategoriesPage from './pages/CategoriesPage'
import CategoryDetailPage from './pages/CategoryDetailPage'
import { PrivateRoute } from './components/PrivateRoute'; // Your existing PrivateRoute
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import { AdminRoute } from './components/AdminRoute'
import QRCode from './pages/QRcodeValidationPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import { Toaster } from "./components/ui/sonner"
import ResetPasswordPage from './pages/ResetPasswordPage'; // Adjust the path as needed


const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" storageKey="eventix-theme">
        <AuthProvider>
          <div className="flex min-h-screen flex-col ">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="*" element={<NotFoundPage />} />

                <Route path="/" element={<HomePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:slug" element={<EventDetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
                <Route path="/categories/:categoryId/:subcategoryId" element={<CategoryDetailPage />} />
                <Route path="/validateCode" element={<QRCode />} />
                <Route path="/success" element={<CheckoutSuccessPage />} />
                {/* If a logged-in user tries to go to these, they will be redirected. */}

                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Route>

                <Route element={<PrivateRoute />}>
                  <Route path="/profile" element={<UserProfilePage />} />
                </Route>

              </Routes>

            </main>
            <Toaster />
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
