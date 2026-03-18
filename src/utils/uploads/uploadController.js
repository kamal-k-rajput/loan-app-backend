import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Validate required environment variables
if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_S3_BUCKET
) {
  throw new Error("Missing required AWS environment variables");
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 5MB

// Generate a random filename
function generateRandomFilename() {
  return crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 32);
}

// Helper to delete old profile image
async function deleteOldProfileImage(key) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    console.log(`Successfully deleted old profile image: ${key}`);
  } catch (error) {
    console.error("Error deleting old profile image:", error);
  }
}

const getSignedUrl = async (req, res) => {
  try {
    const { fileType, serviceType } = req.body;
    req.user._id = req?.user?.id;

    // Validate user ID
    if (!req.user || !req.user._id) {
      return res.fail(401, "User not authenticated properly");
    }

    // Validate input
    if (!fileType || !serviceType) {
      return res.fail(400, "File type and service type are required");
    }

    // Validate file type (allow images and videos)
    if (!(fileType.startsWith("image/") || fileType.startsWith("video/"))|| fileType.startsWith("application/pdf")) {
      console.log("Invalid file type:", fileType);
      return res.fail(400, "Only image and video files are allowed");
    }

    // Set max file size limits
    const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    const VIDEO_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
    const PDF_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    const MAX_FILE_SIZE = fileType.startsWith("video/")
      ? VIDEO_MAX_FILE_SIZE
      : fileType.startsWith("application/pdf")
      ? PDF_MAX_FILE_SIZE
      : IMAGE_MAX_FILE_SIZE;

    // Generate unique file name
    const fileExtension = fileType.split("/")[1];
    const randomName = generateRandomFilename();
    const userId = req.user._id.toString();
    const fileName = `uploads/${serviceType}/${userId}/${randomName}.${fileExtension}`;
    console.log("Generated file name:", fileName);

    try {
      // Create presigned URL (CORS friendly)
      const presignedPost = await createPresignedPost(s3Client, {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Fields: {
          "Content-Type": fileType,
          success_action_status: "201",
        },
        Conditions: [
          ["content-length-range", 0, MAX_FILE_SIZE],
          ["starts-with", "$Content-Type", ""], // allow both image/* and video/*
          ["eq", "$success_action_status", "201"],
        ],
        Expires: 300, // URL expires in 5 minutes
      });

      // If updating profile image, delete old one
      if (serviceType === "profile" && req.user.profileImage) {
        const oldKey = new URL(req.user.profileImage).pathname.slice(1);
        console.log("Deleting old profile image:", oldKey);
        await deleteOldProfileImage(oldKey);
      }

      // Construct the final file URL
      const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      const result = {
        ...presignedPost,
        fileUrl,
      };

      return res.success(result, "Presigned URL generated successfully");
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      return res.fail(500, "Failed to generate upload URL");
    }
  } catch (error) {
    console.error("Upload controller error:", error);
    return res.fail(500, "Internal server error");
  }
};

export {getSignedUrl};