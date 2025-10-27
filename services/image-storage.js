const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const mimeExtensionMap = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function resolveExtension(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') {
    return null;
  }
  const lower = mimeType.toLowerCase();
  return mimeExtensionMap[lower] || null;
}

async function saveBase64Image(base64Data, mimeType) {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('Image data is required');
  }
  const extension = resolveExtension(mimeType) || '.jpg';
  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (error) {
    throw new Error('Invalid image data');
  }
  if (!buffer || !buffer.length) {
    throw new Error('Invalid image data');
  }
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${filename}`;
}

async function deleteImage(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    return;
  }
  const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  if (!normalized.startsWith('uploads/')) {
    return;
  }
  const filePath = path.join(__dirname, '..', normalized);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  saveBase64Image,
  deleteImage,
};
