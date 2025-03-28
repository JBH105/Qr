"use client";
import { useState } from "react";
import QrCodeGenerator from "./QrCodeGenerator/page";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <div className="w-full flex justify-end mt-3 mr-3">
          <button
            onClick={toggleModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            Click Me
          </button>
        </div>
        <div className="flex items-center justify-center p-6">
          <p className="text-lg font-medium text-gray-700 mb-4">
            No QR Code Available
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && <QrCodeGenerator toggleModal={toggleModal} />}
    </>
  );
}
