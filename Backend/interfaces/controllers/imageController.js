const path = require("path");
const fs = require("fs");
const imageService = require("../../application/services/imageService");
const appConfig = require("../../config/app");

const imageController = {
  uploadImg: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).send("No files uploaded.");
      }

      const savedImages = [];

      for (const file of req.files) {
        const filename = file.filename;
        const apiUrl = `${appConfig.apiBaseUrl}/api/images/${filename}`;

        const imageData = {
          imageurl: apiUrl,
          productId: req.body.productId || null,
        };

        const savedImage = await imageService.saveImage(imageData);
        savedImages.push({
          id: savedImage.id,
          filename: filename,
          url: apiUrl,
        });
      }

      res.status(201).json({
        message: "Files uploaded successfully",
        data: {
          files: savedImages,
        },
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  },

  getImageById: async (req, res) => {
    try {
      const imageName = req.params.imageName;

      const imagePath = path.join(process.cwd(), "public", "imgs", imageName);

      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ message: "Image file not found" });
      }

      return res.sendFile(imageName, {
        root: path.join(process.cwd(), "public", "imgs"),
      });
    } catch (error) {
      console.error("Error retrieving image:", error);
      res.status(500).json({ message: "Failed to retrieve image" });
    }
  },
};

module.exports = imageController;
