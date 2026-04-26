import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthProvider, { useAuth } from "./auth/AuthContext";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";

import Home from "./pages/Home";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Clubs = lazy(() => import("./pages/Clubs"));
const EventPage = lazy(() => import("./pages/EventPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const ClubDetail = lazy(() => import("./pages/ClubDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const ProfessorAppointmentsPage = lazy(() => import("./pages/ProfessorAppointmentsPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const RoomReservationRequest = lazy(() => import("./pages/RoomReservationRequest"));

const Help = lazy(() => import("./pages/Help"));
const Faq = lazy(() => import("./pages/Faq"));
const Contact = lazy(() => import("./pages/Contact"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Kvkk = lazy(() => import("./pages/Kvkk"));
const Cookies = lazy(() => import("./pages/Cookies"));



import "./index.css";
import "./styles/event-detail.css";

function AppShell({ children }) {
  const noChromeRoutes = ["/login", "/register", "/forgot-password", "/terms", "/privacy"];
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const hideChrome = noChromeRoutes.includes(pathname);

  return (
    <>
      {!hideChrome && <NavBar />}
      {children}
      {!hideChrome && <Footer />}
      <ChatBot />
    </>

  );
}

function NonAdminRoute({ children }) {
  const { isAdmin, backendLoading } = useAuth();
  if (backendLoading) return <div>Loading...</div>;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <ScrollToTop />
        <AppShell>
          <Suspense fallback={null}>
            <Routes>
              {/* Ana sayfa */}
              <Route path="/" element={<Home />} />

              {/* Auth sayfaları */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              {/* Kulüpler sayfası */}
              <Route path="/clubs" element={<Clubs />} />
              {/* Kulüp detayı */}
              <Route path="/clubs/:id" element={<ClubDetail />} />

              {/* Etkinlik listesi */}
              <Route path="/events" element={<EventPage />} />

              {/* Etkinlik detayı */}
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/events/siber-guvenlik" element={<EventDetailPage fixedSlug="siber guvenlik" />} />
              <Route path="/events/kariyer-gunu" element={<EventDetailPage fixedSlug="kariyer" />} />
              <Route path="/events/dogus-tech-day" element={<EventDetailPage fixedSlug="dogus tech day" />} />
              {/* Hakkımızda sayfası */}
              <Route path="/about" element={<AboutPage />} />

              {/* Footer / Bilgi sayfaları */}
              <Route path="/help" element={<Help />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/kvkk" element={<Kvkk />} />
              <Route path="/cookies" element={<Cookies />} />

              {/* Randevu sayfaları */}
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/appointments/:id" element={<ProfessorAppointmentsPage />} />

              {/* Örnek korumalı sayfa */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div className="kr-container" style={{ padding: "40px 0" }}>
                      <Profile />
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Bildirimler sayfası */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Admin Panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              {/* User Room Reservation Request */}
              <Route
                path="/room-reservation"
                element={
                  <ProtectedRoute>
                    <NonAdminRoute>
                      <RoomReservationRequest />
                    </NonAdminRoute>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
