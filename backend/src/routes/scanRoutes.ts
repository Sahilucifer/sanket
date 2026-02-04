import { Router } from 'express';
import * as scanController from '../controllers/scanController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public scan endpoint - no authentication required
router.get('/:vehicleId', scanController.getVehicleForScan);

// Protected endpoints for scan logs - require authentication
router.get('/logs/:vehicleId', authenticateToken, scanController.getScanLogs);
router.get('/logs', authenticateToken, scanController.getScanLogsWithFilters);
router.get('/stats/:vehicleId', authenticateToken, scanController.getVehicleScanStats);

export default router;