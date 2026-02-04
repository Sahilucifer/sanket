// Core data models
export interface User {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  userId: string;
  carNumber: string;
  qrUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallLog {
  id: string;
  vehicleId: string;
  callerNumber: string;
  ownerNumber: string;
  callSid: string | null;
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'no-answer';
  duration: number;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}

export interface AlertLog {
  id: string;
  vehicleId: string;
  alertType: 'emergency_call' | 'emergency_sms';
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: Date;
  createdAt: Date;
}

export interface ScanLog {
  id: string;
  vehicleId: string;
  ipAddress: string | null;
  userAgent: string | null;
  scannedAt: Date;
}

export interface ScanAnalytics {
  totalScans: number;
  uniqueIPs: number;
  scansByHour: Record<string, number>;
  scansByDay: Record<string, number>;
  peakHour: { hour: string; count: number } | null;
  averageScansPerDay: number;
}

export interface VehicleScanStats {
  vehicleId: string;
  totalScans: number;
  scansLast24Hours: number;
  scansLast7Days: number;
  scansLast30Days: number;
  firstScan: Date | null;
  lastScan: Date | null;
  uniqueIPs: number;
}

// API Request/Response models
export interface RegisterRequest {
  name: string;
  phoneNumber: string;
}

export interface OTPVerificationRequest {
  phoneNumber: string;
  otp: string;
}

export interface CreateVehicleRequest {
  carNumber: string;
}

export interface InitiateCallRequest {
  vehicleId: string;
  callerNumber: string;
}

export interface EmergencyAlertRequest {
  vehicleId: string;
}

// API Response models
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface AuthResponse {
  user: Omit<User, 'phone'>;
  token: string;
}

export interface CallResult {
  callId: string;
  status: 'initiated' | 'failed';
  message: string;
}

export interface AlertResult {
  alertId: string;
  status: 'sent' | 'failed';
  message: string;
}

export interface SMSResult {
  smsId: string;
  status: 'sent' | 'failed';
  message: string;
}