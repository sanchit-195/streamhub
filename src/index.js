import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
            app.listen(process.env.PORT || 8000, () => {
                console.log(`⚙️  Server is running on port ${process.env.PORT || 8000}`);
            });
        })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    })

/*import express from "express";

const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/{DB_NAME}`);
        console.log("Connected to MongoDB");
        app.on("error", (error) => {
            console.log("Error connecting to MongoDB", error);
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } 
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
})();
*/

