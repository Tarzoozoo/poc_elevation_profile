# poc_elevation_profile

This project provides a REST API for calculating an elevation profile along a line between two geographic points based on a DEM (Digital Elevation Model) GeoTIFF file.
It uses Node.js + Express with gdal-async to read elevation data.

## Features

- Reads DSM data from GeoTIFF files
- Generates elevation profiles from coordinate points
- Exports elevation data to CSV format
- Creates elevation profile visualizations

## Project Structure

```
├── dsm.tif                     # Digital Surface Model data
├── elevation_profile.csv       # Generated elevation data
├── elevation_profile_from_csv.png  # Visualization output
├── plot.py                     # Python plotting script
├── src/
│   ├── height_profile.service.ts   # Core elevation service
│   ├── server.ts                   # Server implementation
│   └── dto/                        # Data transfer objects
│       └── elevation.dto.ts        # Elevation data structures
└── test/                      # Test files
```

## Setup

1. Install dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm run dev
```

## API endpoint

```bash
curl --location 'http://localhost:3000/elevation-profile' \
--header 'Content-Type: application/json' \
--data '{
  "demName": "dsm",
  "startPoint": { "x": 12.9949254, "y": 101.4433517 },
  "endPoint": { "x": 12.9939417, "y": 101.4439043 },
  "numSample": 10
}'
```

**Success case**

```bash
{
  "status": "200",
  "message": "Elevation profile calculated successfully",
  "result": [
    [0.0, 25.1],
    [1.2, 25.3],
    ...
  ]
}

```

## Testing (For Debug)

Run the test suite:

```bash
npm run test
```

## Visualize the elevation profile

Run the python script:

```bash
python3 plot.py
```

## Technology Stack

- TypeScript
- Node.js
- Python (for visualization)
- GeoTIFF processing
