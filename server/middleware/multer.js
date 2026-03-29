import multer from "multer";
import path from "path";

// Notes upload configuration
const notesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/notes/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Videos upload configuration
const videosStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/videos/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter for PDF files (notes)
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed for notes"), false);
  }
};

// Filter for video files
const videoFilter = (req, file, cb) => {
  const allowedMimes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed"), false);
  }
};

// Course thumbnail upload configuration
const courseThumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/course-thumbnails/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// User avatar upload configuration
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter for image files
const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, WebP)"), false);
  }
};

export const uploadNotes = multer({
  storage: notesStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export const uploadVideos = multer({
  storage: videosStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
});

// Material upload configuration (PDFs, images, docs)
const materialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/materials/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter for material files (PDF, images, docs, and videos)
const materialFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/mpeg"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, images, documents, and videos are allowed"), false);
  }
};

export const uploadCourseThumbnail = multer({
  storage: courseThumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit for profile avatar
});

export const uploadMaterial = multer({
  storage: materialStorage,
  fileFilter: materialFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for materials
});

export const upload = multer({
  storage: videosStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
});