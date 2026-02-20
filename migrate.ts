import { config } from "dotenv";
config({ path: ".env" });

async function migrate() {
    try {
        const { connectDB } = await import("./lib/db");
        const mongoose = (await import("mongoose")).default;

        await connectDB();
        const db = mongoose.connection.db;
        if (!db) throw new Error("No db connection");

        console.log("Starting DB migration...");

        // Find prospects with weakness_score
        const collection = db.collection("prospects");

        // 1. Rename weakness_score -> rating_score, weakness_notes -> rating_notes
        const renameResult = await collection.updateMany(
            { weakness_score: { $exists: true } },
            { $rename: { "weakness_score": "rating_score", "weakness_notes": "rating_notes" } }
        );
        console.log(`Renamed fields for ${renameResult.modifiedCount} documents.`);

        // 2. Default missing rating_score to 1
        const defaultResult = await collection.updateMany(
            { rating_score: { $exists: false } },
            { $set: { rating_score: 1 } }
        );
        console.log(`Defaulted rating_score to 1 for ${defaultResult.modifiedCount} documents.`);

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
