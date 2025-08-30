import express from 'express';
import { sendMessage,gotMessage } from '../controllers/messageController.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

router.route("/send/:id").post(isAuthenticated,sendMessage);
router.route("/:id").get(isAuthenticated,gotMessage);

export default router;