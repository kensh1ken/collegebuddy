const routes = require('express').Router();
const controller = require('../controllers/event.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const validation = require('../validators/event.validation');
const asyncHandler = require('../utils/asyncHandler');

routes.get('/', validate({ query: validation.list }), asyncHandler(controller.getEvents));
routes.get('/:id', validate({ params: validation.params }), asyncHandler(controller.getEvent));
routes.post('/', requireAuth, adminOnly, validate({ body: validation.create }), asyncHandler(controller.createEvent));
routes.patch('/:id', requireAuth, adminOnly, validate({ params: validation.params, body: validation.update }), asyncHandler(controller.updateEvent));
routes.delete('/:id', requireAuth, adminOnly, validate({ params: validation.params }), asyncHandler(controller.deleteEvent));

module.exports = routes;
