const router = require('express').Router();
const controller = require('../controllers/course.controller');
const validation = require('../validators/course.validation');
const { validate } = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', requireAuth, validate({ query: validation.list }), asyncHandler(controller.list));
router.post('/', requireAuth, adminOnly, validate({ body: validation.create }), asyncHandler(controller.create));
router.patch('/:id', requireAuth, adminOnly, validate({ params: validation.params, body: validation.update }), asyncHandler(controller.update));
router.delete('/:id', requireAuth, adminOnly, validate({ params: validation.params }), asyncHandler(controller.remove));

module.exports = router;
