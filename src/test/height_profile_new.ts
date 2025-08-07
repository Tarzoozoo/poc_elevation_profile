import gdal from "gdal-async";
import fs from "fs";

export interface GeographicPoint {
  lon: number; // longitude
  lat: number; // latitude
}

export interface ProjectedPoint {
  x: number; // longitude
  y: number; // latitude
}

console.log("gdal keys:", Object.keys(gdal));
console.log("open:", gdal.open);
console.log("openAsync:", gdal.openAsync);

async function getElevationProfile(
  demPath: string,
  point1: GeographicPoint,
  point2: GeographicPoint,
  numsamples: number,
  inputCRS = "EPSG:4326"
): Promise<[number, number][]> {
  try {
    console.log(
      "------------------------------------------------------------ getElevationProfile ------------------------------------------------------------"
    );
    // Open the DEM dataset
    const dataset = await gdal.openAsync(demPath);
    const band = dataset.bands.get(1); // Get the first (and usually only) band

    // Get DEM CRS (Coordinate Reference System)
    const demCRS = dataset.srs;
    if (!demCRS) {
      throw new Error(
        "DEM does not have a defined coordinate reference system"
      );
    }

    // Validate input coordinates
    console.log(`Validating input coordinates:`);
    console.log(`Point 1 (lon, lat): (${point1.lon}, ${point1.lat})`);
    console.log(`Point 2 (lon, lat): (${point2.lon}, ${point2.lat})`);

    // Check if coordinates are within valid ranges for geographic coordinates
    if (inputCRS === "EPSG:4326") {
      if (Math.abs(point1.lon) > 180 || Math.abs(point2.lon) > 180) {
        throw new Error(
          `Invalid longitude values. Must be between -180 and 180. Got: ${point1.lon}, ${point2.lon}`
        );
      }
      if (Math.abs(point1.lat) > 90 || Math.abs(point2.lat) > 90) {
        throw new Error(
          `Invalid latitude values. Must be between -90 and 90. Got: ${point1.lat}, ${point2.lat}`
        );
      }
    }

    // Create input CRS
    const inputSRS = gdal.SpatialReference.fromUserInput(inputCRS);
    console.log(`Input CRS: ${inputCRS}`);
    console.log(`DEM CRS: ${demCRS.toWKT()}`);

    // Transform the points from input CRS to DEM CRS
    let transform = null;
    let transformedPoint1: ProjectedPoint = { x: 0, y: 0 };
    let transformedPoint2: ProjectedPoint = { x: 0, y: 0 };

    if (!demCRS.isSame(inputSRS)) {
      console.log(`Converting from ${inputCRS} to DEM CRS`);
      try {
        transform = new gdal.CoordinateTransformation(inputSRS, demCRS);

        // For EPSG:4326, GDAL expects coordinates in the order defined by the CRS axis
        // EPSG:4326 has AXIS["Latitude",NORTH],AXIS["Longitude",EAST] so it expects (lat, lon)
        // But we have our points as (lon, lat), so we need to swap them for the transformation
        console.log(
          `Transforming point 1: swapping (${point1.lon}, ${point1.lat}) to (${point1.lat}, ${point1.lon})`
        );
        const pt1 = transform.transformPoint(point1.lat, point1.lon); // lat, lon order for EPSG:4326
        console.log(`Point 1 transformed to: (${pt1.x}, ${pt1.y})`);

        console.log(
          `Transforming point 2: swapping (${point2.lon}, ${point2.lat}) to (${point2.lat}, ${point2.lon})`
        );
        const pt2 = transform.transformPoint(point2.lat, point2.lon); // lat, lon order for EPSG:4326
        console.log(`Point 2 transformed to: (${pt2.x}, ${pt2.y})`);

        transformedPoint1 = { x: pt1.x, y: pt1.y };
        transformedPoint2 = { x: pt2.x, y: pt2.y };

        console.log(
          `Original points (lon, lat): (${point1.lon}, ${point1.lat}) -> (${point2.lon}, ${point2.lat})`
        );
        console.log(
          `Transformed points: (${transformedPoint1.x}, ${transformedPoint1.y}) -> (${transformedPoint2.x}, ${transformedPoint2.y})`
        );
      } catch (transformError) {
        console.error(
          "Error during coordinate transformation:",
          transformError
        );
        console.log("Input SRS WKT:", inputSRS.toWKT());
        console.log("DEM SRS WKT:", demCRS.toWKT());
        throw new Error(`Coordinate transformation failed: ${transformError}`);
      }
    } else {
      console.log("No coordinate transformation needed - CRS are the same");
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
    dataset.close();

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
