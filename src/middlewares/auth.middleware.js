import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // 1. Extract the access token from cookies or Authorization header
        const token =
            req.cookies?.accessToken || // Browser based apps
            req.header("Authorization")?.replace("Bearer ", "");  // API clients, mobile apps

        if (!token) {
            throw new ApiError(401, "Unauthorized request: Access token is missing");
        }

        // 2. Verify the access token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 3. Find the user in the database (excluding sensitive fields)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid access token: User not found");
        }

        // 4. Attach the user object to req and proceed
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized request: Invalid access token");
    }
});