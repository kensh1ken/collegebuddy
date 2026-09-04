const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const resourceController = require('../controllers/supabase.controller');
const lostFoundController = require('../controllers/lostAndFound.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const adminValidation = require('../validators/admin.validation');
const resourceValidation = require('../validators/resource.validation');
const lostFoundValidation = require('../validators/lostFound.validation');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, adminOnly);
router.get('/users', validate({ query: adminValidation.users }), asyncHandler(adminController.getAllUsers));
router.get('/users/:id', validate({ params: adminValidation.params }), asyncHandler(adminController.getUser));
router.patch('/users/:id/block', validate({ params: adminValidation.params }), asyncHandler(adminController.blockUser));
router.patch('/users/:id/unblock', validate({ params: adminValidation.params }), asyncHandler(adminController.unBlockUser));
router.get('/resources', validate({ query: resourceValidation.list }), asyncHandler(resourceController.getAllResources));
router.patch('/resources/:id/moderate', validate({ params: resourceValidation.params, body: resourceValidation.moderate }), asyncHandler(resourceController.moderateResource));
router.delete('/resources/:id', validate({ params: resourceValidation.params }), asyncHandler(resourceController.deleteResource));
router.delete('/lost-found/:id', validate({ params: lostFoundValidation.params }), asyncHandler(lostFoundController.deletePost));

module.exports = router;
