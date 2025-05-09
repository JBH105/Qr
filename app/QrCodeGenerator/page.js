"use client";
import React, { useState } from "react";

function QrCodeGenerator({ toggleModal, setGeneratedItems, fontOptions, fontFamily, setFontFamily }) {
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
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

  return (
    // <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            Select Font
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e?.target?.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
          >
            {fontOptions?.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-gray-700 font-medium mb-2">Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            style={{ fontFamily }}
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
              style={{ fontFamily }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">End</label>
            <input
              type="number"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="e.g., 30"
              min="0"
              style={{ fontFamily }}
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
    </div>
    // </div>
  );
}

export default QrCodeGenerator;
