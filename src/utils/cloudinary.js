import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET 

});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null; // Return null if no file path is provided

        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })

        // File uploaded successfully
        console.log("File uploaded to Cloudinary:", response);
        fs.unlinkSync(localFilePath); // Delete the local file after successful upload
        return response;

    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        console.error("Error uploading to Cloudinary:", error);
        return null; // Return null in case of an error
    }
};

export { uploadOnCloudinary };