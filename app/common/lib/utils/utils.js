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
