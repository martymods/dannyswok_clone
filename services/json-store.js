const fs = require('fs/promises');
const path = require('path');

async function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function readJsonFile(filePath, defaultValue = null) {
  try {
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      if (defaultValue !== null && defaultValue !== undefined) {
        await writeJsonFile(filePath, defaultValue);
        return defaultValue;
      }
      return null;
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await ensureDirectoryExists(filePath);
  await fs.writeFile(filePath, serialized, 'utf8');
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
