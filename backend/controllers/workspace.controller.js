const dockerService = require('../services/docker.service');
const Map = require('../models/map.model');
const catchAsync = require('../utils/catchAsync');

exports.startWorkspace = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const mapping = await dockerService.spawnContainer(userId);
  res.status(200).json({
    message: 'Workspace started successfully',
    mapping
  });
});

exports.stopWorkspace = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const mapping = await Map.findOne({ userId });

  if (!mapping) {
    return res.status(404).json({ error: 'No workspace found for this user' });
  }

  const updated = await dockerService.stopContainer(mapping);
  res.status(200).json({
    message: 'Workspace stopped successfully',
    mapping: updated
  });
});

exports.getWorkspaceStatus = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const mapping = await Map.findOne({ userId });

  if (!mapping) {
    return res.status(200).json({ status: 'inactive', mapping: null });
  }

  res.status(200).json({
    status: mapping.status,
    mapping
  });
});
