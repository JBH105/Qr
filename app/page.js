"use client";
import { useState } from "react";
import QrCodeGenerator from "./QrCodeGenerator/page";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";

export const generateDXF = async (itemName, qrCodeData) => {
  const containerWidth = 500;
  const containerHeight = 128;

  const fontHeight = 80;
  const textWidth = itemName.length * (fontHeight * 0.9); 

  const qrSize = qrCodeData ? qrCodeData.length : 0;
  const qrModuleSize = 1.5;
  const qrWidth = qrSize * qrModuleSize;
  const qrHeight = qrSize * qrModuleSize;

  const totalContentWidth = textWidth + 20 + qrWidth;
  const paddingX = (containerWidth - totalContentWidth) / 2;

  const posX = paddingX;
  const containerCenterY = containerHeight / 2;
  const textCenterY = fontHeight / 2;
  const posY = containerCenterY - textCenterY;

  const qrX = posX + textWidth + 20;
  const qrCenterY = qrHeight / 2;
  const qrY = containerCenterY - qrCenterY;

  let dxfHeader = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1027
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
STYLE
70
1
0
STYLE
2
StandardStyle
3
STANDARD
40
0
41
1
50
0
71
0
42
1
73
0
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  let dxfEntities = `0
TEXT
8
TEXT_LAYER
10
${posX}
20
${posY}
30
0
40
${fontHeight}
1
${itemName}
50
0
7
StandardStyle
72
0
73
0
`;

  if (qrCodeData && qrSize > 0) {
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (qrCodeData[y][x]) {
          const x1 = qrX + x * qrModuleSize;
          const y1 = qrY + y * qrModuleSize;
          const x2 = x1 + qrModuleSize;
          const y2 = y1 + qrModuleSize;

          dxfEntities += `0
SOLID
8
QR_LAYER
10
${x1}
20
${y1}
30
0
11
${x2}
21
${y1}
31
0
12
${x1}
22
${y2}
32
0
13
${x2}
23
${y2}
33
0
`;
        }
      }
    }
  }

  let dxfFooter = `0
ENDSEC
0
EOF`;

  return dxfHeader + dxfEntities + dxfFooter;
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    for (const item of generatedItems) {
      if (!item || typeof item !== "string") {
        console.error(" SLS Invalid item value:", item);
        continue;
      }

      let qrCodeData = null;
      try {
        qrCodeData = await new Promise((resolve, reject) => {
          QRCode.toDataURL(item, { width: 100, margin: 1 }, (err, url) => {
            if (err) return reject(err);

            const img = new Image();
            img.src = url;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);

              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const data = imageData.data;
              const size = canvas.width;
              const qrCodeMatrix = [];

              for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                  const idx = (y * size + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  row.push(r < 128 && g < 128 && b < 128);
                }
                qrCodeMatrix.push(row);
              }

              resolve(qrCodeMatrix);
            };
            img.onerror = () =>
              reject(new Error("Failed to load QR code image"));
          });
        });
      } catch (error) {
        console.error("Failed to generate QR code for item:", item, error);
        qrCodeData = null;
      }

      const dxfContent = await generateDXF(item, qrCodeData);
      const blob = new Blob([dxfContent], { type: "application/dxf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${item}.dxf`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
      <div className="flex flex-col items-center justify-center">
        <QrCodeGenerator
          toggleModal={toggleModal}
          setGeneratedItems={setGeneratedItems}
        />
        {generatedItems.length <= 0 && (
          <div className="flex items-center justify-center p-6">
            <p className="text-lg font-medium text-gray-700 mb-4">
              No QR Code Available
            </p>
          </div>
        )}
      </div>
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
