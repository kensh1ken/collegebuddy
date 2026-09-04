const routes = require('express').Router();
const controller = require('../controllers/supabase.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const uploadResource = require('../middleware/resourceUpload.middleware');
const { validate } = require('../middleware/validate.middleware');
const validation = require('../validators/resource.validation');
const asyncHandler = require('../utils/asyncHandler');

routes.use(requireAuth);
routes.post('/', uploadResource.single('file'), validate({ body: validation.create }), asyncHandler(controller.createResource));
routes.get('/', validate({ query: validation.list }), asyncHandler(controller.getAllResources));
routes.get('/:id/download', validate({ params: validation.params }), asyncHandler(controller.downloadResource));
routes.get('/:id', validate({ params: validation.params }), asyncHandler(controller.getSingleResource));
routes.patch('/:id', validate({ params: validation.params, body: validation.update }), asyncHandler(controller.updateResource));
routes.delete('/:id', validate({ params: validation.params }), asyncHandler(controller.deleteResource));
routes.patch('/:id/moderate', adminOnly, validate({ params: validation.params, body: validation.moderate }), asyncHandler(controller.moderateResource));

module.exports = routes;
