import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import BillingForm from "./pages/BillingForm";
import BillingHistory from "./pages/BillingHistory";
import SmsStatus from "./pages/SmsStatus";
import SmsSettings from "./pages/SmsSettings";
import SmsTest from "./pages/SmsTest";
import DirectSms from "./pages/DirectSms";
import Receipt from "./pages/Receipt";
import Receipts from "./pages/Receipts";
import Navbar from "./components/Navbar";
import "./App.css";
import PublicReceipt from "./pages/PublicReceipt";
import PublicPayment from "./pages/PublicPayment";

// Public Receipt component that doesn't include Navbar
const PublicReceiptWrapper = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/:billId" element={<Receipt isPublic={true} />} />
        </Routes>
      </main>
    </div>
  );
};

// Component to handle return navigation from WhatsApp
const WhatsAppReturnHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a return URL in sessionStorage (set before WhatsApp redirect)
    const returnToPage = sessionStorage.getItem("returnToPage");

    if (returnToPage) {
      // Clear the stored value
      sessionStorage.removeItem("returnToPage");
      console.log("Returning from WhatsApp redirect to:", returnToPage);

      // Extract the path from the URL to navigate back
      try {
        const url = new URL(returnToPage);
        navigate(url.pathname + url.search);
      } catch (error) {
        // If URL parsing fails, try to navigate directly
        // This handles both relative and absolute paths
        if (returnToPage.startsWith("http")) {
          window.location.href = returnToPage;
        } else {
          navigate(returnToPage);
        }
      }
    }
  }, [navigate]);

  return null;
};

function App() {
  // Check if we're in the public receipt route
  const isPublicReceipt = window.location.pathname.startsWith("/p/receipt/");
  const isPublicPayment = window.location.pathname.startsWith("/p/pay/");

  if (isPublicReceipt) {
    return (
      <BrowserRouter basename="/p/receipt">
        <Toaster position="top-right" />
        <PublicReceiptWrapper />
      </BrowserRouter>
    );
  }

  if (isPublicPayment) {
    return (
      <BrowserRouter basename="/p/pay">
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-100">
          <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route
                path="/:billId"
                element={<Receipt isPublic={true} isPayment={true} />}
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Toaster position="top-right" />
        <Navbar />
        <WhatsAppReturnHandler />
        <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/billing-form" element={<BillingForm />} />
            <Route path="/create-bill" element={<BillingForm />} />
            <Route path="/billing-history" element={<BillingHistory />} />
            <Route path="/sms-status" element={<SmsStatus />} />
            <Route path="/sms-settings" element={<SmsSettings />} />
            <Route path="/sms-test" element={<SmsTest />} />
            <Route path="/direct-sms" element={<DirectSms />} />
            <Route path="/receipt/:billId" element={<Receipt />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/p/receipt/:billId" element={<PublicReceipt />} />
            <Route path="/p/pay/:billId" element={<PublicPayment />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
