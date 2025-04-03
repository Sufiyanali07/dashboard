import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MockApiService } from "../services/mockApi";

const PublicReceipt = () => {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        // Get receipt from API
        const fetchedReceipt = await MockApiService.getBillById(id);
        if (fetchedReceipt) {
          setReceipt(fetchedReceipt);
          setError(null);
        } else {
          setError("Receipt not found");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReceipt();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
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
              Receipt Not Found
            </h2>
            <p className="text-gray-600 mt-2">
              {error ||
                "The receipt you're looking for doesn't exist or has been removed."}
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

  // Format date
  const formattedDate = new Date(receipt.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get status class
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Receipt #{id}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                receipt.status
              )}`}
            >
              {receipt.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formattedDate}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{receipt.customerName}</p>
            <p className="text-gray-600">{receipt.phone}</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Items</p>
            {receipt.itemsDetail ? (
              <ul className="divide-y divide-gray-200">
                {receipt.itemsDetail.split(", ").map((item, index) => (
                  <li key={index} className="py-2 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            ) : receipt.itemsList && receipt.itemsList.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {receipt.itemsList.map((item, index) => (
                  <li key={index} className="py-2 flex justify-between">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500">
                        ₹{item.price.toFixed(2)} each
                      </div>
                      <div>₹{item.subtotal.toFixed(2)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">{receipt.items} items</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-medium">₹{receipt.total.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-600">Tax</p>
              <p className="font-medium">₹0.00</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <p className="text-lg font-bold">Total</p>
              <p className="text-lg font-bold">₹{receipt.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            Thank you for your business!
          </p>
          <p className="text-center text-gray-500 text-xs mt-1">
            Mammta's Food
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicReceipt;
