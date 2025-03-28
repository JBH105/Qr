"use client";
import { QRCodeCanvas } from "qrcode.react";
import React, { useState } from "react";

const generateDXF = (qrData, size, itemName) => {
  let dxfContent = `0
SECTION
2
ENTITIES
`;

  const qrSize = 128;
  const moduleSize = qrSize / size;

  qrData.forEach((item) => {
    dxfContent += `0
POLYLINE
8
QR_Layer
66
1
10
0.0
20
0.0
30
0.0
0
VERTEX
8
QR_Layer
10
${item.x || 0}
20
${item.y || 0}
30
0.0
0
SEQEND
`;
  });

  dxfContent += `0
ENDSEC
0
EOF
`;

  return dxfContent;
};

function QrCodeGenerator({ toggleModal }) {
  const [prefix, setPrefix] = useState("");
  const [count, setCount] = useState(0);
  const [generatedItems, setGeneratedItems] = useState([]);

  const generateItems = () => {
    const items = [];
    for (let i = 1; i <= count; i++) {
      items.push(`${prefix}${i}`);
    }
    setGeneratedItems(items);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const canvasElements = document.getElementsByTagName("canvas");
    if (canvasElements.length > 0 && generatedItems.length > 0) {
      generatedItems.forEach((item, index) => {
        const link = document.createElement("a");
        // Generate filename with prefix and number
        link.download = `${item}.dxf`;
        
        // Create QR data for single QR code
        const qrData = [{ x: 0, y: 0 }];
        const dxfContent = generateDXF(qrData, 128, item);
        const blob = new Blob([dxfContent], { type: "application/dxf" });
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-screen h-screen m-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Generate QR Codes
            </h2>
            <button
              onClick={toggleModal}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="flex items-end space-x-4 mb-6">
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Enter prefix (e.g., xyz)"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Count</label>
              <input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(Math.max(0, parseInt(e.target.value) || 0))
                }
                placeholder="Enter number"
                min="0"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generateItems}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 h-[42px] mb-0"
            >
              Generate
            </button>
          </div>

          {/* Generated QR Codes */}
          {generatedItems.length > 0 && (
            <div className="mb-6">
              <div className="max-h-[480px] overflow-y-auto">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(164px,1fr))] gap-4">
                  {generatedItems.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <p className="text-gray-600 mb-2 text-sm truncate w-full text-center">
                        {item}
                      </p>
                      <div className="p-2 border-2 border-gray-300 rounded-lg">
                        <QRCodeCanvas value={item} size={128} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 absolute bottom-6 right-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200"
            >
              Save
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200"
            >
              Print
            </button>
            {/* <button
              onClick={toggleModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            >
              Close
            </button> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default QrCodeGenerator;