import api, { ApiResponse } from '@/lib/api';

export interface Vehicle {
  id: string;
  userId: string;
  carNumber: string;
  qrUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleRequest {
  carNumber: string;
}

export interface UpdateVehicleRequest {
  carNumber?: string;
  isActive?: boolean;
}

export class VehicleService {
  // Get all vehicles for the authenticated user
  static async getVehicles(): Promise<Vehicle[]> {
    try {
      const response = await api.get('/vehicles');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vehicles');
    }
  }

  // Get a specific vehicle by ID
  static async getVehicle(id: string): Promise<Vehicle> {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vehicle');
    }
  }

  // Create a new vehicle
  static async createVehicle(vehicleData: CreateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create vehicle');
    }
  }

  // Update an existing vehicle
  static async updateVehicle(id: string, vehicleData: UpdateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update vehicle');
    }
  }

  // Delete a vehicle
  static async deleteVehicle(id: string): Promise<void> {
    try {
      await api.delete(`/vehicles/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete vehicle');
    }
  }

  // Get QR code URL for a vehicle
  static getQrCodeUrl(vehicle: Vehicle): string | null {
    return vehicle.qrUrl;
  }

  // Get scan page URL for a vehicle
  static getScanPageUrl(vehicleId: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/scan/${vehicleId}`;
  }

  // Regenerate QR code for a vehicle
  static async regenerateQRCode(id: string): Promise<{ qrUrl: string; message: string }> {
    try {
      const response = await api.post(`/vehicles/${id}/regenerate-qr`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to regenerate QR code');
    }
  }
}