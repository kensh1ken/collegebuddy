const routes = require('express').Router();
const controller = require('../controllers/lostAndFound.controller');
const upload = require('../middleware/upload.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const validation = require('../validators/lostFound.validation');
const asyncHandler = require('../utils/asyncHandler');

routes.get('/', validate({ query: validation.list }), asyncHandler(controller.getAllPost));
routes.get('/my-posts', requireAuth, asyncHandler(controller.getMyPosts));
routes.post('/', requireAuth, upload.single('image'), validate({ body: validation.create }), asyncHandler(controller.createPost));
routes.get('/:id', requireAuth, validate({ params: validation.params }), asyncHandler(controller.getSinglePost));
routes.patch('/:id', requireAuth, validate({ params: validation.params, body: validation.update }), asyncHandler(controller.updatePost));
routes.put('/:id', requireAuth, validate({ params: validation.params, body: validation.update }), asyncHandler(controller.updatePost));
routes.delete('/:id', requireAuth, validate({ params: validation.params }), asyncHandler(controller.deletePost));

module.exports = routes;
