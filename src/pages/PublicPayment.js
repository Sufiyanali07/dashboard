import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MockApiService } from "../services/mockApi";

const PublicPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        // Get bill from API
        const fetchedBill = await MockApiService.getBillById(id);
        if (fetchedBill) {
          setBill(fetchedBill);
          // If bill is already paid, redirect to receipt
          if (fetchedBill.status === "paid") {
            navigate(`/p/receipt/${id}`);
          }
          setError(null);
        } else {
          setError("Bill not found");
        }
      } catch (err) {
        console.error("Error fetching bill:", err);
        setError("Failed to load bill");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBill();
    }
  }, [id, navigate]);

  const handlePaymentSubmit = async () => {
    try {
      setPaymentProcessing(true);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update bill status
      const updatedBill = await MockApiService.updateBillStatus(id, "paid");
      if (updatedBill) {
        setPaymentSuccess(true);

        // Redirect to receipt after a delay
        setTimeout(() => {
          navigate(`/p/receipt/${id}`);
        }, 2000);
      } else {
        setError("Failed to process payment");
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      setError("Payment processing failed");
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-red-500 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold mt-4 text-gray-800">
              Bill Not Found
            </h2>
            <p className="text-gray-600 mt-2">
              {error ||
                "The bill you're looking for doesn't exist or has been removed."}
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-500 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h2 className="text-xl font-bold mt-4 text-gray-800">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mt-2">
              Thank you for your payment. Redirecting to your receipt...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(bill.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Payment Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">
            Payment for Bill #{id}
          </h1>
        </div>

        {/* Bill Details */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Bill Details
            </h2>

            <div className="mb-3">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formattedDate}</p>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{bill.customerName}</p>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium text-xl">₹{bill.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Payment Methods
            </h2>

            <div className="space-y-3">
              <div className="border rounded-lg p-4 flex items-center cursor-pointer bg-blue-50 border-blue-300">
                <input
                  type="radio"
                  id="upi"
                  name="paymentMethod"
                  className="mr-3"
                  defaultChecked
                />
                <label htmlFor="upi" className="flex-1 cursor-pointer">
                  <div className="font-medium">UPI / PhonePe</div>
                  <div className="text-sm text-gray-500">
                    Pay using any UPI app
                  </div>
                </label>
              </div>

              <div className="border rounded-lg p-4 flex items-center cursor-pointer text-gray-400">
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  className="mr-3"
                  disabled
                />
                <label htmlFor="card" className="flex-1 cursor-pointer">
                  <div className="font-medium">Card Payment</div>
                  <div className="text-sm">Coming soon</div>
                </label>
              </div>
            </div>
          </div>

          {/* UPI Instructions */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="text-center mb-4">
              <p className="font-medium text-gray-700">Scan QR code to pay</p>
              <p className="text-sm text-gray-500 mb-4">
                Or use PhonePe UPI ID: 9309908454@ybl
              </p>

              <div className="bg-white p-2 inline-block border rounded-md mb-2">
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAOPSURBVO3BQY4cSRLAQDLQ//8yV0c/JZCoain2Yma/cPiL4/AP4fAPh38Ih38Ih38Ih38Ih38Ih38Ih38Ih38Ih38Ih38I//+PP/7rvwb4CsJXEG6QtxC+gnCDvIXwFYQb5C2Ev0G4Qd5C+ArCDfIWwlcQbpC3EL6C8BWEryB8BeEtCG8h3CBvQXgLwlsQniJ8BeErCF9BuEHeQvgKwg3yFsJXEG6QtxD+BuEGeQvhKwg3yFsIX0FQ/Q9/iPAJCJ+A8AkIn4DwCQj/cPiLCN/4xGH4hMNf5PAJh08gbznMOHzD4RMO3ziccPgEhBnnf5jwCQifsHvxuD/nfwjCJyB8AsJvEN5ymHH+hwmfgPAJCD85zDh8AuETEGYcZpxvHGYcphCmEKY8HtrfC/AJhykOUxy+cbhxmOIw5TDFYYrDtw5TD1MOUw5TD489hE84THGYcvjGg/qPOEx5/JuEN/60w9TD/wTCFIcbh78L4b/x+ITDFIcphxnndx2POEx5/JuEt7zl8BsOnzj8hsOt33CY4jDl8BsOUw5THP4uhxmHKQ5/yuFPIfwKwicgfALCJxDeAr+A8CuE33j0cHjLW5y/4PAJhylnxvmGw78J4VcO/ybCJxymHKYcbjj8ew5/yuOh8BuEtzhMcfgNhxnndw+f8PibHKY4THH4DYcphymH33CYcphymPL4P/H4j//xnxOm+H/i8KccPuHw73F+1+ET/nTHFIe3OL/r8AmHKYe3OL9xeOyZ4DDFYcrjYQPhEw6/4fyphykOnzj8hsOUw5TDJxy+cXiLc4MwxWHKYcrhEw5vObzl0MNhisMUh29w+ITDlMOUwxSHKYcphymHKY9PHKYcphymHKbevw1+AuEThykOUw5TD7/hfALCJxymHKYcPgHhEw5TD1MO33CYcpji8AmHqfcRDp9w+IbDJxym3r8NfsL5Xxw+4TDl8AnObzi/y/kEhE84THGYcphymOIwxWGKw5TzCYdPOHyC8wnndzm/4TDF4RPOIxymOExx+ITHQ+EGYcphisMn/CmPn5DVP434BIQphymP/xOHTzi/67zi8BbnE4e3OL+L8ImfcJhy+IbDJw6/4XDjMOUwxeHfhPAJ55HDJxy+cfgNhymHTzh8g8MnHL6B8AmHTzi8xfldhxsc3nL4hMOUwycQPsH5DYdPOHzi/dvgE85bHL7hMMVhisMUh29wmOIwxWGKw5TDJxy+4TDlMMVhisOUwxSHxw6HKYcphykOUw5TDv8HUEeA7ADxTqoAAAAASUVORK5CYII="
                  alt="PhonePe QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
          </div>

          {/* Payment button */}
          <button
            onClick={handlePaymentSubmit}
            disabled={paymentProcessing}
            className={`w-full py-3 px-4 text-white font-medium rounded-md ${
              paymentProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {paymentProcessing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              "Complete Payment"
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-center text-gray-500 text-xs">
            Secure payment powered by Mammta's Food
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPayment;
