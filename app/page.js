"use client";

import { useState, useEffect } from "react";
import QrCodeGenerator from "./QrCodeGenerator/page";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";
import opentype from "opentype.js";

export function quadraticToLines(
  startPoint,
  controlPoint,
  endPoint,
  segments = 4
) {
  const points = [];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x =
      (1 - t) * (1 - t) * startPoint[0] +
      2 * (1 - t) * t * controlPoint[0] +
      t * t * endPoint[0];
    const y =
      (1 - t) * (1 - t) * startPoint[1] +
      2 * (1 - t) * t * controlPoint[1] +
      t * t * endPoint[1];
    points.push([x, y]);
  }
  return points;
}

export function cubicToLines(
  startPoint,
  controlPoint1,
  controlPoint2,
  endPoint,
  segments = 4
) {
  const points = [];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x =
      Math.pow(1 - t, 3) * startPoint[0] +
      3 * Math.pow(1 - t, 2) * t * controlPoint1[0] +
      3 * (1 - t) * Math.pow(t, 2) * controlPoint2[0] +
      Math.pow(t, 3) * endPoint[0];
    const y =
      Math.pow(1 - t, 3) * startPoint[1] +
      3 * Math.pow(1 - t, 2) * t * controlPoint1[1] +
      3 * (1 - t) * Math.pow(t, 2) * controlPoint2[1] +
      Math.pow(t, 3) * endPoint[1];
    points.push([x, y]);
  }
  return points;
}

export function isClockwise(path) {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum > 0;
}

