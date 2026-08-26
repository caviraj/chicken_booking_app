import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AboutUsPage } from './pages/AboutUsPage'
import { DashboardPage } from './pages/DashboardPage'
import { BookingPage } from './pages/BookingPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'



// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminRatesPage } from './pages/admin/AdminRatesPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminZonesPage } from './pages/admin/AdminZonesPage'

import './i18n/config'

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Customer Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />



          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/rates"
            element={
              <AdminProtectedRoute>
                <AdminRatesPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <AdminSettingsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminProtectedRoute>
                <AdminOrdersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/delivery-zones"
            element={
              <AdminProtectedRoute>
                <AdminZonesPage />
              </AdminProtectedRoute>
            }
          />


          <Route path="*" element={<Navigate to="/booking" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
