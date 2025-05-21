import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const Footer = ({ fontFamily, generatedItems, handleSave, handlePrint }) => {
  return (
    <>
      {generatedItems?.length > 0 && (
        <div className="p-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100 pb-22">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {generatedItems?.map((item, index) => (
              <div
                key={index}
                className="group flex items-center p-4 bg-white border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <span
                  style={{ fontFamily }}
                  className="text-black text-lg font-bold flex-1 break-words pr-1 leading-relaxed"
                >
                  {item?.display}
                </span>
                <QRCodeCanvas
                  value={item}
                  size={100}
                  className="rounded-md shadow-sm transition-transform duration-300 group-hover:scale-110"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {generatedItems?.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t shadow-md flex justify-end gap-3 z-10">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105"
          >
            Save All
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105"
          >
            Print All
          </button>
        </div>
      )}
    </>
  );
};

export default Footer;