export const generateDXF = async (
  itemName,
  qrCodeData,
  fontFamily,
  useTextEntity = false
) => {
  const googleFontToTTF = {
    Roboto: "/fonts/Roboto-Regular.ttf",
    "Open Sans": "/fonts/OpenSans-Regular.ttf",
    Lobster: "/fonts/Lobster-Regular.ttf",
    Montserrat: "/fonts/Montserrat-Regular.ttf",
    Arial: "/fonts/Arimo-Regular.ttf",
    Poppins: "/fonts/Poppins-Regular.ttf",
    Raleway: "/fonts/Raleway-Regular.ttf",
    Ubuntu: "/fonts/Ubuntu-Regular.ttf",
    Merriweather: "/fonts/Merriweather_48pt-Regular.ttf",
    "PT Sans": "/fonts/PTSans-Regular.ttf",
  };

  const fontFile = googleFontToTTF[fontFamily] || "/fonts/Roboto-Regular.ttf";
  let font;
  let scale = 1;
  if (!useTextEntity) {
    font = await opentype.load(fontFile);
  }

  const containerWidth = 500;
  const containerHeight = 128;
  const fontSize = 80;
  const qrModuleSize = 1.0;
  const gap = 25;

  let scaledPathGroups = [];
  let textWidth = 0;
  let textX = 0;
  let textY = 0;

  if (!useTextEntity) {
    const path = font.getPath(itemName, 0, 0, fontSize * 10);
    const paths = [];
    let currentPath = [];
    let isHole = false;

    path.commands.forEach((cmd) => {
      switch (cmd.type) {
        case "M":
          if (currentPath.length > 0) {
            paths.push({ points: currentPath, isHole });
          }
          currentPath = [[cmd.x, cmd.y]];
          isHole = false;
          break;
        case "L":
          currentPath.push([cmd.x, cmd.y]);
          break;
        case "Q":
          const start = currentPath[currentPath.length - 1];
          const segments = quadraticToLines(
            start,
            [cmd.x1, cmd.y1],
            [cmd.x, cmd.y],
            4
          );
          segments.forEach((segment) => currentPath.push(segment));
          break;
        case "C":
          const startCubic = currentPath[currentPath.length - 1];
          const segmentsCubic = cubicToLines(
            startCubic,
            [cmd.x1, cmd.y1],
            [cmd.x2, cmd.y2],
            [cmd.x, cmd.y],
            4
          );
          segmentsCubic.forEach((segment) => currentPath.push(segment));
          break;
        case "Z":
          if (currentPath.length > 0) {
            currentPath.push([currentPath[0][0], currentPath[0][1]]);
            isHole = isClockwise(currentPath);
            paths.push({ points: currentPath, isHole });
            currentPath = [];
          }
          break;
      }
    });

    if (currentPath.length > 0) {
      paths.push({ points: currentPath, isHole });
    }

    const cleanedPaths = paths.map((path) => ({
      ...path,
      points: path.points.filter((point, index) => {
        return (
          index === 0 ||
          point[0] !== path.points[index - 1][0] ||
          point[1] !== path.points[index - 1][1]
        );
      }),
    }));

    const outerPaths = cleanedPaths.filter((path) => !path.isHole);
    const holes = cleanedPaths.filter((path) => path.isHole);

    const pathGroups = outerPaths.map((outer) => {
      const outerBounds = {
        minX: Math.min(...outer.points.map((p) => p[0])),
        minY: Math.min(...outer.points.map((p) => p[1])),
        maxX: Math.max(...outer.points.map((p) => p[0])),
        maxY: Math.max(...outer.points.map((p) => p[1])),
      };

      const associatedHoles = holes.filter((hole) => {
        const holePoint = hole.points[0];
        return (
          holePoint[0] >= outerBounds.minX &&
          holePoint[0] <= outerBounds.maxX &&
          holePoint[1] >= outerBounds.minY &&
          holePoint[1] <= outerBounds.maxY
        );
      });

      return {
        outer: outer.points,
        holes: associatedHoles.map((h) => h.points),
      };
    });

    const allPoints = pathGroups.flatMap((group) => group.outer);
    const bbox = {
      minX: Math.min(...allPoints.map((p) => p[0])),
      minY: Math.min(...allPoints.map((p) => p[1])),
      maxX: Math.max(...allPoints.map((p) => p[0])),
      maxY: Math.max(...allPoints.map((p) => p[1])),
    };

    const unitsPerEm = font.unitsPerEm;
    const capHeight = font.tables.os2.sCapHeight || 0.7 * unitsPerEm;
    scale = fontSize / capHeight;

    const textHeight = (bbox.maxY - bbox.minY) * scale;
    const textCenterY = ((bbox.maxY + bbox.minY) / 2) * scale;

    scaledPathGroups = pathGroups.map((group) => ({
      outer: group.outer.map(([x, y]) => [
        (x - bbox.minX) * scale,
        (y - bbox.minY) * scale,
      ]),
      holes: group.holes.map((hole) =>
        hole.map(([x, y]) => [(x - bbox.minX) * scale, (y - bbox.minY) * scale])
      ),
    }));

    textWidth = (bbox.maxX - bbox.minX) * scale;
    textY = containerHeight / 2 - textCenterY;
  } else {
    textWidth = itemName.length * fontSize * 0.6;
    textY = containerHeight / 2 + fontSize * 0.2;
  }

  const qrSize = qrCodeData ? qrCodeData.length : 0;
  const qrWidth = qrSize * qrModuleSize;
  const qrHeight = qrSize * qrModuleSize;

  const totalContentWidth = textWidth + gap + qrWidth;
  const contentCenterX = containerWidth / 2;
  const contentLeftX = contentCenterX - totalContentWidth / 2;

  textX = contentLeftX;
  const qrX = textX + textWidth + gap;

  const containerCenterY = containerHeight / 2;
  const qrY = containerCenterY - qrHeight / 2;

  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$DWGCODEPAGE
3
ANSI_1252
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  if (useTextEntity) {
    dxf += `0
TEXT
8
TEXT_LAYER
10
${textX.toFixed(3)}
20
${textY.toFixed(3)}
30
0
40
${fontSize.toFixed(3)}
1
${itemName}
7
txt
`;
  } else {
    for (const group of scaledPathGroups) {
      if (group.outer.length < 2) continue;

      dxf += `0
LWPOLYLINE
8
TEXT_LAYER
62
0
90
${group.outer.length}
70
1
`;
      for (const [x, y] of group.outer) {
        dxf += `10
${(x + textX).toFixed(3)}
20
${-(y - textY).toFixed(3)}
`;
      }

      for (const hole of group.holes) {
        if (hole.length < 2) continue;
        dxf += `0
LWPOLYLINE
8
TEXT_LAYER
62
0
90
${hole.length}
70
1
`;
        for (const [x, y] of hole) {
          dxf += `10
${(x + textX).toFixed(3)}
20
${-(y - textY).toFixed(3)}
`;
        }
      }
    }
  }

  if (qrCodeData && qrSize > 0) {
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (qrCodeData[y][x]) {
          const x1 = qrX + x * qrModuleSize;
          const y1 = qrY + y * qrModuleSize;
          const x2 = x1 + qrModuleSize;
          const y2 = y1 + qrModuleSize;

          dxf += `0
SOLID
8
QR_LAYER
10
${x1.toFixed(3)}
20
${y1.toFixed(3)}
30
0
11
${x2.toFixed(3)}
21
${y1.toFixed(3)}
31
0
12
${x1.toFixed(3)}
22
${y2.toFixed(3)}
32
0
13
${x2.toFixed(3)}
23
${y2.toFixed(3)}
33
0
`;
        }
      }
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
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontOptions, setFontOptions] = useState([]);

  useEffect(() => {
    const dxfCompatibleFonts = [
      "Roboto",
      "Open Sans",
      "Lobster",
      "Montserrat",
      "Arial",
      "Poppins",
      "Raleway",
      "Ubuntu",
      "Merriweather",
      "PT Sans",
    ];
    setFontOptions(dxfCompatibleFonts);
  }, []);

  useEffect(() => {
    const loadGoogleFont = () => {
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
        " ",
        "+"
      )}:wght@400&display=swap`;
      const link = document.createElement("link");
      link.href = fontUrl;
      link.rel = "stylesheet";
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    };

    loadGoogleFont();
  }, [fontFamily]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    for (const item of generatedItems) {
      if (!item || typeof item !== "string") {
        console.error("Invalid item value:", item);
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

      const dxfContent = await generateDXF(item, qrCodeData, fontFamily);
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
          fontOptions={fontOptions}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
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
                <span
                  style={{ fontFamily }}
                  className="text-black text-lg font-bold flex-1 break-words pr-1 leading-relaxed"
                >
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
