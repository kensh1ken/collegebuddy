const express = require('express')
const { Router } = express;
const router = Router();
const userController = require('../controllers/user.controller')
const { requireAuth } = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { completeProfile } = require('../validators/auth.validation')
const asyncHandler = require('../utils/asyncHandler')
router.put("/complete-profile" , requireAuth, validate({ body: completeProfile }), asyncHandler(userController.user_profile))
router.get(
    "/me",
    requireAuth,
    asyncHandler(userController.getCurrentUser)
);
module.exports = router;
