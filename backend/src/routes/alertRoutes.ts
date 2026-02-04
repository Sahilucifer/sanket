import express from 'express';
import { alertController } from '../controllers/alertController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Emergency alert endpoint (public - no auth required for emergency situations)
router.post('/emergency', alertController.sendEmergencyAlert);

// Message templates endpoint (public - for frontend to show options)
router.get('/templates', alertController.getMessageTemplates);

// Message validation endpoint (public - for frontend validation)
router.post('/validate-message', alertController.validateMessage);

// Alert logs endpoint (protected - requires authentication)
router.get('/logs/:vehicleId', authenticateToken, alertController.getAlertLogs);

// Alert statistics endpoint (protected - requires authentication)
router.get('/stats/:vehicleId', authenticateToken, alertController.getAlertStats);

// Webhook endpoints for emergency alerts (public)
router.post('/webhook/emergency-call', alertController.handleEmergencyCallWebhook);
router.post('/webhook/emergency-sms', alertController.handleEmergencySMSWebhook);

export default router;