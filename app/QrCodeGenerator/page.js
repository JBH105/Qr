"use client";

function QrCodeGenerator({
  toggleModal,
  fontOptions,
  fontFamily,
  setFontFamily,
  series,
  setSeries,
  seriesNumber,
  setSeriesNumber,
  gapBetweenTextAndQR,
  setGapBetweenTextAndQR,
  start,
  setStart,
  end,
  setEnd,
  isGenerating,
  generateItems,
}) {
  return (
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
        {/* Font Selector */}
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

        {/* Series Field */}
        <div className="flex-1 w-full">
          <label className="block text-gray-700 font-medium mb-2">Series</label>
          <input
            type="text"
            value={series}
            onChange={(e) => setSeries(e?.target?.value)}
            style={{ fontFamily }}
            placeholder="Please enter the series"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
          />
        </div>

        {/* Series Number Field */}
        <div className="flex-1 w-full">
          <label className="block text-gray-700 font-medium mb-2">
            Series Number
          </label>
          <input
            type="number"
            value={seriesNumber}
            onChange={(e) => setSeriesNumber(e?.target?.value)}
            style={{ fontFamily }}
            placeholder="Please enter the series number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
          />
        </div>

        {/* Gap Betwwen Text and QR Field */}
        <div className="flex-1 w-full">
          <label className="block text-gray-700 font-medium mb-2">
            Gap between Series Text and QR Code (µm)
          </label>
          <input
            type="number"
            value={gapBetweenTextAndQR}
            onChange={(e) => setGapBetweenTextAndQR(parseInt(e?.target?.value))}
            placeholder="e.g., 150"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
          />
        </div>

        {/* Start/End */}
        <div className="flex-1 flex gap-4 w-full">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">
              Start
            </label>
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(e?.target?.value)}
              placeholder="e.g., 1"
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
              onChange={(e) => setEnd(e?.target?.value)}
              placeholder="e.g., 10"
              min="0"
              style={{ fontFamily }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:border-indigo-400"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateItems}
          disabled={isGenerating}
          className={`px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

export default QrCodeGenerator;
