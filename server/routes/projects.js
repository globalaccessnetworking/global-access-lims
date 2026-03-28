const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth } = require('../middleware/auth');
const { checkProjectAccess } = require('../middleware/projectAccess');

router.get('/', auth, projectController.getProjects);
router.post('/', auth, projectController.createProject);
router.get('/:id', auth, projectController.getProjectDetails);
router.put('/:id', auth, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);

// Member management routes
router.get('/:projectId/members', auth, checkProjectAccess('viewer'), projectController.getProjectMembers);
router.post('/:projectId/members', auth, checkProjectAccess('owner'), projectController.addProjectMember);
router.delete('/:projectId/members/:userId', auth, checkProjectAccess('owner'), projectController.removeProjectMember);
router.put('/:projectId/members/:userId/role', auth, checkProjectAccess('owner'), projectController.updateMemberRole);

module.exports = router;

