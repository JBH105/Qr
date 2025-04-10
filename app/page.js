"use client";
import { useState } from "react";
import QrCodeGenerator from "./QrCodeGenerator/page";
import { QRCodeCanvas } from "qrcode.react";
import opentype from "opentype.js";

function flattenContour(path, steps = 32) {
  const contours = [];
  let contour = [];
  let cx = 0,
    cy = 0;

  for (const cmd of path.commands) {
    if (cmd.type === "M") {
      if (contour.length > 0) {
        contours.push(contour);
        contour = [];
      }
      cx = cmd.x;
      cy = cmd.y;
      contour.push([cx, cy]);
    } else if (cmd.type === "L") {
      cx = cmd.x;
      cy = cmd.y;
      contour.push([cx, cy]);
    } else if (cmd.type === "Q") {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = (1 - t) ** 2 * cx + 2 * (1 - t) * t * cmd.x1 + t ** 2 * cmd.x;
        const y = (1 - t) ** 2 * cy + 2 * (1 - t) * t * cmd.y1 + t ** 2 * cmd.y;
        contour.push([x, y]);
      }
      cx = cmd.x;
      cy = cmd.y;
    } else if (cmd.type === "C") {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x =
          (1 - t) ** 3 * cx +
          3 * (1 - t) ** 2 * t * cmd.x1 +
          3 * (1 - t) * t ** 2 * cmd.x2 + 
          t ** 3 * cmd.x;
        const y =
          (1 - t) ** 3 * cy +
          3 * (1 - t) ** 2 * t * cmd.y1 +
          3 * (1 - t) * t ** 2 * cmd.y2 +
          t ** 3 * cmd.y;
        contour.push([x, y]);
      }
      cx = cmd.x;
      cy = cmd.y;
    } else if (cmd.type === "Z") {
      if (
        contour.length &&
        (contour[0][0] !== contour.at(-1)[0] ||
          contour[0][1] !== contour.at(-1)[1])
      ) {
        contour.push(contour[0]);
      }
    }
  }

  if (contour.length > 0) contours.push(contour);
  return contours;
}

function getBoundingBox(contours) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const contour of contours) {
    for (const [x, y] of contour) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, maxX, minY, maxY };
}

export const generateDXF = async (value, moduleSize, itemName) => {
  const font = await opentype.load("/fonts/Roboto-Regular.ttf");
  const fontSize = 1000;
  const path = font.getPath(itemName, 0, 0, fontSize);
  const contours = flattenContour(path, 32); // High resolution
  const bbox = getBoundingBox(contours);

  const offsetX = -bbox.minX;
  const offsetY = -bbox.maxY;

  let dxf = `0
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
ENTITIES
`;

  for (const contour of contours) {
    dxf += `0
LWPOLYLINE
8
TEXT_LAYER
90
${contour.length}
70
1
`;
    for (const [x, y] of contour) {
      dxf += `10
${(x + offsetX).toFixed(3)}
20
${(-(y + offsetY)).toFixed(3)}
`;
    }
  }

  dxf += `0
ENDSEC
0
EOF`;

  return dxf;
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
      const dxfContent = await generateDXF(item, 1, item);
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
