// Validate filename to prevent directory traversal attacks
function validateFilename(filename) {
  if (!filename || typeof filename !== "string") {
    return { valid: false, error: "filename must be a non-empty string" };
  }

  // Only allow alphanumeric, dots, hyphens, and underscores
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return { valid: false, error: "filename contains invalid characters" };
  }

  // Reject path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return { valid: false, error: "path traversal not allowed" };
  }

  // Limit filename length
  if (filename.length > 255) {
    return { valid: false, error: "filename too long" };
  }

  return { valid: true };
}

// Validate file upload
function validateFileUpload(file) {
  if (!file) {
    return { valid: false, error: "audio file is required" };
  }

  const maxSize = 30 * 1024 * 1024; // 30MB
  if (file.size > maxSize) {
    return { valid: false, error: `file exceeds maximum size of 30MB` };
  }

  // Check mime type
  const validMimes = [
    "audio/mpeg", "audio/mp3",
    "audio/wav", "audio/wave",
    "audio/ogg", "audio/webm",
    "audio/mp4", "audio/aac",
    "audio/flac"
  ];

  if (!validMimes.includes(file.mimetype)) {
    return { valid: false, error: `unsupported audio format: ${file.mimetype}` };
  }

  return { valid: true };
}

module.exports = {
  validateFilename,
  validateFileUpload
};
