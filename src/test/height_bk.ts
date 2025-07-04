import gdal from "gdal-async";

export interface Point {
  x: number; // longitude/easting
  y: number; // latitude/northing
}

// const dataset = gdal.open("/home/tarzoozoo/dsm.tif");

// console.log("number of bands: " + dataset.bands.count());
// console.log("width: " + dataset.rasterSize.x);
// console.log("height: " + dataset.rasterSize.y);
// console.log("geotransform: " + dataset.geoTransform);
// console.log("srs: " + (dataset.srs ? dataset.srs.toWKT() : "null"));

// async function getElevationProfile(
//   demPath: string,
//   point1: Point,
//   point2: Point,
//   numsamples: number = 100
// ): Promise<{ elevation: number }[]> {
//   try {
//     const dataset = await gdal.openAsync(demPath);
//     console.log("number of bands: " + dataset.bands.count());
//     console.log("width: " + dataset.rasterSize.x);
//     console.log("height: " + dataset.rasterSize.y);
//     console.log("geotransform: " + dataset.geoTransform);
//     // console.log("srs: " + (dataset.srs ? dataset.srs.toWKT() : "null"));
//     const band = dataset.bands.get(1);

//     const geotransform = dataset.geoTransform;

//     const dx = (point2.x - point1.x) / (numsamples - 1);
//     const dy = (point2.y - point1.y) / (numsamples - 1);
//     const dx2 = Math.abs(point2.x - point1.x) / (numsamples - 1);
//     const dy2 = Math.abs(point2.y - point1.y) / (numsamples - 1);
//     console.log("dx:", dx, "dy:", dy);
//     console.log("dx:", dx2, "dy:", dy2);
//     const totalDistance = Math.sqrt(
//       Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
//     );

//     console.log("Total distance between points:", totalDistance);

//     const elevationProfile: { elevation: number }[] = [];

//     for (let i = 0; i < numsamples; i++) {
//       const currentX = point1.x + dx2 * i;
//       const currentY = point1.y + dy2 * i;

//       console.log("currentX:", currentX, "currentY:", currentY);
//       const pixelX = Math.round(
//         (currentX - geotransform![0]) / geotransform![1]
//       );
//       const pixelY = Math.round(
//         (currentY - geotransform![3]) / geotransform![5]
//       );
//       console.log("--------------------------------------------------------------------pixelX:", pixelX, "pixelY:", pixelY);

//       if (
//         pixelX >= 0 &&
//         pixelX < dataset.rasterSize.x &&
//         pixelY >= 0 &&
//         pixelY < dataset.rasterSize.y
//       ) {
//         const elevation = await band.pixels.readAsync(pixelX, pixelY, 1, 1);

//         elevationProfile.push({ elevation: elevation[0] });
//       } else {
//         elevationProfile.push({ elevation: NaN });
//       }
//     }

//     await dataset.close();

//     return elevationProfile;
//   } catch (error) {
//     console.error("Error fetching elevation profile:", error);
//     throw error;
//   }
// }

async function getElevationProfile(
  demPath: string,
  point1: Point,
  point2: Point,
  numsamples: number = 100,
  inputCRS = "EPSG:4326"
): Promise<{ elevation: number }[]> {
  try {
    const dataset = await gdal.openAsync(demPath);
    console.log("number of bands: " + dataset.bands.count());
    console.log("width: " + dataset.rasterSize.x);
    console.log("height: " + dataset.rasterSize.y);
    console.log("geotransform: " + dataset.geoTransform);
    // console.log("srs: " + (dataset.srs ? dataset.srs.toWKT() : "null"));
    const band = dataset.bands.get(1);

    const demCRS = dataset.srs;
    if (!demCRS) {
      throw new Error(
        "DEM does not have a defined coordinate reference system"
      );
    }

    // Create input CRS
    const inputSRS = gdal.SpatialReference.fromUserInput(inputCRS);
    console.log(`Input CRS: ${inputCRS}`);
    console.log(`DEM CRS: ${demCRS.toWKT()}`);

    // Create coordinate transformation if needed
    let transform = null;
    let transformedPoint1 = point1;
    let transformedPoint2 = point2;

    if (!demCRS.isSame(inputSRS)) {
      console.log(`Converting from ${inputCRS} to DEM CRS`);
      transform = new gdal.CoordinateTransformation(inputSRS, demCRS);

      // Transform the points
      const pt1 = transform.transformPoint(point1.x, point1.y);
      const pt2 = transform.transformPoint(point2.x, point2.y);

      transformedPoint1 = { x: pt1.x, y: pt1.y };
      transformedPoint2 = { x: pt2.x, y: pt2.y };

      console.log(
        `Original points: (${point1.x}, ${point1.y}) -> (${point2.x}, ${point2.y})`
      );
      console.log(
        `Transformed points: (${transformedPoint1.x}, ${transformedPoint1.y}) -> (${transformedPoint2.x}, ${transformedPoint2.y})`
      );
    }

    const geotransform = dataset.geoTransform;

    const dx = (point2.x - point1.x) / (numsamples - 1);
    const dy = (point2.y - point1.y) / (numsamples - 1);
    const dx2 =
      Math.abs(transformedPoint2.x - transformedPoint1.x) / (numsamples - 1);
    const dy2 =
      Math.abs(transformedPoint2.y - transformedPoint1.y) / (numsamples - 1);
    const dx_t = (transformedPoint2.x - transformedPoint1.x) / (numsamples - 1);
    const dy_t = (transformedPoint2.y - transformedPoint1.y) / (numsamples - 1);
    console.log("dx:", dx, "dy:", dy);
    console.log("dx:", dx2, "dy:", dy2);
    const totalDistance = Math.sqrt(
      Math.pow(transformedPoint2.x - transformedPoint1.x, 2) +
        Math.pow(transformedPoint2.y - transformedPoint1.y, 2)
    );

    console.log("Total distance between points:", totalDistance);

    const elevationProfile: { elevation: number }[] = [];

    for (let i = 0; i < numsamples; i++) {
      const currentX = transformedPoint1.x + dx_t * i;
      const currentY = transformedPoint1.y + dy_t * i;

      console.log("currentX:", currentX, "currentY:", currentY);
      const pixelX = Math.round(
        (currentX - geotransform![0]) / geotransform![1]
      );
      const pixelY = Math.round(
        (currentY - geotransform![3]) / geotransform![5]
      );
      console.log(
        "--------------------------------------------------------------------pixelX:",
        pixelX,
        "pixelY:",
        pixelY
      );

      if (
        pixelX >= 0 &&
        pixelX < dataset.rasterSize.x &&
        pixelY >= 0 &&
        pixelY < dataset.rasterSize.y
      ) {
        const elevation = await band.pixels.readAsync(pixelX, pixelY, 1, 1);

        elevationProfile.push({ elevation: elevation[0] });
      } else {
        elevationProfile.push({ elevation: NaN });
      }
    }

    await dataset.close();

    return elevationProfile;
  } catch (error) {
    console.error("Error fetching elevation profile:", error);
    throw error;
  }
}

module.exports = {
  getElevationProfile,
};
