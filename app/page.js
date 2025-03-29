"use client";
import { useState } from "react";
import QrCodeGenerator from "./QrCodeGenerator/page";
import { QRCodeCanvas } from "qrcode.react";

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
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
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
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
      <div className="flex flex-col items-center justify-center">
        <QrCodeGenerator toggleModal={toggleModal} setGeneratedItems={setGeneratedItems} />
        {generatedItems.length <= 0 &&
          <div className="flex items-center justify-center p-6">
            <p className="text-lg font-medium text-gray-700 mb-4">
              No QR Code Available
            </p>
          </div>
        }
      </div>
      {/* Generated Items Section */}
      {generatedItems.length > 0 && (
        <div className="p-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100 pb-22">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {generatedItems.map((item, index) => (
              <div
                key={index}
                className="group flex items-center p-4 bg-white border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="text-black text-lg font-bold flex-1 break-words pr-1 leading-relaxed">
                  {item}
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

      {/* Action Buttons */}
      {generatedItems.length > 0 && (
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

    </div>
  );
}
