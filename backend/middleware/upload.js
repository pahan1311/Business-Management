/**
 * File Upload Middleware
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES, ALLOWED_FILE_TYPES } = require('../utils/constants');
const { generateUniqueFilename, sanitizeFilename, getFileExtension, isAllowedFileType } = require('../utils/helpers');
const config = require('../config/environment');

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    switch (file.fieldname) {
      case 'profileImage':
        uploadPath = path.join(__dirname, '../uploads/profiles');
        break;
      case 'productImages':
        uploadPath = path.join(__dirname, '../uploads/products');
        break;
      case 'inquiryAttachments':
        uploadPath = path.join(__dirname, '../uploads/inquiries');
        break;
      case 'qrcode':
        uploadPath = path.join(__dirname, '../uploads/qrcodes');
        break;
      default:
        uploadPath = path.join(__dirname, '../uploads/misc');
    }
    
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

/**
 * File filter
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedFileTypes;
  const fileExtension = getFileExtension(file.originalname);
  
  if (!isAllowedFileType(file.originalname, allowedTypes)) {
    return cb(new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    ), false);
  }

  // Additional MIME type validation
  const allowedMimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain'
  };

  const expectedMimeType = allowedMimeTypes[fileExtension];
  if (expectedMimeType && file.mimetype !== expectedMimeType) {
    return cb(new AppError(
      'File content does not match file extension',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    ), false);
  }

  cb(null, true);
};

/**
 * Base multer configuration
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 non-file fields
  },
  fileFilter: fileFilter,
});

/**
 * Single file upload
 */
const uploadSingle = (fieldName, destination = 'misc') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          return next(handleMulterError(error));
        }
        return next(error);
      }

      // Add file info to request
      if (req.file) {
        req.fileInfo = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype,
          destination: req.file.destination,
          url: `/uploads/${destination}/${req.file.filename}`,
        };
      }

      next();
    });
  };
};

/**
 * Multiple files upload
 */
const uploadMultiple = (fieldName, maxCount = 5, destination = 'misc') => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          return next(handleMulterError(error));
        }
        return next(error);
      }

      // Add files info to request
      if (req.files && req.files.length > 0) {
        req.filesInfo = req.files.map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          destination: file.destination,
          url: `/uploads/${destination}/${file.filename}`,
        }));
      }

      next();
    });
  };
};

/**
 * Upload multiple different fields
 */
const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          return next(handleMulterError(error));
        }
        return next(error);
      }

      // Process uploaded files
      if (req.files) {
        req.uploadedFiles = {};
        
        Object.keys(req.files).forEach(fieldname => {
          req.uploadedFiles[fieldname] = req.files[fieldname].map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            destination: file.destination,
            url: `/uploads/${getDestinationFromFieldname(fieldname)}/${file.filename}`,
          }));
        });
      }

      next();
    });
  };
};

/**
 * Handle Multer errors
 */
const handleMulterError = (error) => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError(
        `File too large. Maximum size: ${config.upload.maxFileSize / (1024 * 1024)}MB`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    case 'LIMIT_FILE_COUNT':
      return new AppError(
        'Too many files uploaded',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    case 'LIMIT_FIELD_COUNT':
      return new AppError(
        'Too many fields in request',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError(
        'Unexpected file field',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    default:
      return new AppError(
        'File upload error',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
  }
};

/**
 * Get destination folder from field name
 */
const getDestinationFromFieldname = (fieldname) => {
  const fieldMapping = {
    profileImage: 'profiles',
    productImages: 'products',
    inquiryAttachments: 'inquiries',
    qrcode: 'qrcodes',
  };
  
  return fieldMapping[fieldname] || 'misc';
};

/**
 * Delete uploaded file
 */
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error && error.code !== 'ENOENT') {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Validate image dimensions (requires sharp or similar)
 */
const validateImageDimensions = (minWidth = 100, minHeight = 100, maxWidth = 2000, maxHeight = 2000) => {
  return async (req, res, next) => {
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return next();
    }

    try {
      const sharp = require('sharp');
      const metadata = await sharp(req.file.path).metadata();

      if (metadata.width < minWidth || metadata.height < minHeight) {
        await deleteFile(req.file.path);
        return next(new AppError(
          `Image too small. Minimum dimensions: ${minWidth}x${minHeight}px`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        ));
      }

      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        await deleteFile(req.file.path);
        return next(new AppError(
          `Image too large. Maximum dimensions: ${maxWidth}x${maxHeight}px`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        ));
      }

      // Add image metadata to request
      req.imageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
      };

      next();
    } catch (error) {
      if (req.file) {
        await deleteFile(req.file.path);
      }
      return next(new AppError(
        'Invalid image file',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      ));
    }
  };
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  validateImageDimensions,
};
