# Backend Utilities & Middleware Documentation

This project contains reusable utilities, middleware, and configuration modules that form the backbone of an Express.js REST API.

The following components are documented:
- **Utilities** – `ApiError`, `ApiResponse`, `asyncHandler`, Cloudinary upload
- **Middleware** – Authentication (`auth.middleware.js`), File upload (`multer.middleware.js`)
- **Database** – MongoDB connection (`db/index.js`)

---

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Utilities](#utilities)
   - [asyncHandler](#asynchandler)
   - [ApiError](#apierror)
   - [ApiResponse](#apiresponse)
   - [Cloudinary Upload](#cloudinary-upload)
3. [Middleware](#middleware)
   - [Multer Middleware](#multer-middleware)
   - [Authentication Middleware](#authentication-middleware)
4. [Database Connection](#database-connection)
5. [Putting It All Together – Request Lifecycle](#putting-it-all-together--request-lifecycle)
6. [Environment Variables](#environment-variables)
7. [Project Structure](#project-structure)

---

## Core Concepts

### Request–Response Cycle in Express
Every HTTP request goes through a pipeline of middleware functions.
Each function receives `req` (request data), `res` (response tools), and `next` (pass control to the next middleware).
The cycle ends when a response is sent (`res.json()`, `res.send()`, etc.).

### Middleware
Middleware can:
- Modify `req` or `res`
- End the cycle (send a response)
- Pass control with `next()`

Error-handling middleware is invoked when `next(error)` is called.

### JWT & Cookies
- **JWT** (JSON Web Token) – a compact, self-contained token used for stateless authentication. It contains a header, payload, and signature.
- **Cookies** – small data stored in the browser, automatically sent with every request to the server.
  - `httpOnly` cookies are not accessible via JavaScript → protection against XSS.
  - `secure` cookies are only sent over HTTPS.
  - Common pattern: store the JWT in an httpOnly cookie and optionally return it in the response body for mobile clients.

---

## Utilities

### asyncHandler
A higher-order function that wraps async route handlers.
It catches rejected promises (or thrown errors) and forwards them to Express's error-handling middleware via `next(error)`.

**Code:**
```js
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
};
```

**Why?**
Without it, an unhandled promise rejection in an async route would crash the server or leave the client hanging. Using `asyncHandler` eliminates repetitive try/catch blocks.

**Usage:**
```js
router.get('/data', asyncHandler(async (req, res) => {
    const data = await someAsyncOperation();
    res.json(data);
}));
```

---

### ApiError
A custom error class extending native `Error`.
It enriches errors with HTTP status codes and detailed error messages, allowing centralized error handling.

**Code:**
```js
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        error = [],
        stack = ""
    ) {
        super(message);
        this.data = null;
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.stack = stack;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
```

**Properties:**

| Property | Description |
|---|---|
| `statusCode` | HTTP status (e.g., 400, 404, 500) |
| `message` | Human-readable description |
| `error` | Array or object containing additional details (e.g., validation errors) |
| `data` | Always `null` for errors (keeps response shape consistent) |

**Usage:**
```js
throw new ApiError(404, "User not found");
throw new ApiError(400, "Validation failed", ["Name is required"]);
```

**With Error Middleware:**
```js
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.error,
            data: null
        });
    }
    // fallback for unexpected errors
    res.status(500).json({ success: false, message: "Internal Server Error" });
});
```

---

### ApiResponse
A standardised response wrapper for successful requests.
Ensures a consistent JSON structure across all endpoints.

**Code:**
```js
class ApiResponse {
    constructor(statusCode, message = "Success", data, res) {
        this.res = res;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
}
```

**Properties:**

| Property | Description |
|---|---|
| `statusCode` | HTTP status (e.g., 200, 201) |
| `message` | Success message |
| `data` | Payload (object, array, etc.) |
| `success` | Automatically `true` for status codes < 400 |

**Usage:**
```js
res.status(200).json(new ApiResponse(200, "User fetched", user));
// Output: { success: true, message: "User fetched", data: { ... } }
```

---

### Cloudinary Upload
A utility to upload files to Cloudinary and clean up local temporary files.

**Code:**
```js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        fs.unlinkSync(localFilePath); // delete local file after successful upload
        return response;
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // clean up on failure
        }
        console.error("Cloudinary upload error:", error);
        return null;
    }
};
```

**Flow:**
1. Receives a local file path (e.g., from multer).
2. Uploads to Cloudinary, automatically detecting file type (`resource_type: "auto"`).
3. On success, deletes the local file and returns the Cloudinary response (URL, public ID, etc.).
4. On failure, deletes the local file if it exists and returns `null`.

**Usage:**
```js
const result = await uploadOnCloudinary(req.file.path);
if (!result) throw new ApiError(500, "File upload failed");
```

---

## Middleware

### Multer Middleware
Handles `multipart/form-data` file uploads.
Configures where and how files are stored temporarily before processing (e.g., uploading to Cloudinary).

**Code:**
```js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({ storage });
```

**Key points:**
- Files are saved to `./public/temp` with a unique name to prevent collisions.
- `cb` is a callback following the error-first pattern (`cb(error, result)`).
- The exported `upload` object is used as middleware: `upload.single('file')`, `upload.array('photos', 5)`, etc.

**Usage in route:**
```js
router.post('/upload', upload.single('avatar'), asyncHandler(async (req, res) => {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    res.json(new ApiResponse(200, "File uploaded", cloudinaryResponse));
}));
```

---

### Authentication Middleware
Verifies the JWT access token sent via cookies or the Authorization header.
Attaches the decoded user payload to `req.user` if valid.

**Code (example structure):**
```js
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    // Try to get token from cookies or Authorization header
    const token = req.cookies?.accessToken || 
                  req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Access denied. No token provided.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;   // attach user info (id, role, etc.)
        next();
    } catch (error) {
        throw new ApiError(403, "Invalid or expired token.");
    }
});
```

**How it works:**
1. Looks for the access token in:
   - `req.cookies.accessToken` (if using `cookie-parser`)
   - `Authorization: Bearer <token>` header
2. If missing → throws `ApiError(401)`.
3. Verifies token with the secret → if invalid/expired, throws `ApiError(403)`.
4. Decodes the payload and attaches it to `req.user`.
5. Calls `next()` to proceed to the actual route handler.

**Protected route example:**
```js
router.get('/profile', verifyJWT, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json(new ApiResponse(200, "Profile fetched", user));
}));
```

---

## Database Connection
A simple, reusable module to connect to MongoDB using Mongoose.

**Code (`db/index.js`):**
```js
import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`
        );
        console.log(
            "MongoDB connected successfully! Host:",
            connectionInstance.connection.host
        );
    } catch (error) {
        console.log("MongoDB connection error:", error);
        process.exit(1);   // Exit the process on connection failure
    }
};

export default connectDB;
```

**Key points:**
- Uses environment variables for the connection URI and database name.
- On failure, logs the error and exits the application (status code 1) because a working database is essential.
- Called early in the server startup: `connectDB().then(() => app.listen(PORT, ...))`.

---

## Putting It All Together – Request Lifecycle
A typical login flow illustrates how all these components work together:

```js
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, "Email and password required");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = generateTokens(user._id);

    const options = { httpOnly: true, secure: true };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "Login successful", {
            user: { id: user._id, email: user.email },
            accessToken,
            refreshToken
        }));
}));
```

**What happens:**
1. `asyncHandler` wraps the async function.
2. Input validation throws `ApiError` on failure.
3. Database operations using Mongoose.
4. JWT tokens generated and sent in secure cookies + response body.
5. Successful response uses `ApiResponse`.
6. Error middleware catches any `ApiError` thrown (or any unexpected error) and returns a consistent JSON error.

---

## Environment Variables
Create a `.env` file with:

```text
PORT=8000
MONGODB_URL=mongodb://localhost:27017
DB_NAME=myapp
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_very_strong_secret
```

---

## Project Structure (relevant part)
```text
├── src/
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cloudinary.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   └── db/
│       └── index.js
```