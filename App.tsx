import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Auth } from './pages/Auth';
import { Payment } from './pages/Payment';
import { Dashboard } from './pages/Dashboard';
import { PublicView } from './pages/PublicView';
import { Privacy, Terms, RefundPolicy } from './pages/Legal';
import { About, Contact, FAQ, Security } from './pages/InfoPages';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/v/:id" element={<PublicView />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/security" element={<Security />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;