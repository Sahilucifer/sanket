import { QRCodeService } from '../services/qrCodeService';

describe('QRCodeService', () => {
  let qrCodeService: QRCodeService;

  beforeEach(() => {
    qrCodeService = new QRCodeService();
  });

  test('should create QRCodeService instance', () => {
    expect(qrCodeService).toBeInstanceOf(QRCodeService);
  });

  test('should validate configuration', () => {
    const isValid = qrCodeService.validateConfiguration();
    expect(typeof isValid).toBe('boolean');
  });

  test('should generate scan URL', () => {
    const vehicleId = 'test-vehicle-id';
    const scanUrl = qrCodeService.getScanUrl(vehicleId);
    expect(scanUrl).toContain(vehicleId);
    expect(scanUrl).toContain('/scan/');
  });
});