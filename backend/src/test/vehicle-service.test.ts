import { VehicleService } from '../services/vehicleService';

describe('VehicleService', () => {
  let vehicleService: VehicleService;

  beforeEach(() => {
    vehicleService = new VehicleService();
  });

  test('should create VehicleService instance', () => {
    expect(vehicleService).toBeInstanceOf(VehicleService);
  });

  test('should validate configuration', () => {
    const isValid = vehicleService.validateConfiguration();
    expect(typeof isValid).toBe('boolean');
  });
});