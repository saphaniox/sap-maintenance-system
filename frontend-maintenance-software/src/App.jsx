import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ToastContainer from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { lazyLoad, performanceMonitor } from './utils/codeSplitting'
import './styles/global.css'

// Lazy load components for code splitting
const Login = lazyLoad(() => import('./components/Login'))
const Dashboard = lazyLoad(() => import('./views/Dashboard'))
const Welcome = lazyLoad(() => import('./components/Welcome'))
const Signup = lazyLoad(() => import('./components/Signup'))
const Machines = lazyLoad(() => import('./views/Machines'))
const Maintenance = lazyLoad(() => import('./views/Maintenance'))
const Inventory = lazyLoad(() => import('./views/Inventory'))
const Requisitions = lazyLoad(() => import('./views/Requisitions'))
const ProductionReports = lazyLoad(() => import('./views/ProductionReports'))
const Analytics = lazyLoad(() => import('./views/Analytics'))
const Profile = lazyLoad(() => import('./views/Profile'))
const Sites = lazyLoad(() => import('./components/Sites'))
const Users = lazyLoad(() => import('./views/Users'))

// Loading fallback component
const PageLoader = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <LoadingSkeleton count={3} />
    <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
      Loading page.......
    </p>
  </div>

  
)

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <ToastContainer />
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Welcome />} />
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
                path="/machines"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Machines />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Maintenance />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Inventory />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requisitions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Requisitions />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sites"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Sites />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/production-reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProductionReports />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
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
            </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
