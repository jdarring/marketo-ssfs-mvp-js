# Marketo Calculate Formula SSFS

## Overview
A Marketo Self-Service Flow Step (SSFS) service that provides Excel-like formula calculations. Built with Node.js using the `hot-formula-parser` library.

## Project Architecture
- `server.js` - Main HTTP server handling all API endpoints
- `serviceDefinition.jsonc` - Marketo service definition metadata
- `install.jsonc` - OpenAPI specification for the service

## API Endpoints
- `GET /status` - Health check
- `GET /install` - Returns OpenAPI spec with dynamic server URL
- `GET /getServiceDefinition` - Returns service definition metadata
- `POST /getPicklist` - Returns format choices (Text String, Numeric Value)
- `POST /submitAsyncAction` - Main calculation endpoint (async, sends callback)

## Environment Variables
- `PORT` - Server port (default: 5000)
- `API_KEY` - Optional API key for securing POST endpoints

## Running
```bash
node server.js
```

## Recent Changes
- 2026-02-24: Initial Replit setup, port changed to 5000, bound to 0.0.0.0
