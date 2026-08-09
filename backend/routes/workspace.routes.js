const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const requireAuth = require('../middlewares/requireAuth');

router.use(requireAuth);

router.post('/start', workspaceController.startWorkspace);
router.post('/stop', workspaceController.stopWorkspace);
router.get('/status', workspaceController.getWorkspaceStatus);

module.exports = router;
