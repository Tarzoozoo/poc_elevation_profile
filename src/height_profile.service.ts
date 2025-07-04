import gdal from "gdal-async";
import fs from "fs";

export interface Point {
  x: number; // longitude/easting
  y: number; // latitude/northing
}

async function getElevationProfile(
  demPath: string,
  point1: Point,
  point2: Point,
  numsamples: number,
  inputCRS = "EPSG:4326"
): Promise<[number, number][]> {
  try {
    console.log("------------------------------------------------------------ getElevationProfile ------------------------------------------------------------");
    // Open the DEM dataset
    const dataset = await gdal.openAsync(demPath);
    // console.log("number of bands: " + dataset.bands.count());
    // console.log("width: " + dataset.rasterSize.x);
    // console.log("height: " + dataset.rasterSize.y);
    // console.log("geotransform: " + dataset.geoTransform);
    // console.log("srs: " + (dataset.srs ? dataset.srs.toWKT() : "null"));
    const band = dataset.bands.get(1); // Get the first (and usually only) band

    // Get DEM CRS (Coordinate Reference System)
    const demCRS = dataset.srs;
    if (!demCRS) {
      throw new Error(
        "DEM does not have a defined coordinate reference system"
      );
    }

    // Create input CRS
    const inputSRS = gdal.SpatialReference.fromUserInput(inputCRS);
    // console.log(`Input CRS: ${inputCRS}`);
    // console.log(`DEM CRS: ${demCRS.toWKT()}`);

    // Transform the points from input CRS to DEM CRS
    let transform = null;
    let transformedPoint1 = point1;
    let transformedPoint2 = point2;

    if (!demCRS.isSame(inputSRS)) {
      console.log(`Converting from ${inputCRS} to DEM CRS`);
      transform = new gdal.CoordinateTransformation(inputSRS, demCRS);

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

    // Get the geotransform to convert between pixel and world coordinates
    const geotransform = dataset.geoTransform;

    // Calculate the step size for sampling along the line (using transformed coordinates)
    const dx_t = (transformedPoint2.x - transformedPoint1.x) / (numsamples - 1);
    const dy_t = (transformedPoint2.y - transformedPoint1.y) / (numsamples - 1);
    console.log("dx:", dx_t, "dy:", dy_t);

    // Calculate total distance between points (in DEM coordinate units)
    const totalDistance = Math.sqrt(
      Math.pow(transformedPoint2.x - transformedPoint1.x, 2) +
        Math.pow(transformedPoint2.y - transformedPoint1.y, 2)
    );
    console.log("Total distance between points:", totalDistance);

    const elevationProfile: [number, number][] = [];

    for (let i = 0; i < numsamples; i++) {
      // Calculate current point along the line (in DEM CRS)
      const currentX = transformedPoint1.x + dx_t * i;
      const currentY = transformedPoint1.y + dy_t * i;
      //   console.log("currentX:", currentX, "currentY:", currentY);

      // Convert world coordinates to pixel coordinates
      const pixelX = Math.round(
        (currentX - geotransform![0]) / geotransform![1]
      );
      const pixelY = Math.round(
        (currentY - geotransform![3]) / geotransform![5]
      );
      //   console.log(
      //     "--------------------------------------------------------------------pixelX:",
      //     pixelX,
      //     "pixelY:",
      //     pixelY
      //   );

      // Calculate distance from start point
      const distance = (i / (numsamples - 1)) * totalDistance;

      // Check if pixel coordinates are within the dataset bounds
      if (
        pixelX >= 0 &&
        pixelX < dataset.rasterSize.x &&
        pixelY >= 0 &&
        pixelY < dataset.rasterSize.y
      ) {
        // Read elevation value at this pixel
        const elevation = await band.pixels.readAsync(pixelX, pixelY, 1, 1);

        elevationProfile.push([distance, elevation[0]]);
      } else {
        elevationProfile.push([distance, NaN]);
      }
    }

    // Close the dataset
    await dataset.close();

    // Save as CSV
    const csv =
      "distance,elevation\n" +
      elevationProfile.map(([dist, elev]) => `${dist},${elev}`).join("\n");
    fs.writeFileSync("elevation_profile.csv", csv);

    return elevationProfile;
  } catch (error) {
    console.error("Error fetching elevation profile:", error);
    throw error;
  }
}

module.exports = {
  getElevationProfile,
};
