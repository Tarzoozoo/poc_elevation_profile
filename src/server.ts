import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const {
  PointDto,
  CalHeightRequestDto,
  CalHeightResponseDto,
} = require("./dto/elevation.dto");
const { getElevationProfile } = require("./height_profile.service");

const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.get("/health", (req, res) => {
  const response =
    '{"status":"UP","message":"Elevation Profile API is running"}';
  res.json(response);
});

app.post("/elevation-profile", async (req, res) => {
  try {
    console.log("Received elevation profile request");
    const requestDto = req.body;

    // Resolve the file path relative to the project root
    const filePath = path.resolve(
      __dirname,
      "../",
      `${requestDto.demName}.tif`
    );

    // Check if the .tif file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    console.log(`Processing elevation profile request:
        DEM Path: ${filePath}
        Point 1: (${requestDto.startPoint.x}, ${requestDto.startPoint.y})
        Point 2: (${requestDto.endPoint.x}, ${requestDto.endPoint.y})
        Samples: ${requestDto.numSample}
        Input CRS: ${requestDto.coordinateCode}\n`);

    const elevationProfile = await getElevationProfile(
      filePath,
      requestDto.startPoint,
      requestDto.endPoint,
      requestDto.numSample,
      requestDto.coordinateCode
    );

    // Create success response using DTO
    const responseDto = new CalHeightResponseDto(
      "200",
      "Elevation profile calculated successfully",
      elevationProfile
    );

    res.json(responseDto);
  } catch (error) {
    const errresponseDto = new CalHeightResponseDto(
      "500",
      `"Elevation profile calculated error": ${error}`,
      []
    );

    const statusCode = 500;

    res.status(statusCode).json(errresponseDto);
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
