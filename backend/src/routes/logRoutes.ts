import { Router } from 'express';
import { logController } from '../controllers/logController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all log routes
router.use(authenticateToken);

/**
 * @route GET /api/logs/calls
 * @desc Get call logs with filtering and pagination
 * @access Private
 * @query vehicleId - Filter by vehicle ID
 * @query status - Filter by call status
 * @query startDate - Filter by start date (ISO string)
 * @query endDate - Filter by end date (ISO string)
 * @query limit - Number of records to return (default: 50)
 * @query offset - Number of records to skip (default: 0)
 */
router.get('/calls', logController.getCallLogs.bind(logController));

/**
 * @route GET /api/logs/alerts
 * @desc Get alert logs with filtering and pagination
 * @access Private
 * @query vehicleId - Filter by vehicle ID
 * @query status - Filter by alert status
 * @query startDate - Filter by start date (ISO string)
 * @query endDate - Filter by end date (ISO string)
 * @query limit - Number of records to return (default: 50)
 * @query offset - Number of records to skip (default: 0)
 */
router.get('/alerts', logController.getAlertLogs.bind(logController));

/**
 * @route GET /api/logs/scans
 * @desc Get scan logs with filtering and pagination
 * @access Private
 * @query vehicleId - Filter by vehicle ID
 * @query startDate - Filter by start date (ISO string)
 * @query endDate - Filter by end date (ISO string)
 * @query limit - Number of records to return (default: 50)
 * @query offset - Number of records to skip (default: 0)
 */
router.get('/scans', logController.getScanLogs.bind(logController));

/**
 * @route GET /api/logs/vehicle/:vehicleId
 * @desc Get comprehensive logs for a specific vehicle
 * @access Private
 * @param vehicleId - Vehicle ID
 * @query startDate - Filter by start date (ISO string)
 * @query endDate - Filter by end date (ISO string)
 * @query limit - Number of records to return (default: 50)
 * @query offset - Number of records to skip (default: 0)
 */
router.get('/vehicle/:vehicleId', logController.getVehicleLogs.bind(logController));

/**
 * @route GET /api/logs/stats
 * @desc Get log statistics and analytics
 * @access Private
 * @query vehicleId - Filter by vehicle ID (optional)
 * @query startDate - Filter by start date (ISO string)
 * @query endDate - Filter by end date (ISO string)
 */
router.get('/stats', logController.getLogStats.bind(logController));

export default router;