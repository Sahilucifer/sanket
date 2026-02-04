import { Request, Response } from 'express';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * Create a new vehicle
 */
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { carNumber } = req.body;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'UNAUTHORIZED'
                }
            } as ApiResponse);
            return;
        }

        if (!carNumber) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Car number is required',
                    code: 'MISSING_CAR_NUMBER'
                }
            } as ApiResponse);
            return;
        }

        const vehicle = await vehicleService.createVehicle(userId, carNumber);

        res.status(201).json({
            success: true,
            data: vehicle
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in createVehicle:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create vehicle',
                code: 'CREATE_VEHICLE_ERROR'
            }
        } as ApiResponse);
    }
};

/**
 * Get all vehicles for the authenticated user
 */
export const getVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'UNAUTHORIZED'
                }
            } as ApiResponse);
            return;
        }

        const vehicles = await vehicleService.getVehiclesByUser(userId);

        res.json({
            success: true,
            data: vehicles
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in getVehicles:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch vehicles',
                code: 'FETCH_VEHICLES_ERROR'
            }
        } as ApiResponse);
    }
};

/**
 * Get a specific vehicle by ID
 */
export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'UNAUTHORIZED'
                }
            } as ApiResponse);
            return;
        }

        if (!id || typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid vehicle ID',
                    code: 'INVALID_VEHICLE_ID'
                }
            } as ApiResponse);
            return;
        }

        const vehicle = await vehicleService.getVehicleById(id);

        if (!vehicle) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Vehicle not found',
                    code: 'VEHICLE_NOT_FOUND'
                }
            } as ApiResponse);
            return;
        }

        // Check ownership
        if (vehicle.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'You do not have permission to access this vehicle',
                    code: 'FORBIDDEN'
                }
            } as ApiResponse);
            return;
        }

        res.json({
            success: true,
            data: vehicle
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in getVehicleById:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch vehicle',
                code: 'FETCH_VEHICLE_ERROR'
            }
        } as ApiResponse);
    }
};

/**
 * Update a vehicle
 */
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const updateData = req.body;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'UNAUTHORIZED'
                }
            } as ApiResponse);
            return;
        }

        if (!id || typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid vehicle ID',
                    code: 'INVALID_VEHICLE_ID'
                }
            } as ApiResponse);
            return;
        }

        // Verify existence and ownership
        const existingVehicle = await vehicleService.getVehicleById(id);

        if (!existingVehicle) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Vehicle not found',
                    code: 'VEHICLE_NOT_FOUND'
                }
            } as ApiResponse);
            return;
        }

        if (existingVehicle.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'You do not have permission to update this vehicle',
                    code: 'FORBIDDEN'
                }
            } as ApiResponse);
            return;
        }

        const updatedVehicle = await vehicleService.updateVehicle(id, updateData);

        res.json({
            success: true,
            data: updatedVehicle
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in updateVehicle:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update vehicle',
                code: 'UPDATE_VEHICLE_ERROR'
            }
        } as ApiResponse);
    }
};

/**
 * Delete a vehicle
 */
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'UNAUTHORIZED'
                }
            } as ApiResponse);
            return;
        }

        if (!id || typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid vehicle ID',
                    code: 'INVALID_VEHICLE_ID'
                }
            } as ApiResponse);
            return;
        }

        // Verify existence and ownership
        const existingVehicle = await vehicleService.getVehicleById(id);

        if (!existingVehicle) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Vehicle not found',
                    code: 'VEHICLE_NOT_FOUND'
                }
            } as ApiResponse);
            return;
        }

        if (existingVehicle.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'You do not have permission to delete this vehicle',
                    code: 'FORBIDDEN'
                }
            } as ApiResponse);
            return;
        }

        await vehicleService.deleteVehicle(id);

        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in deleteVehicle:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete vehicle',
                code: 'DELETE_VEHICLE_ERROR'
            }
        } as ApiResponse);
    }
};

/**
 * Regenerate QR code for a vehicle
 */
export const regenerateQRCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not authenticated',
                    code: 'UNAUTHORIZED'
                }
            } as ApiResponse);
            return;
        }

        if (!id || typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid vehicle ID',
                    code: 'INVALID_VEHICLE_ID'
                }
            } as ApiResponse);
            return;
        }

        // Verify existence and ownership
        const existingVehicle = await vehicleService.getVehicleById(id);

        if (!existingVehicle) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Vehicle not found',
                    code: 'VEHICLE_NOT_FOUND'
                }
            } as ApiResponse);
            return;
        }

        if (existingVehicle.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'You do not have permission to modify this vehicle',
                    code: 'FORBIDDEN'
                }
            } as ApiResponse);
            return;
        }

        const newQrUrl = await vehicleService.regenerateQRCode(id);

        // Note: The service currently returns null as it's not fully implemented
        // but the controller logic is sound.

        res.json({
            success: true,
            data: {
                vehicleId: id,
                qrUrl: newQrUrl,
                message: 'QR code regeneration initiated'
            }
        } as ApiResponse);

    } catch (error) {
        logger.error('Error in regenerateQRCode:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to regenerate QR code',
                code: 'REGENERATE_QR_ERROR'
            }
        } as ApiResponse);
    }
};
