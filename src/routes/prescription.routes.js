import { Router } from "express";
import multer from "multer";

import cloudinary from "../config/cloudinary.js";
import { analyzePrescription } from "../services/gemini.service.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported image format"));
    }

    cb(null, true);
  },
});

router.post("/scan", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    console.log("Starting prescription analysis...");

    // 1. Analyze image with Gemini
    const prescription = await analyzePrescription(
      req.file.buffer,
      req.file.mimetype,
    );

    // 2. Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "prescriptions",
        resource_type: "image",
      },
    );

    // 3. Return response
    return res.status(200).json({
      ...prescription,
      image: uploadResult.secure_url,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
