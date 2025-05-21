"use client";

import { useState, useEffect } from "react";
import QrCodeGenerator from "./QrCodeGenerator/page";
import QRCode from "qrcode";
import opentype from "opentype.js";
import Footer from "./components/footer";
import {
  cubicToLines,
  isClockwise,
  quadraticToLines,
} from "./common/lib/utils/utils";

export const generateDXF = async (item, qrCodeData, useTextEntity = false) => {
  const googleFontToTTF = {
    Amerto: "/fonts/amerton-outline.ttf",
    Roman: "/fonts/romans__.ttf",
  };

  // Initialize variables
  let amertoFont, romanFont;
  let scaleAmerto = 1,
    scaleRoman = 1;
  let scaledSeriesPaths = [],
    scaledHyphenPaths = [],
    scaledSeriesNumberPaths = [];
  let seriesPaths = [],
    hyphenPaths = [],
    seriesNumberPaths = [];
  let seriesWidth = 0,
    hyphenWidth = 0,
    seriesNumberWidth = 0;
  let seriesX = 0,
    hyphenX = 0,
    seriesNumberX = 100,
    textY = 0;

  const containerWidth = 500; // mm
  const containerHeight = 128; // mm
  const fontSize = 80; // Desired font size in mm
  const qrModuleSize = 8.0; // mm
  const seriesNumberGap = item?.gapBetweenTextAndQR
    ? item?.gapBetweenTextAndQR
    : 150;
  let hyphenGapLeft = 0; // Single space before hyphen
  let hyphenGapRight = 0; // Single space after hyphen

  if (!useTextEntity) {
    // Load fonts with better error handling
    try {
      console.log(
        "Attempting to load Amerto font from:",
        googleFontToTTF.Amerto
      );
      amertoFont = await opentype.load(googleFontToTTF.Amerto);
      console.log("Amerto font loaded successfully");
    } catch (error) {
      console.error("Failed to load Amerto font:", error);
      throw new Error(
        `Failed to load Amerto font from ${googleFontToTTF.Amerto}. Please check the file path and server configuration.`
      );
    }

    try {
      console.log("Attempting to load Roman font from:", googleFontToTTF.Roman);
      romanFont = await opentype.load(googleFontToTTF.Roman);
      console.log("Roman font loaded successfully");
    } catch (error) {
      console.error("Failed to load Roman font:", error);
      throw new Error(
        `Failed to load Roman font from ${googleFontToTTF.Roman}. Please check the file path and server configuration.`
      );
    }

    // Calculate space width for hyphen gaps
    const spaceWidth =
      romanFont.getAdvanceWidth(" ", fontSize * 10) *
      (fontSize / romanFont.unitsPerEm);
    hyphenGapLeft = spaceWidth; // Single space before hyphen
    hyphenGapRight = spaceWidth; // Single space after hyphen

    // Process series name (Amerto font, 2-line outline)
    let currentPath = [];
    let paths = [];
    let isHole = false;
    const seriesPath = amertoFont.getPath(
      item.series || "",
      0,
      0,
      fontSize * 10
    );
    seriesPath.commands.forEach((cmd) => {
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

    const cleanedSeriesPaths = paths.map((path) => ({
      ...path,
      points: path.points.filter((point, index) => {
        return (
          index === 0 ||
          point[0] !== path.points[index - 1][0] ||
          point[1] !== path.points[index - 1][1]
        );
      }),
    }));

    // Process hyphen (Roman font, 1-line outline)
    paths = [];
    currentPath = [];
    isHole = false;
    const hyphenPath = romanFont.getPath("-", 0, 0, fontSize * 10);
    hyphenPath.commands.forEach((cmd) => {
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

    const cleanedHyphenPaths = paths.map((path) => ({
      ...path,
      points: path.points.filter((point, index) => {
        return (
          index === 0 ||
          point[0] !== path.points[index - 1][0] ||
          point[1] !== path.points[index - 1][1]
        );
      }),
    }));

    // Process series number (Roman font, 1-line outline)
    paths = [];
    currentPath = [];
    isHole = false;
    const seriesNumberPath = romanFont.getPath(
      item.seriesNumber || "",
      0,
      0,
      fontSize * 10
    );
    seriesNumberPath.commands.forEach((cmd) => {
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

    const cleanedSeriesNumberPaths = paths.map((path) => ({
      ...path,
      points: path.points.filter((point, index) => {
        return (
          index === 0 ||
          point[0] !== path.points[index - 1][0] ||
          point[1] !== path.points[index - 1][1]
        );
      }),
    }));

    // Group paths for series
    const seriesOuterPaths = cleanedSeriesPaths.filter((path) => !path.isHole);
    const seriesHoles = cleanedSeriesPaths.filter((path) => path.isHole);
    seriesPaths = seriesOuterPaths.map((outer) => {
      const outerBounds = {
        minX: Math.min(...outer.points.map((p) => p[0])),
        minY: Math.min(...outer.points.map((p) => p[1])),
        maxX: Math.max(...outer.points.map((p) => p[0])),
        maxY: Math.max(...outer.points.map((p) => p[1])),
      };
      const associatedHoles = seriesHoles.filter((hole) => {
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

    // Group paths for hyphen
    const hyphenOuterPaths = cleanedHyphenPaths.filter((path) => !path.isHole);
    const hyphenHoles = cleanedHyphenPaths.filter((path) => path.isHole);
    hyphenPaths = hyphenOuterPaths.map((outer) => {
      const outerBounds = {
        minX: Math.min(...outer.points.map((p) => p[0])),
        minY: Math.min(...outer.points.map((p) => p[1])),
        maxX: Math.max(...outer.points.map((p) => p[0])),
        maxY: Math.max(...outer.points.map((p) => p[1])),
      };
      const associatedHoles = hyphenHoles.filter((hole) => {
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

    // Group paths for series number
    const seriesNumberOuterPaths = cleanedSeriesNumberPaths.filter(
      (path) => !path.isHole
    );
    const seriesNumberHoles = cleanedSeriesNumberPaths.filter(
      (path) => path.isHole
    );
    seriesNumberPaths = seriesNumberOuterPaths.map((outer) => {
      const outerBounds = {
        minX: Math.min(...outer.points.map((p) => p[0])),
        minY: Math.min(...outer.points.map((p) => p[1])),
        maxX: Math.max(...outer.points.map((p) => p[0])),
        maxY: Math.max(...outer.points.map((p) => p[1])),
      };
      const associatedHoles = seriesNumberHoles.filter((hole) => {
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

    // Calculate bounding boxes
    const seriesPoints = seriesPaths.flatMap((group) => group.outer);
    const seriesBbox =
      seriesPoints.length > 0
        ? {
            minX: Math.min(...seriesPoints.map((p) => p[0])),
            minY: Math.min(...seriesPoints.map((p) => p[1])),
            maxX: Math.max(...seriesPoints.map((p) => p[0])),
            maxY: Math.max(...seriesPoints.map((p) => p[1])),
          }
        : { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    const hyphenPoints = hyphenPaths.flatMap((group) => group.outer);
    const hyphenBbox =
      hyphenPoints.length > 0
        ? {
            minX: Math.min(...hyphenPoints.map((p) => p[0])),
            minY: Math.min(...hyphenPoints.map((p) => p[1])),
            maxX: Math.max(...hyphenPoints.map((p) => p[0])),
            maxY: Math.max(...hyphenPoints.map((p) => p[1])),
          }
        : { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    const seriesNumberPoints = seriesNumberPaths.flatMap(
      (group) => group.outer
    );
    const seriesNumberBbox =
      seriesNumberPoints.length > 0
        ? {
            minX: Math.min(...seriesNumberPoints.map((p) => p[0])),
            minY: Math.min(...seriesNumberPoints.map((p) => p[1])),
            maxX: Math.max(...seriesNumberPoints.map((p) => p[0])),
            maxY: Math.max(...seriesNumberPoints.map((p) => p[1])),
          }
        : { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    // Scale fonts to match desired font size
    const amertoUnitsPerEm = amertoFont.unitsPerEm;
    const amertoCapHeight =
      amertoFont.tables.os2?.sCapHeight || 0.7 * amertoUnitsPerEm;
    scaleAmerto = fontSize / amertoCapHeight;

    const romanUnitsPerEm = romanFont.unitsPerEm;
    const romanCapHeight =
      romanFont.tables.os2?.sCapHeight || 0.7 * romanUnitsPerEm;
    scaleRoman = fontSize / romanCapHeight;

    // Scale paths
    scaledSeriesPaths = seriesPaths.map((group) => ({
      outer: group.outer.map(([x, y]) => [
        (x - seriesBbox.minX) * scaleAmerto,
        (y - seriesBbox.minY) * scaleAmerto,
      ]),
      holes: group.holes.map((hole) =>
        hole.map(([x, y]) => [
          (x - seriesBbox.minX) * scaleAmerto,
          (y - seriesBbox.minY) * scaleAmerto,
        ])
      ),
    }));

    scaledHyphenPaths = hyphenPaths.map((group) => ({
      outer: group.outer.map(([x, y]) => [
        (x - hyphenBbox.minX) * scaleRoman,
        (y - hyphenBbox.minY) * scaleRoman,
      ]),
      holes: group.holes.map((hole) =>
        hole.map(([x, y]) => [
          (x - hyphenBbox.minX) * scaleRoman,
          (y - hyphenBbox.minY) * scaleRoman,
        ])
      ),
    }));

    scaledSeriesNumberPaths = seriesNumberPaths.map((group) => ({
      outer: group.outer.map(([x, y]) => [
        (x - seriesNumberBbox.minX) * scaleRoman,
        (y - seriesNumberBbox.minY) * scaleRoman,
      ]),
      holes: group.holes.map((hole) =>
        hole.map(([x, y]) => [
          (x - seriesNumberBbox.minX) * scaleRoman,
          (y - seriesNumberBbox.minY) * scaleRoman,
        ])
      ),
    }));

    // Calculate text widths
    seriesWidth =
      seriesPoints.length > 0
        ? (seriesBbox.maxX - seriesBbox.minX) * scaleAmerto
        : 0;
    hyphenWidth =
      hyphenPoints.length > 0
        ? (hyphenBbox.maxX - hyphenBbox.minX) * scaleRoman
        : 0;
    seriesNumberWidth =
      seriesNumberPoints.length > 0
        ? (seriesNumberBbox.maxX - seriesNumberBbox.minX) * scaleRoman
        : 0;

    // Align text vertically (center all text components)
    const seriesHeight =
      seriesPoints.length > 0
        ? (seriesBbox.maxY - seriesBbox.minY) * scaleAmerto
        : 0;
    const hyphenHeight =
      hyphenPoints.length > 0
        ? (hyphenBbox.maxY - hyphenBbox.minY) * scaleRoman
        : 0;
    const seriesNumberHeight =
      seriesNumberPoints.length > 0
        ? (seriesNumberBbox.maxY - seriesNumberBbox.minY) * scaleRoman
        : 0;
    const maxTextHeight = Math.max(
      seriesHeight,
      hyphenHeight,
      seriesNumberHeight
    );
    textY = containerHeight / 2 - maxTextHeight / 2;
  } else {
    // Fallback for text entities
    seriesWidth = (item.series || "").length * fontSize * 0.6;
    hyphenWidth = 1 * fontSize * 0.6; // Approximate hyphen width
    seriesNumberWidth = (item.seriesNumber || "").length * fontSize * 0.6;
    hyphenGapLeft = fontSize * 0.3; // Approximate space width
    hyphenGapRight = fontSize * 0.3; // Approximate space width
    textY = containerHeight / 2 + fontSize * 0.2;
  }

  // Positioning
  const qrSize = qrCodeData ? qrCodeData.length : 0;
  const qrWidth = qrSize * qrModuleSize;
  const qrHeight = qrSize * qrModuleSize;

  const totalTextWidth =
    seriesWidth +
    hyphenGapLeft +
    hyphenWidth +
    hyphenGapRight +
    seriesNumberWidth;
  const totalContentWidth = totalTextWidth + seriesNumberGap + qrWidth;
  const contentCenterX = containerWidth / 2;
  const contentLeftX = contentCenterX - totalContentWidth / 2;

  seriesX = contentLeftX;
  hyphenX = seriesX + seriesWidth + hyphenGapLeft;
  seriesNumberX = hyphenX + hyphenWidth + hyphenGapRight;
  const qrX = seriesNumberX + seriesNumberWidth + seriesNumberGap;
  const qrY = containerHeight / 2 - qrHeight / 2;

  // Generate DXF
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
    // Series name (Amerto)
    dxf += `0
TEXT
8
TEXT_LAYER
10
${seriesX.toFixed(3)}
20
${textY.toFixed(3)}
30
0
40
${fontSize.toFixed(3)}
1
${item.series || ""}
7
Amerto
`;

    // Hyphen (Roman font)
    dxf += `0
TEXT
8
TEXT_LAYER
10
${hyphenX.toFixed(3)}
20
${textY.toFixed(3)}
30
0
40
${fontSize.toFixed(3)}
1
-
7
Roman
`;

    // Series number (Roman font)
    dxf += `0
TEXT
8
TEXT_LAYER
10
${seriesNumberX.toFixed(3)}
20
${textY.toFixed(3)}
30
0
40
${fontSize.toFixed(3)}
1
${item.seriesNumber || ""}
7
Roman
`;
  } else {
    // Series name paths (2-line outline)
    const offset = 0.4; // Adjust this value for the thickness of the double line (in mm)
    for (const group of scaledSeriesPaths) {
      if (group.outer.length < 2) continue;
      // First outline
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
${(x + seriesX).toFixed(3)}
20
${-(y - textY).toFixed(3)}
`;
      }
      // Second outline (offset slightly for double-line effect)
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
${(x + seriesX + offset).toFixed(3)}
20
${-(y - textY + offset).toFixed(3)}
`;
      }
      for (const hole of group.holes) {
        if (hole.length < 2) continue;
        // First hole outline
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
${(x + seriesX).toFixed(3)}
20
${-(y - textY).toFixed(3)}
`;
        }
        // Second hole outline
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
${(x + seriesX + offset).toFixed(3)}
20
${-(y - textY + offset).toFixed(3)}
`;
        }
      }
    }

    // Hyphen paths (1-line outline)
    for (const group of scaledHyphenPaths) {
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
${(x + hyphenX).toFixed(3)}
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
${(x + hyphenX).toFixed(3)}
20
${-(y - textY).toFixed(3)}
`;
        }
      }
    }

    // Series number paths (1-line outline)
    for (const group of scaledSeriesNumberPaths) {
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
${(x + seriesNumberX).toFixed(3)}
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
${(x + seriesNumberX).toFixed(3)}
20
${-(y - textY).toFixed(3)}
`;
        }
      }
    }
  }

  // QR Code (Dotted Pattern)
  if (qrCodeData && qrSize > 0) {
    const dotRadius = qrModuleSize * 0.3; // 0.3 mm for 1 mm module
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (qrCodeData[y][x]) {
          const centerX = qrX + x * qrModuleSize + qrModuleSize / 2;
          console.log("🚀 ~ generateDXF ~ centerX:", centerX);
          const centerY = qrY + y * qrModuleSize + qrModuleSize / 2;
          console.log("🚀 ~ generateDXF ~ centerY:", centerY);

          dxf += `0
CIRCLE
8
QR_LAYER
62
0
10
${centerX.toFixed(3)}
20
${-centerY.toFixed(3)}
30
0
40
${dotRadius.toFixed(3)}
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
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Font
  const [fontFamily, setFontFamily] = useState("Amerto");
  const [fontOptions, setFontOptions] = useState([]);
  // Qr CodeGenerator States
  const [series, setSeries] = useState("");
  const [seriesNumber, setSeriesNumber] = useState("");
  const [gapBetweenTextAndQR, setGapBetweenTextAndQR] = useState(150);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  // Generated Items
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);

  useEffect(() => {
    setFontOptions(["Amerto", "Romans"]);
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

  const generateItems = () => {
    setIsGenerating(true);
    const items = [];
    const startNum = Math.max(0, parseInt(start) || 0);
    const endNum = Math.max(0, parseInt(end) || 0);

    if (startNum <= endNum && startNum >= 0) {
      for (let i = startNum; i <= endNum; i++) {
        items.push({
          series: series,
          seriesNumber: `${seriesNumber}${i}`,
          display: `${series} - ${seriesNumber}${i}`,
          gapBetweenTextAndQR,
        });
      }
    }

    setGeneratedItems(items);
    setTimeout(() => setIsGenerating(false), 300);
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    for (const item of generatedItems) {
      let qrCodeData = null;
      try {
        qrCodeData = await new Promise((resolve, reject) => {
          QRCode.toDataURL(
            item.display,
            { width: 100, margin: 1 },
            (err, url) => {
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
            }
          );
        });
      } catch (error) {
        console.error("Failed to generate QR code for item:", item, error);
        qrCodeData = null;
      }

      const dxfContent = await generateDXF(item, qrCodeData);
      const blob = new Blob([dxfContent], { type: "application/dxf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${item.display}.dxf`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
      <div className="flex flex-col items-center justify-center">
        <QrCodeGenerator
          toggleModal={toggleModal}
          fontOptions={fontOptions}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          series={series}
          setSeries={setSeries}
          seriesNumber={seriesNumber}
          setSeriesNumber={setSeriesNumber}
          gapBetweenTextAndQR={gapBetweenTextAndQR}
          setGapBetweenTextAndQR={setGapBetweenTextAndQR}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          isGenerating={isGenerating}
          generateItems={generateItems}
        />
        {generatedItems?.length <= 0 && (
          <div className="flex items-center justify-center p-6">
            <p className="text-lg font-medium text-gray-700 mb-4">
              No QR Code Available
            </p>
          </div>
        )}
      </div>
      <Footer
        fontFamily={fontFamily}
        generatedItems={generatedItems}
        handleSave={handleSave}
        handlePrint={handlePrint}
      />
    </div>
  );
}
