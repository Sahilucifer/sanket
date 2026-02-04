import api, { ApiResponse } from '@/lib/api';

export interface ScanData {
  vehicle_id: string;
  car_number: string;
  is_active: boolean;
}

export interface CallRequest {
  vehicle_id: string;
  caller_number: string;
}

export interface EmergencyAlertRequest {
  vehicle_id: string;
  message?: string;
}

export interface CallResponse {
  call_id: string;
  status: string;
  message: string;
}

export interface AlertResponse {
  alert_id: string;
  status: string;
  message: string;
}

export class ScanService {
  // Get vehicle information for scan page (public endpoint)
  static async getScanData(vehicleId: string): Promise<ScanData> {
    try {
      const response = await api.get(`/scan/${vehicleId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Vehicle not found');
    }
  }

  // Initiate a call to vehicle owner
  static async initiateCall(vehicleId: string, callerNumber: string): Promise<CallResponse> {
    try {
      const response = await api.post('/call/initiate', {
        vehicle_id: vehicleId,
        caller_number: callerNumber
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initiate call');
    }
  }

  // Send emergency alert to vehicle owner
  static async sendEmergencyAlert(vehicleId: string, message?: string): Promise<AlertResponse> {
    try {
      const response = await api.post('/alert/emergency', {
        vehicle_id: vehicleId,
        message: message || 'Emergency alert from your parked vehicle'
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send emergency alert');
    }
  }

  // Validate phone number format
  static validatePhoneNumber(phone: string): boolean {
    // Support both Indian format (10 digits) and international format (+91xxxxxxxxxx)
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for 10-digit Indian number or 12-digit with country code (91xxxxxxxxxx)
    if (cleaned.length === 10) {
      return /^[6-9]\d{9}$/.test(cleaned); // Indian mobile numbers start with 6-9
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return /^91[6-9]\d{9}$/.test(cleaned); // +91 followed by valid Indian mobile
    }
    
    return false;
  }

  // Format phone number for display
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
}