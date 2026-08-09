const fileService = require('../services/file.service');
const catchAsync = require('../utils/catchAsync');

exports.getFileTree = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const tree = await fileService.getFileTree(userId);
  res.status(200).json({ tree });
});

exports.readFile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filePath = req.query.path || '';
  const content = await fileService.readFileContent(userId, filePath);
  res.status(200).json({ path: filePath, content });
});

exports.writeFile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { path: filePath, content } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  await fileService.writeFileContent(userId, filePath, content ?? '');
  res.status(200).json({ message: 'File saved successfully' });
});

exports.createEntry = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { path: filePath, type } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }

  await fileService.createEntry(userId, filePath, type || 'file');
  res.status(201).json({ message: 'Created successfully' });
});

exports.deleteEntry = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filePath = req.query.path || req.body.path;

  if (!filePath) {
    return res.status(400).json({ error: 'Path is required' });
  }

  await fileService.deleteEntry(userId, filePath);
  res.status(200).json({ message: 'Deleted successfully' });
});

exports.renameEntry = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { oldPath, newPath } = req.body;

  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'Both oldPath and newPath are required' });
  }

  await fileService.renameEntry(userId, oldPath, newPath);
  res.status(200).json({ message: 'Renamed successfully' });
});
