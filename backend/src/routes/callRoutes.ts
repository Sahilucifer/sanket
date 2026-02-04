import express from 'express';
import { callController } from '../controllers/callController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Call initiation endpoint (public - no auth required for callers)
router.post('/initiate', callController.initiateCall);

// Call webhook endpoints for external services
router.post('/webhook/exotel', callController.handleExotelWebhook);
router.post('/webhook/twilio', callController.handleTwilioWebhook);

// TwiML endpoint for Twilio (public)
router.post('/twilio/twiml', callController.generateTwiML);

// Protected endpoints for call logs (require authentication)
router.get('/logs/:vehicleId', authenticateToken, callController.getCallLogs);

export default router;