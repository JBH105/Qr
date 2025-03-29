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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [generatedItems, setGeneratedItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateItems = () => {
    setIsGenerating(true);
    const items = [];
    const startNum = Math.max(0, parseInt(start) || 0);
    const endNum = Math.max(0, parseInt(end) || 0);

    if (startNum <= endNum && startNum >= 0) {
      for (let i = startNum; i <= endNum; i++) {
        items.push(`${prefix}${i}`);
      }
    }
    setGeneratedItems(items);
    setTimeout(() => setIsGenerating(false), 300);
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const canvasElements = document.getElementsByTagName("canvas");
    if (canvasElements.length > 0 && generatedItems.length > 0) {
      generatedItems.forEach((item, index) => {
        const link = document.createElement("a");
        link.download = `${item}.dxf`;
        const qrData = [{ x: 0, y: 0 }];
        const dxfContent = generateDXF(qrData, 128, item);
        const blob = new Blob([dxfContent], { type: "application/dxf" });
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            QR Code Generator
          </h2>
          <button
            onClick={toggleModal}
            className="text-gray-500 hover:text-gray-800 text-3xl transition-colors duration-200 hover:rotate-90"
          >
            ×
          </button>
        </div>

        {/* Input Section */}
        <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
          <div className="flex-1 w-full">
            <label className="block text-gray-700 font-medium mb-2">
              Prefix
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Enter prefix (e.g., xyz)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
            />
          </div>
          <div className="flex-1 flex gap-4 w-full">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                Start
              </label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="e.g., 21"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                End
              </label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="e.g., 30"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
              />
            </div>
          </div>
          <button
            onClick={generateItems}
            disabled={isGenerating}
            className={`px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Generated Items Section */}
        {generatedItems.length > 0 && (
          <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 -mr-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {generatedItems.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <p className="text-indigo-900 text-sm font-medium flex-1 break-words pr-4 leading-relaxed">
                    {item}
                  </p>
                  <div className="relative">
                    <QRCodeCanvas
                      value={item}
                      size={100}
                      className="rounded-md shadow-sm transition-transform duration-300 group-hover:scale-110"
                      bgColor="#ffffff"
                      fgColor="#4f46e5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {generatedItems.length > 0 && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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
      </div>
    </div>
  );
}

export default QrCodeGenerator;
