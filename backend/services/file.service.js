const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const env = require('../config/env.config');

const getUserWorkspacePath = (userId) => {
  return path.join(env.volumeBasePath, userId.toString());
};

const resolveSafePath = (userId, relativePath = '') => {
  const workspaceRoot = getUserWorkspacePath(userId);
  const targetPath = path.normalize(path.join(workspaceRoot, relativePath));

  if (!targetPath.startsWith(workspaceRoot)) {
    throw new Error('Access denied: Out of workspace directory bounds');
  }

  return targetPath;
};

const getFileTree = async (userId, relativePath = '') => {
  const targetPath = resolveSafePath(userId, relativePath);

  if (!fsSync.existsSync(targetPath)) {
    await fs.mkdir(targetPath, { recursive: true });
  }

  const items = await fs.readdir(targetPath, { withFileTypes: true });

  const tree = await Promise.all(items.map(async (item) => {
    const itemRelativePath = path.join(relativePath, item.name);
    const itemFullPath = path.join(targetPath, item.name);

    if (item.isDirectory()) {
      return {
        name: item.name,
        path: itemRelativePath,
        type: 'directory',
        children: await getFileTree(userId, itemRelativePath)
      };
    } else {
      const stats = await fs.stat(itemFullPath);
      return {
        name: item.name,
        path: itemRelativePath,
        type: 'file',
        size: stats.size
      };
    }
  }));

  return tree;
};

const readFileContent = async (userId, relativePath) => {
  const targetPath = resolveSafePath(userId, relativePath);
  return await fs.readFile(targetPath, 'utf-8');
};

const writeFileContent = async (userId, relativePath, content) => {
  const targetPath = resolveSafePath(userId, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, 'utf-8');
};

const createEntry = async (userId, relativePath, type = 'file') => {
  const targetPath = resolveSafePath(userId, relativePath);
  if (type === 'directory') {
    await fs.mkdir(targetPath, { recursive: true });
  } else {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, '', 'utf-8');
  }
};

const deleteEntry = async (userId, relativePath) => {
  const targetPath = resolveSafePath(userId, relativePath);
  await fs.rm(targetPath, { recursive: true, force: true });
};

const renameEntry = async (userId, oldRelativePath, newRelativePath) => {
  const oldPath = resolveSafePath(userId, oldRelativePath);
  const newPath = resolveSafePath(userId, newRelativePath);
  await fs.rename(oldPath, newPath);
};

module.exports = {
  getFileTree,
  readFileContent,
  writeFileContent,
  createEntry,
  deleteEntry,
  renameEntry
};
