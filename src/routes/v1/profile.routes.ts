import { Router } from 'express';
import { profileController } from '../../controllers/profile.controller';
import adminController from '../../controllers/admin.controller';
import { protect } from '../../middleware/auth.middleware';
import authorizeRoles from '../../middleware/role.middleware';
import { strictLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get current user profile
 *     description: Retrieve the profile of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// User profile
router.get('/', profileController.getMe);

/**
 * @openapi
 * /api/profile:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: newusername
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/', profileController.updateMe);

/**
 * @openapi
 * /api/profile/users:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all users in the system. Optionally filter by active status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter users by active status ("true" for active, "false" for inactive)
 *         example: true
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid query parameter
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Admin only routes with strict rate limiting
router.get('/users', authorizeRoles('admin'), profileController.listUsers);

/**
 * @openapi
 * /api/profile/admin/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system statistics (Admin only)
 *     description: Retrieve total users, total quizzes, active users today, attempts and completion rate. Admin access only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalQuizzes:
 *                           type: integer
 *                         activeToday:
 *                           type: integer
 *                         totalAttempts:
 *                           type: integer
 *                         submittedAttempts:
 *                           type: integer
 *                         completionRate:
 *                           type: number
 */
router.get('/admin/stats', authorizeRoles('admin'), adminController.getSystemStats);

/**
 * @openapi
 * /api/profile/user/{userId}/roles:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update user role (Admin only)
 *     description: Update a user's role. Requires admin privileges. Rate limited to 10 requests per hour.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, creator, admin]
 *                 example: creator
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role or user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 400
 *               message: Invalid role specified
 *               error:
 *                 code: BAD_REQUEST
 *                 details:
 *                   provided: superuser
 *                   allowedRoles: [user, creator, admin]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 *       429:
 *         description: 'Too many requests (rate limit: 10 per hour)'
 */
router.put('/user/:userId/roles', strictLimiter, authorizeRoles('admin'), profileController.updateUserRoles);

/**
 * @openapi
 * /api/profile/user/{userId}/status:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Activate or deactivate user (Admin only)
 *     description: Update a user's active status. Requires admin privileges. Rate limited to 10 requests per hour.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: Set to true to activate user, false to deactivate
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 400
 *               message: isActive field is required and must be a boolean
 *               error:
 *                 code: BAD_REQUEST
 *                 details:
 *                   expected: 'boolean (true or false)'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 *       429:
 *         description: 'Too many requests - rate limit 10 per hour'
 */
router.put('/user/:userId/status', strictLimiter, authorizeRoles('admin'), profileController.toggleUserStatus);

/**
 * @openapi
 * /api/profile/request-creator-role:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Request creator role
 *     description: Submit a request to become a creator. Admins will be notified via email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: I want to create educational quizzes for my students
 *                 description: Reason for requesting creator role (optional)
 *     responses:
 *       200:
 *         description: Request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         requestedRole:
 *                           type: string
 *                         reason:
 *                           type: string
 *                         status:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *       400:
 *         description: Bad request (e.g., already has creator role or pending request)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/request-creator-role', profileController.requestCreatorRole);

/**
 * @openapi
 * /api/profile/admin/role-requests:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all role requests (Admin only)
 *     description: Retrieve all role requests with optional status filter and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by request status
 *         example: pending
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page (max 100)
 *         example: 50
 *     responses:
 *       200:
 *         description: Role requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         requests:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               userId:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   username:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                               requestedRole:
 *                                 type: string
 *                               reason:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                               reviewedBy:
 *                                 type: object
 *                               reviewedAt:
 *                                 type: string
 *                               reviewNotes:
 *                                 type: string
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *       400:
 *         description: Invalid status parameter
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/role-requests', authorizeRoles('admin'), adminController.getRoleRequests);

/**
 * @openapi
 * /api/profile/admin/role-requests/{requestId}/approve:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Approve a role request (Admin only)
 *     description: Approve a pending role request and grant the user creator role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 example: Approved based on qualifications
 *     responses:
 *       200:
 *         description: Request approved successfully
 *       400:
 *         description: Request already processed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Request not found
 */
router.post('/admin/role-requests/:requestId/approve', strictLimiter, authorizeRoles('admin'), adminController.approveRoleRequest);

/**
 * @openapi
 * /api/profile/admin/role-requests/{requestId}/reject:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Reject a role request (Admin only)
 *     description: Reject a pending role request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 example: Insufficient qualifications at this time
 *     responses:
 *       200:
 *         description: Request rejected successfully
 *       400:
 *         description: Request already processed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Request not found
 */
router.post('/admin/role-requests/:requestId/reject', strictLimiter, authorizeRoles('admin'), adminController.rejectRoleRequest);

export { router as profileRoutes };
    