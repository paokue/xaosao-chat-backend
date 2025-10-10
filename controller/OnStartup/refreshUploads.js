const fs = require("fs"); // For createReadStream
const fsp = require("fs/promises"); // For promise-based file operations
const path = require("path");
const unzipper = require("unzipper");
const { Op } = require("sequelize");
const { sequelize } = require("../../models"); // Adjust the path to your Sequelize models

async function clearUploadsAndUnzipInitialUploadsFolder() {
  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  const backupZip = path.join(__dirname, "..", "..", "uploads_backup.zip");

  try {
    // Step 1: Delete contents of the uploads folder
    const files = await fsp.readdir(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = await fsp.lstat(filePath);

      if (stat.isDirectory()) {
        await fsp.rm(filePath, { recursive: true, force: true });
      } else {
        await fsp.unlink(filePath);
      }
    }
    console.log("Uploads folder cleared.");

    // Step 2: Unzip uploads_backup.zip into uploads folder
    await fsp.access(backupZip); // Ensure the ZIP file exists
    const zipStream = fs
      .createReadStream(backupZip)
      .pipe(unzipper.Extract({ path: uploadsDir }));

    await new Promise((resolve, reject) => {
      zipStream.on("close", resolve);
      zipStream.on("error", reject);
    });

    console.log("Backup successfully extracted to uploads folder.");
  } catch (error) {
    console.error("An error occurred:", error);
    throw error; // Re-throw to let the caller handle it if necessary
  }
}

async function clearDataAfterTime(specificTime) {
  try {
    // Convert the specified time to a Date object
    const date = new Date(specificTime);

    // List all models dynamically from your Sequelize instance
    const models = Object.keys(sequelize.models);

    // List of models to exclude
    const excludedModels = [
      "Language_status",
      "Language_setting",
      "PrivacyPolicy",
      "TNC",
      "Visiter",
      "User",
      "One_signal_setting",
      "App_Flow",
      "App_Setting",
      "Avatars",
      "GoogleMap_setting",
      "Group_Setting",
      "Wallpaper",
      "Website_Setting",
      "AllContact",
    ];

    for (const modelName of models) {
      // Skip excluded models
      if (excludedModels.includes(modelName)) {
        console.log(`Skipped table: ${modelName}`);
        continue;
      }

      const model = sequelize.models[modelName];

      // Check if the model has a `createdAt` column
      if (model.rawAttributes.createdAt) {
        const deletedCount = await model.destroy({
          where: {
            createdAt: {
              [Op.gt]: date, // Clear records with createdAt greater than the specified time
            },
          },
        });
        console.log(`Cleared ${deletedCount} records from table: ${modelName}`);
      } else {
        console.log(`Skipped table: ${modelName}, no createdAt column.`);
      }
    }

    console.log("Data clearing operation completed.");
  } catch (error) {
    console.error("An error occurred while clearing data:", error);
    throw error; // Re-throw for further handling if needed
  }
}

async function clearFilesAfterTime(
  specificTime = "2024-01-01T00:00:00Z",
  directoryPath = path.join(__dirname, "..", "..", "uploads")
) {
  try {
    // Convert the specified time to a Date object
    const date = new Date(specificTime);

    // Helper function to recursively delete files
    async function removeFiles(dir) {
      const items = await fsp.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Recursively process subdirectories
          await removeFiles(itemPath);
        } else {
          // Check the file's modification time and delete if it meets the condition
          const stats = await fsp.stat(itemPath);
          if (stats.mtime > date) {
            await fsp.unlink(itemPath);
            console.log(`Deleted file: ${itemPath}`);
          }
        }
      }
    }

    // Start processing the directory
    await removeFiles(directoryPath);
    console.log("File removal operation completed.");
  } catch (error) {
    console.error("An error occurred while removing files:", error);
    throw error; // Re-throw for further handling if needed
  }
}

module.exports = {
  clearUploadsAndUnzipInitialUploadsFolder,
  clearDataAfterTime,
  clearFilesAfterTime,
};
