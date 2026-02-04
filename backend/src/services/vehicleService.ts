import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { Vehicle } from '../types';

export class VehicleService {
  async createVehicle(userId: string, carNumber: string): Promise<Vehicle> {
    const normalizedCarNumber = carNumber.trim().toUpperCase();
    
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .insert({
        user_id: userId,
        car_number: normalizedCarNumber,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Error creating vehicle:', error);
      throw new Error('Failed to create vehicle');
    }

    return this.sanitizeVehicle(vehicle);
  }

  async getVehiclesByUser(userId: string): Promise<Vehicle[]> {
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching vehicles:', error);
      throw new Error('Failed to fetch vehicles');
    }

    return (vehicles || []).map(vehicle => this.sanitizeVehicle(vehicle));
  }

  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching vehicle:', error);
      throw new Error('Failed to fetch vehicle');
    }

    return this.sanitizeVehicle(vehicle);
  }

  async updateVehicle(vehicleId: string, updateData: Partial<Vehicle>): Promise<Vehicle> {
    const updateFields: any = {};
    
    if (updateData.carNumber !== undefined) {
      updateFields.car_number = updateData.carNumber.trim().toUpperCase();
    }
    
    if (updateData.isActive !== undefined) {
      updateFields.is_active = updateData.isActive;
    }

    updateFields.updated_at = new Date().toISOString();

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update(updateFields)
      .eq('id', vehicleId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error updating vehicle:', error);
      throw new Error('Failed to update vehicle');
    }

    return this.sanitizeVehicle(vehicle);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('vehicles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    if (error) {
      logger.error('Error deleting vehicle:', error);
      throw new Error('Failed to delete vehicle');
    }
  }

  async getVehicleForScan(vehicleId: string): Promise<{ carNumber: string; isActive: boolean } | null> {
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .select('car_number, is_active')
      .eq('id', vehicleId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching vehicle for scan:', error);
      throw new Error('Failed to fetch vehicle for scan');
    }

    return {
      carNumber: vehicle.car_number,
      isActive: vehicle.is_active,
    };
  }

  async getVehicleOwnerPhone(vehicleId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select(`users!inner(phone)`)
      .eq('id', vehicleId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching vehicle owner phone:', error);
      throw new Error('Failed to fetch vehicle owner phone');
    }

    return (data.users as any).phone;
  }

  async regenerateQRCode(vehicleId: string): Promise<string | null> {
    logger.info(`QR code regeneration requested for vehicle: ${vehicleId}`);
    return null;
  }

  private sanitizeVehicle(vehicle: any): Vehicle {
    return {
      id: vehicle.id,
      userId: vehicle.user_id,
      carNumber: vehicle.car_number,
      qrUrl: vehicle.qr_url,
      isActive: vehicle.is_active,
      createdAt: new Date(vehicle.created_at),
      updatedAt: new Date(vehicle.updated_at),
    };
  }

  validateConfiguration(): boolean {
    return true;
  }
}

export const vehicleService = new VehicleService();