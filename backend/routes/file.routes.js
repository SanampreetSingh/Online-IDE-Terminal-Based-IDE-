const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const requireAuth = require('../middlewares/requireAuth');

router.use(requireAuth);

router.get('/tree', fileController.getFileTree);
router.get('/read', fileController.readFile);
router.post('/write', fileController.writeFile);
router.post('/create', fileController.createEntry);
router.delete('/delete', fileController.deleteEntry);
router.put('/rename', fileController.renameEntry);

module.exports = router;
