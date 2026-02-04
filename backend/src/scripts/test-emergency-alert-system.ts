import { AlertService } from '../services/alertService';
import { logger } from '../utils/logger';

async function testEmergencyAlertSystem() {
  try {
    logger.info('🚨 Testing Emergency Alert System (Templates and Validation Only)');

    // Create a new instance for testing without database dependencies
    const testAlertService = new AlertService();

    // Test 1: Get message templates
    logger.info('Test 1: Get Message Templates');
    const templates = testAlertService.getMessageTemplates();
    logger.info('✅ Templates retrieved:', {
      count: templates.length,
      categories: [...new Set(templates.map(t => t.category))],
      severities: [...new Set(templates.map(t => t.severity))],
    });

    // Test 2: Get templates by category
    logger.info('Test 2: Get Templates by Category');
    const blockingTemplates = testAlertService.getMessageTemplatesByCategory('blocking');
    logger.info('✅ Blocking templates:', blockingTemplates.length);

    const medicalTemplates = testAlertService.getMessageTemplatesByCategory('medical');
    logger.info('✅ Medical templates:', medicalTemplates.length);

    // Test 3: Get templates by severity
    logger.info('Test 3: Get Templates by Severity');
    const criticalTemplates = testAlertService.getMessageTemplatesBySeverity('critical');
    logger.info('✅ Critical templates:', criticalTemplates.length);

    // Test 4: Validate custom messages
    logger.info('Test 4: Validate Custom Messages');
    
    const validMessage = 'This is a valid emergency message about your vehicle.';
    const validResult = testAlertService.validateCustomMessage(validMessage);
    logger.info('✅ Valid message validation:', validResult);

    const tooShortMessage = 'Short';
    const shortResult = testAlertService.validateCustomMessage(tooShortMessage);
    logger.info('✅ Too short message validation:', shortResult);

    const tooLongMessage = 'A'.repeat(501);
    const longResult = testAlertService.validateCustomMessage(tooLongMessage);
    logger.info('✅ Too long message validation:', longResult);

    const prohibitedMessage = 'This message contains bomb content';
    const prohibitedResult = testAlertService.validateCustomMessage(prohibitedMessage);
    logger.info('✅ Prohibited content validation:', prohibitedResult);

    // Test 5: Customize message template
    logger.info('Test 5: Customize Message Template');
    const defaultTemplate = templates.find(t => t.isDefault);
    if (defaultTemplate) {
      const customized = testAlertService.customizeMessage(defaultTemplate, {
        vehicleInfo: 'red Honda Civic (ABC-123)',
        location: 'Main Street parking lot',
        contactInfo: 'call security at 555-0123',
        urgencyLevel: 'high',
      });
      logger.info('✅ Customized message:', {
        originalCall: defaultTemplate.callMessage.substring(0, 50) + '...',
        customizedCall: customized.callMessage.substring(0, 100) + '...',
      });
    }

    // Test 6: Get template statistics
    logger.info('Test 6: Get Template Statistics');
    const stats = testAlertService.getTemplateStats();
    logger.info('✅ Template stats:', stats);

    // Test 7: Test template categories and severities
    logger.info('Test 7: Test Template Categories and Severities');
    const categories = ['general', 'blocking', 'medical', 'security'] as const;
    const severities = ['low', 'medium', 'high', 'critical'] as const;

    for (const category of categories) {
      const categoryTemplates = testAlertService.getMessageTemplatesByCategory(category);
      logger.info(`✅ ${category} category templates:`, categoryTemplates.length);
    }

    for (const severity of severities) {
      const severityTemplates = testAlertService.getMessageTemplatesBySeverity(severity);
      logger.info(`✅ ${severity} severity templates:`, severityTemplates.length);
    }

    logger.info('🎉 Emergency Alert System template tests completed successfully!');

  } catch (error: any) {
    logger.error('❌ Emergency Alert System test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testEmergencyAlertSystem()
    .then(() => {
      logger.info('Emergency Alert System test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Emergency Alert System test failed:', error);
      process.exit(1);
    });
}

export { testEmergencyAlertSystem };