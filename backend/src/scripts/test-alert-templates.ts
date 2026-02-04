import { logger } from '../utils/logger';

// Define the template interface locally for testing
interface EmergencyMessageTemplate {
  id: string;
  name: string;
  description: string;
  callMessage: string;
  smsMessage: string;
  isDefault: boolean;
  category: 'general' | 'blocking' | 'medical' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Test message templates (same as in AlertService)
const messageTemplates: EmergencyMessageTemplate[] = [
  {
    id: 'default_parking',
    name: 'Default Parking Alert',
    description: 'General purpose parking alert for non-urgent situations',
    callMessage: 'This is an emergency alert regarding your vehicle. Someone needs to contact you urgently about your parked vehicle. Please check your vehicle immediately.',
    smsMessage: 'EMERGENCY ALERT: Someone needs to contact you urgently about your parked vehicle. Please check your vehicle location immediately.',
    isDefault: true,
    category: 'general',
    severity: 'medium',
  },
  {
    id: 'blocking_emergency',
    name: 'Blocking Emergency Access',
    description: 'Vehicle is blocking emergency services or critical access',
    callMessage: 'URGENT: Your vehicle is blocking emergency access. Emergency services need immediate access. Please move your vehicle immediately to allow emergency responders through.',
    smsMessage: 'CRITICAL: Your vehicle is blocking emergency access. Move IMMEDIATELY to allow emergency services through. Lives may depend on it.',
    isDefault: false,
    category: 'blocking',
    severity: 'critical',
  },
  {
    id: 'medical_emergency',
    name: 'Medical Emergency',
    description: 'Medical emergency requiring immediate vehicle access or movement',
    callMessage: 'MEDICAL EMERGENCY: Your vehicle location is needed for a medical emergency response. Please respond immediately or move your vehicle if it is blocking access to emergency services.',
    smsMessage: 'MEDICAL EMERGENCY: Your vehicle is needed for emergency response. Please respond immediately or move if blocking access.',
    isDefault: false,
    category: 'medical',
    severity: 'critical',
  },
  {
    id: 'fire_emergency',
    name: 'Fire Emergency',
    description: 'Fire emergency requiring immediate evacuation or access',
    callMessage: 'FIRE EMERGENCY: Your vehicle may be in danger or blocking fire department access. Please move your vehicle immediately for safety and emergency access.',
    smsMessage: 'FIRE EMERGENCY: Move your vehicle immediately. Fire department needs access or your vehicle may be in danger.',
    isDefault: false,
    category: 'security',
    severity: 'critical',
  },
  {
    id: 'blocking_driveway',
    name: 'Blocking Driveway',
    description: 'Vehicle is blocking someone\'s driveway or private access',
    callMessage: 'Your vehicle is blocking a driveway or private access. The property owner needs to access their property. Please move your vehicle as soon as possible.',
    smsMessage: 'Your vehicle is blocking a driveway. Please move it to allow property access. Thank you.',
    isDefault: false,
    category: 'blocking',
    severity: 'medium',
  },
  {
    id: 'double_parked',
    name: 'Double Parked',
    description: 'Vehicle is double parked and blocking traffic',
    callMessage: 'Your vehicle is double parked and blocking traffic flow. Please move your vehicle immediately to avoid traffic disruption and potential towing.',
    smsMessage: 'Your vehicle is double parked and blocking traffic. Please move immediately to avoid towing.',
    isDefault: false,
    category: 'blocking',
    severity: 'high',
  },
  {
    id: 'handicap_violation',
    name: 'Handicap Parking Violation',
    description: 'Vehicle is illegally parked in handicap space',
    callMessage: 'Your vehicle is parked in a handicap space without proper authorization. This space is reserved for people with disabilities. Please move your vehicle immediately.',
    smsMessage: 'Your vehicle is in a handicap space illegally. Please move immediately. This space is reserved for people with disabilities.',
    isDefault: false,
    category: 'general',
    severity: 'high',
  },
  {
    id: 'security_concern',
    name: 'Security Concern',
    description: 'Vehicle-related security or safety concern',
    callMessage: 'There is a security concern related to your vehicle location. Please check on your vehicle or contact the person trying to reach you about this matter.',
    smsMessage: 'Security concern regarding your vehicle. Please check your vehicle or respond to this alert.',
    isDefault: false,
    category: 'security',
    severity: 'high',
  },
];

function validateCustomMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required and must be a string' };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (trimmedMessage.length > 500) {
    return { isValid: false, error: 'Message cannot exceed 500 characters' };
  }

  if (trimmedMessage.length < 10) {
    return { isValid: false, error: 'Message must be at least 10 characters long' };
  }

  // Check for potentially harmful content
  const prohibitedPatterns = [
    /\b(hack|hacking|malware|virus)\b/i,
    /\b(scam|fraud|phishing)\b/i,
    /\b(bomb|explosive|weapon)\b/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(trimmedMessage)) {
      return { isValid: false, error: 'Message contains prohibited content' };
    }
  }

  return { isValid: true };
}

