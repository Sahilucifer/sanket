import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All vehicle routes require authentication
router.use(authenticateToken);

router.post('/', vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);
router.post('/:id/regenerate-qr', vehicleController.regenerateQRCode);

export default router;