// Export all services
export { AuthService } from './authService';
export { VehicleService } from './vehicleService';
export { ScanService } from './scanService';

// Export types
export type { 
  LoginRequest, 
  VerifyOtpRequest, 
  AuthResponse 
} from './authService';

export type { 
  Vehicle, 
  CreateVehicleRequest, 
  UpdateVehicleRequest 
} from './vehicleService';

export type { 
  ScanData, 
  CallRequest, 
  EmergencyAlertRequest, 
  CallResponse, 
  AlertResponse 
} from './scanService';