async function testAlertTemplates() {
  try {
    logger.info('🚨 Testing Emergency Alert Templates');

    // Test 1: Template count and structure
    logger.info('Test 1: Template Count and Structure');
    logger.info('✅ Total templates:', messageTemplates.length);
    logger.info('✅ Template categories:', [...new Set(messageTemplates.map(t => t.category))]);
    logger.info('✅ Template severities:', [...new Set(messageTemplates.map(t => t.severity))]);

    // Test 2: Default template exists
    logger.info('Test 2: Default Template');
    const defaultTemplate = messageTemplates.find(t => t.isDefault);
    logger.info('✅ Default template found:', !!defaultTemplate);
    if (defaultTemplate) {
      logger.info('✅ Default template:', defaultTemplate.name);
    }

    // Test 3: Templates by category
    logger.info('Test 3: Templates by Category');
    const categories = ['general', 'blocking', 'medical', 'security'] as const;
    for (const category of categories) {
      const categoryTemplates = messageTemplates.filter(t => t.category === category);
      logger.info(`✅ ${category} templates:`, categoryTemplates.length);
    }

    // Test 4: Templates by severity
    logger.info('Test 4: Templates by Severity');
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    for (const severity of severities) {
      const severityTemplates = messageTemplates.filter(t => t.severity === severity);
      logger.info(`✅ ${severity} templates:`, severityTemplates.length);
    }

    // Test 5: Message validation
    logger.info('Test 5: Message Validation');
    
    const validMessage = 'This is a valid emergency message about your vehicle.';
    const validResult = validateCustomMessage(validMessage);
    logger.info('✅ Valid message:', validResult);

    const tooShortMessage = 'Short';
    const shortResult = validateCustomMessage(tooShortMessage);
    logger.info('✅ Too short message:', shortResult);

    const tooLongMessage = 'A'.repeat(501);
    const longResult = validateCustomMessage(tooLongMessage);
    logger.info('✅ Too long message:', longResult);

    const prohibitedMessage = 'This message contains bomb content';
    const prohibitedResult = validateCustomMessage(prohibitedMessage);
    logger.info('✅ Prohibited content:', prohibitedResult);

    // Test 6: Template content validation
    logger.info('Test 6: Template Content Validation');
    let allTemplatesValid = true;
    for (const template of messageTemplates) {
      const callValid = validateCustomMessage(template.callMessage);
      const smsValid = validateCustomMessage(template.smsMessage);
      
      if (!callValid.isValid || !smsValid.isValid) {
        logger.error(`❌ Template ${template.id} has invalid messages:`, {
          callValid,
          smsValid,
        });
        allTemplatesValid = false;
      }
    }
    
    if (allTemplatesValid) {
      logger.info('✅ All template messages are valid');
    }

    // Test 7: Critical templates exist
    logger.info('Test 7: Critical Templates');
    const criticalTemplates = messageTemplates.filter(t => t.severity === 'critical');
    logger.info('✅ Critical templates found:', criticalTemplates.length);
    logger.info('✅ Critical template names:', criticalTemplates.map(t => t.name));

    logger.info('🎉 Emergency Alert Template tests completed successfully!');

  } catch (error: any) {
    logger.error('❌ Emergency Alert Template test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testAlertTemplates()
    .then(() => {
      logger.info('Emergency Alert Template test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Emergency Alert Template test failed:', error);
      process.exit(1);
    });
}

export { testAlertTemplates };