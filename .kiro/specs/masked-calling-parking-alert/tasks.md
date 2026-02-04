# Implementation Plan: Masked Calling Parking Alert System

## Overview

This implementation plan breaks down the development of a complete production-ready webapp for the Masked Calling Parking Alert System. The system will be built with Next.js frontend, Node.js backend, Supabase database, and integrated with Exotel/Twilio for masked calling functionality.

The implementation follows a structured approach: database setup, backend API development, frontend implementation, external service integration, security implementation, testing, and deployment preparation.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Initialize Next.js frontend project with TypeScript and Tailwind CSS
    - Create Next.js 14 project with App Router
    - Configure TypeScript with strict mode
    - Set up Tailwind CSS with custom configuration
    - Install and configure required dependencies (axios, react-hook-form, etc.)
    - _Requirements: 9.5, 12.1_

  - [x] 1.2 Initialize Node.js backend project with Express and TypeScript
    - Create Express.js project with TypeScript configuration
    - Set up project structure with controllers, services, and middleware
    - Install dependencies (express, joi, winston, jsonwebtoken, etc.)
    - Configure development and production build scripts
    - _Requirements: 12.1_

  - [x] 1.3 Set up Supabase database and configure connection
    - Create Supabase project and configure database
    - Set up connection pooling and environment variables
    - Create database migration scripts
    - Configure Supabase Storage for QR code images
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 12.5_

  - [ ]* 1.4 Write property test for project structure validation
    - **Property 29: Database Schema Integrity**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 2. Database Schema Implementation
  - [x] 2.1 Create users table with proper schema and constraints
    - Implement users table with id, name, phone, is_verified fields
    - Add unique constraints and indexes
    - Set up created_at and updated_at timestamps
    - _Requirements: 8.1_

  - [x] 2.2 Create vehicles table with foreign key relationships
    - Implement vehicles table with user_id foreign key
    - Add car_number, qr_url, and is_active fields
    - Set up proper indexing for queries
    - _Requirements: 8.2_

  - [x] 2.3 Create call_logs table for call tracking
    - Implement call_logs table with vehicle_id foreign key
    - Add caller_number, owner_number, call_sid, status, duration fields
    - Set up timestamp fields for call tracking
    - _Requirements: 8.3_

  - [x] 2.4 Create alert_logs table for emergency alert tracking
    - Implement alert_logs table with vehicle_id foreign key
    - Add alert_type, message, status fields
    - Set up timestamp fields for alert tracking
    - _Requirements: 8.4_

  - [x] 2.5 Create scan_logs table for QR code scan tracking
    - Implement scan_logs table with vehicle_id foreign key
    - Add ip_address, user_agent fields for scan metadata
    - Set up scanned_at timestamp field
    - _Requirements: 6.3_

  - [ ]* 2.6 Write property tests for database schema integrity
    - **Property 29: Database Schema Integrity**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 3. Authentication System Implementation
  - [x] 3.1 Implement user registration with phone number validation
    - Create registration endpoint with phone number validation
    - Implement OTP generation and sending logic
    - Set up user creation with proper data validation
    - _Requirements: 1.1, 1.5_

  - [x] 3.2 Implement OTP verification and JWT token generation
    - Create OTP verification endpoint
    - Implement JWT token generation with 24-hour expiration
    - Set up user account activation flow
    - _Requirements: 1.2, 1.4_

  - [x] 3.3 Implement authentication middleware and route protection
    - Create JWT validation middleware
    - Implement route protection for authenticated endpoints
    - Set up token refresh logic
    - _Requirements: 1.3, 7.5_

  - [x] 3.4 Create authentication service layer
    - Implement AuthService with all authentication methods
    - Add proper error handling and validation
    - Set up logging for authentication events
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.5 Write property tests for authentication system
    - **Property 1: OTP Generation Consistency**
    - **Property 2: Account Creation Completeness**
    - **Property 3: Authentication Protection**
    - **Property 4: User Data Persistence**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  - [ ]* 3.6 Write unit tests for authentication edge cases
    - Test invalid phone numbers, expired OTPs, malformed tokens
    - Test concurrent registration attempts
    - Test authentication with expired tokens
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Vehicle Management System
  - [x] 4.1 Implement vehicle registration and CRUD operations
    - Create vehicle registration endpoint with validation
    - Implement vehicle listing, update, and deletion
    - Set up proper authorization checks
    - _Requirements: 2.1, 2.4_

  - [x] 4.2 Implement QR code generation and storage
    - Create QR code generation service using qrcode library
    - Implement Supabase Storage integration for QR images
    - Set up QR code URL generation and storage
    - _Requirements: 2.2, 2.3_

  - [x] 4.3 Create vehicle service layer with privacy protection
    - Implement VehicleService with all CRUD methods
    - Add privacy protection to never expose phone numbers
    - Set up proper error handling and validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.4 Write property tests for vehicle management
    - **Property 5: Unique Vehicle ID Generation**
    - **Property 6: QR Code Generation Completeness**
    - **Property 7: Vehicle-Owner Association**
    - **Property 8: Privacy Protection in Vehicle Display**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ]* 4.5 Write unit tests for vehicle operations
    - Test vehicle creation with duplicate car numbers
    - Test QR code generation failures
    - Test vehicle deletion with existing logs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Checkpoint - Core Backend Services Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Scan System and Public Interface
  - [x] 6.1 Implement public scan page endpoint
    - Create /scan/{vehicle_id} endpoint for public access
    - Implement vehicle lookup and validation
    - Set up scan logging with metadata capture
    - _Requirements: 3.1, 3.3_

  - [x] 6.2 Implement scan page content and privacy protection
    - Display car number and contact buttons
    - Ensure no personal information is exposed
    - Handle invalid vehicle IDs with proper error messages
    - _Requirements: 3.2, 3.4, 3.5_

  - [x] 6.3 Create scan logging service
    - Implement comprehensive scan event logging
    - Capture IP address, user agent, and timestamp
    - Set up log querying and filtering capabilities
    - _Requirements: 3.3, 6.3, 6.5_

  - [ ]* 6.4 Write property tests for scan system
    - **Property 9: Scan Page Content Completeness**
    - **Property 10: Scan Logging Completeness**
    - **Property 11: Scan Page Privacy Protection**
    - **Property 12: Invalid Vehicle ID Handling**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ]* 6.5 Write unit tests for scan edge cases
    - Test scanning with invalid vehicle IDs
    - Test scan logging with missing metadata
    - Test concurrent scan requests
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. External Service Integration Setup
  - [x] 7.1 Implement Exotel API integration service
    - Create ExotelService with masked calling methods
    - Implement call initiation and webhook handling
    - Set up SMS sending capabilities
    - _Requirements: 11.1_

  - [x] 7.2 Implement Twilio API integration service
    - Create TwilioService with masked calling methods
    - Implement call initiation and webhook handling
    - Set up SMS sending capabilities
    - _Requirements: 11.1_

  - [x] 7.3 Create unified call service abstraction
    - Implement CallService that supports both Exotel and Twilio
    - Add service selection logic based on configuration
    - Set up retry logic with exponential backoff
    - _Requirements: 11.1, 11.2_

  - [x] 7.4 Implement service response validation and error handling
    - Add response parsing and validation for both services
    - Implement quota handling and administrator notifications
    - Set up comprehensive error logging
    - _Requirements: 11.3, 11.5_

  - [ ]* 7.5 Write property tests for external service integration
    - **Property 30: Multi-Service Call Support**
    - **Property 31: External Service Retry Logic**
    - **Property 32: Service Response Validation**
    - **Property 33: Service Quota Handling**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.5**

  - [ ]* 7.6 Write unit tests for service integration
    - Test service failover between Exotel and Twilio
    - Test retry logic with various failure scenarios
    - Test quota exceeded handling
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 8. Masked Calling System Implementation
  - [x] 8.1 Implement masked call initiation endpoint
    - Create /call/initiate endpoint with proper validation
    - Implement virtual number assignment logic
    - Set up call logging with complete metadata
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 8.2 Implement call webhook handling
    - Create webhook endpoints for call status updates
    - Implement call completion logging
    - Set up call duration tracking
    - _Requirements: 4.4_

  - [x] 8.3 Implement call privacy protection
    - Ensure virtual numbers mask real phone numbers
    - Implement call recording restrictions
    - Set up privacy validation in all call flows
    - _Requirements: 4.3_

  - [x] 8.4 Implement call failure handling and error recovery
    - Add graceful error handling for call failures
    - Implement user-friendly error messages
    - Set up call retry logic for transient failures
    - _Requirements: 4.5_

  - [ ]* 8.5 Write property tests for masked calling
    - **Property 13: Masked Call Initiation**
    - **Property 14: Call Privacy Protection**
    - **Property 15: Call Logging Completeness**
    - **Property 16: Call Failure Handling**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [ ]* 8.6 Write unit tests for call system edge cases
    - Test call initiation with invalid vehicle IDs
    - Test webhook handling with malformed data
    - Test concurrent call requests
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Emergency Alert System Implementation
  - [x] 9.1 Implement emergency alert initiation
    - Create /alert/emergency endpoint
    - Implement dual-channel alert (call + SMS)
    - Set up immediate alert processing
    - _Requirements: 5.1, 5.2_

  - [x] 9.2 Implement emergency message templates
    - Create predefined emergency message templates
    - Implement template selection and customization
    - Set up message consistency validation
    - _Requirements: 5.4_

  - [x] 9.3 Implement emergency alert logging and retry logic
    - Set up comprehensive alert logging
    - Implement retry logic for failed alerts (up to 3 times)
    - Add failure status tracking and reporting
    - _Requirements: 5.3, 5.5_

  - [ ]* 9.4 Write property tests for emergency alerts
    - **Property 17: Emergency Alert Dual Channel**
    - **Property 18: Emergency Alert Logging**
    - **Property 19: Emergency Message Template Consistency**
    - **Property 20: Emergency Alert Retry Logic**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 9.5 Write unit tests for emergency alert edge cases
    - Test alert sending with service failures
    - Test retry logic with various failure patterns
    - Test template validation and selection
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Comprehensive Logging System
  - [x] 10.1 Implement call logging service
    - Create comprehensive call event logging
    - Include caller_number, vehicle_id, timestamp, status
    - Set up log indexing for efficient queries
    - _Requirements: 6.1_

  - [x] 10.2 Implement SMS and alert logging service
    - Create comprehensive SMS and alert logging
    - Include recipient, message content, delivery status
    - Set up timestamp tracking for all events
    - _Requirements: 6.2_

  - [x] 10.3 Implement log querying and filtering system
    - Create log query endpoints with filtering
    - Support date range, vehicle_id, and event type filters
    - Implement pagination for large log sets
    - _Requirements: 6.5_

  - [x] 10.4 Set up log storage and indexing optimization
    - Implement proper database indexing for logs
    - Set up log retention policies
    - Optimize query performance for large datasets
    - _Requirements: 6.4_

  - [ ]* 10.5 Write property tests for logging system
    - **Property 21: Comprehensive Call Logging**
    - **Property 22: Comprehensive SMS Logging**
    - **Property 23: Database Log Storage**
    - **Property 24: Log Query Filtering**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**

  - [ ]* 10.6 Write unit tests for logging operations
    - Test log creation with missing fields
    - Test log querying with various filter combinations
    - Test log retention and cleanup
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [-] 11. Checkpoint - Backend API Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Security Implementation
  - [ ] 12.1 Implement rate limiting middleware
    - Set up express-rate-limit for all endpoints
    - Configure different limits for different endpoint types
    - Implement proper error responses for exceeded limits
    - _Requirements: 7.2_

  - [ ] 12.2 Implement input validation and sanitization
    - Set up Joi validation schemas for all endpoints
    - Implement input sanitization middleware
    - Add comprehensive validation error handling
    - _Requirements: 7.3_

  - [ ] 12.3 Implement API response privacy protection
    - Create response filtering middleware
    - Ensure phone numbers are never exposed in API responses
    - Set up privacy validation for all endpoints
    - _Requirements: 7.1_

  - [x] 12.4 Set up environment variable configuration
    - Move all sensitive configuration to environment variables
    - Create example environment files
    - Set up configuration validation on startup
    - _Requirements: 7.4, 11.4_

  - [ ]* 12.5 Write property tests for security features
    - **Property 25: API Response Privacy Protection**
    - **Property 26: Rate Limiting Protection**
    - **Property 27: Input Validation Completeness**
    - **Property 28: Token Expiration Handling**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

  - [ ]* 12.6 Write unit tests for security edge cases
    - Test rate limiting with burst requests
    - Test input validation with malicious payloads
    - Test privacy protection with various response types
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 13. Frontend Authentication Implementation
  - [x] 13.1 Create login and registration pages
    - Implement /login page with phone number input
    - Create registration flow with OTP verification
    - Set up form validation and error handling
    - _Requirements: 9.1_

  - [x] 13.2 Implement authentication context and state management
    - Create React context for authentication state
    - Implement JWT token storage and management
    - Set up automatic token refresh logic
    - _Requirements: 1.3, 1.4_

  - [x] 13.3 Create protected route wrapper component
    - Implement route protection for authenticated pages
    - Set up automatic redirect to login for unauthenticated users
    - Add loading states for authentication checks
    - _Requirements: 1.3_

  - [ ]* 13.4 Write unit tests for authentication components
    - Test login form validation and submission
    - Test OTP verification flow
    - Test protected route behavior
    - _Requirements: 9.1, 1.3, 1.4_

- [ ] 14. Frontend Dashboard and Vehicle Management
  - [x] 14.1 Create user dashboard page
    - Implement dashboard showing user's registered vehicles
    - Display vehicle cards with car numbers and QR codes
    - Set up vehicle management actions (edit, delete)
    - _Requirements: 9.2_

  - [x] 14.2 Create vehicles management page
    - Implement /vehicles page for vehicle CRUD operations
    - Create vehicle registration form
    - Set up vehicle editing and deletion functionality
    - _Requirements: 9.3_

  - [x] 14.3 Create individual vehicle pages
    - Implement /vehicles/{id} pages showing QR codes
    - Display downloadable QR code images
    - Set up vehicle details and management options
    - _Requirements: 9.4_

  - [x] 14.4 Implement QR code display and download functionality
    - Create QR code display component
    - Implement QR code download functionality
    - Set up proper image loading and error handling
    - _Requirements: 2.2, 2.3_

  - [ ]* 14.5 Write property tests for frontend vehicle management
    - **Property 8: Privacy Protection in Vehicle Display**
    - **Validates: Requirements 2.5**

  - [ ]* 14.6 Write unit tests for dashboard components
    - Test vehicle card display and interactions
    - Test vehicle form validation and submission
    - Test QR code display and download
    - _Requirements: 9.2, 9.3, 9.4_

- [ ] 15. Frontend Scan Page Implementation
  - [ ] 15.1 Create public scan page
    - Implement /scan/[vehicleId] page for public access
    - Display vehicle car number and contact options
    - Set up "Call Owner" and "Emergency Alert" buttons
    - _Requirements: 3.1, 3.2_

  - [ ] 15.2 Implement call initiation functionality
    - Create call initiation with phone number input
    - Set up loading states and success/error feedback
    - Implement proper error handling for call failures
    - _Requirements: 4.1, 4.5_

  - [ ] 15.3 Implement emergency alert functionality
    - Create emergency alert button with confirmation
    - Set up immediate alert sending with feedback
    - Implement proper error handling for alert failures
    - _Requirements: 5.1, 5.2_

  - [ ] 15.4 Add scan page privacy protection and error handling
    - Ensure no personal information is displayed
    - Handle invalid vehicle IDs with proper error pages
    - Set up proper loading states and user feedback
    - _Requirements: 3.4, 3.5_

  - [ ]* 15.5 Write unit tests for scan page components
    - Test scan page rendering with valid/invalid vehicle IDs
    - Test call initiation flow and error handling
    - Test emergency alert flow and confirmation
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 16. Frontend Styling and UI Polish
  - [ ] 16.1 Implement consistent Tailwind CSS styling
    - Apply Tailwind classes across all components
    - Create consistent color scheme and typography
    - Set up responsive design for mobile and desktop
    - _Requirements: 9.5_

  - [x] 16.2 Create reusable UI components
    - Implement button, input, card, and modal components
    - Set up consistent styling and behavior patterns
    - Create loading spinners and error message components
    - _Requirements: 9.5_

  - [ ] 16.3 Implement responsive design and mobile optimization
    - Ensure all pages work properly on mobile devices
    - Optimize QR code display for mobile scanning
    - Set up proper touch interactions and accessibility
    - _Requirements: 9.5_

  - [ ]* 16.4 Write property tests for UI consistency
    - **Property 35: Tailwind CSS Consistency**
    - **Validates: Requirements 9.5**

- [ ] 17. API Integration and Frontend-Backend Connection
  - [x] 17.1 Set up API client with axios configuration
    - Create axios instance with base URL and interceptors
    - Implement request/response interceptors for authentication
    - Set up error handling and retry logic
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 17.2 Implement authentication API integration
    - Connect login/registration forms to auth endpoints
    - Set up OTP verification API calls
    - Implement token refresh and logout functionality
    - _Requirements: 10.1_

  - [x] 17.3 Implement vehicle management API integration
    - Connect vehicle forms to vehicle CRUD endpoints
    - Set up QR code fetching and display
    - Implement vehicle deletion with confirmation
    - _Requirements: 10.2_

  - [x] 17.4 Implement scan and call API integration
    - Connect scan page to scan endpoints
    - Set up call initiation API calls
    - Implement emergency alert API integration
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 17.5 Write integration tests for API connections
    - Test complete user flows from frontend to backend
    - Test error handling and retry logic
    - Test authentication token management
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 18. Checkpoint - Full Stack Integration Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Production Configuration and Environment Setup
  - [ ] 19.1 Create production environment configuration
    - Set up production environment variables
    - Configure Supabase production database
    - Set up production API keys for Exotel/Twilio
    - _Requirements: 12.5_

  - [ ] 19.2 Create deployment configuration files
    - Set up Vercel configuration for frontend deployment
    - Create Railway/Render configuration for backend
    - Configure environment variable management
    - _Requirements: 12.3_

  - [ ] 19.3 Set up build scripts and optimization
    - Create separate build scripts for development and production
    - Set up code minification and optimization
    - Configure asset optimization and caching
    - _Requirements: 12.1_

  - [ ] 19.4 Create comprehensive environment documentation
    - Create example environment files with all required variables
    - Document all configuration options and requirements
    - Set up environment validation and error handling
    - _Requirements: 12.2_

- [ ] 20. Testing Infrastructure and Test Suite
  - [ ] 20.1 Set up property-based testing framework
    - Install and configure fast-check for property testing
    - Set up test configuration with minimum 100 iterations
    - Create property test utilities and helpers
    - _Requirements: All property tests_

  - [ ] 20.2 Set up unit testing framework
    - Configure Jest for both frontend and backend testing
    - Set up test database and mocking utilities
    - Create test utilities for authentication and API testing
    - _Requirements: All unit tests_

  - [ ] 20.3 Set up integration testing environment
    - Create test environment with separate database
    - Set up mock external services for testing
    - Configure end-to-end testing with Playwright or Cypress
    - _Requirements: Integration testing_

  - [ ] 20.4 Create comprehensive test coverage reporting
    - Set up code coverage reporting with Istanbul
    - Configure coverage thresholds (minimum 80%)
    - Set up automated test running in CI/CD
    - _Requirements: Testing coverage_

- [ ] 21. Deployment Preparation and Documentation
  - [ ] 21.1 Create deployment instructions and setup guides
    - Write comprehensive deployment documentation
    - Create step-by-step setup guides for all environments
    - Document troubleshooting and common issues
    - _Requirements: 12.4_

  - [ ] 21.2 Set up monitoring and logging in production
    - Configure production logging with appropriate levels
    - Set up error tracking and monitoring
    - Create health check endpoints for monitoring
    - _Requirements: Error handling and monitoring_

  - [ ] 21.3 Create backup and recovery procedures
    - Set up database backup procedures
    - Create data recovery documentation
    - Set up monitoring for system health and performance
    - _Requirements: Production readiness_

  - [ ] 21.4 Perform final security audit and testing
    - Review all security implementations
    - Test rate limiting and input validation
    - Verify privacy protection across all endpoints
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 22. Final Integration Testing and Quality Assurance
  - [ ] 22.1 Run complete end-to-end testing suite
    - Test complete user journeys from registration to calling
    - Verify all external service integrations
    - Test error handling and recovery scenarios
    - _Requirements: All requirements_

  - [ ] 22.2 Perform load testing and performance optimization
    - Test system performance under concurrent load
    - Optimize database queries and API response times
    - Test external service rate limits and quotas
    - _Requirements: Performance and scalability_

  - [ ] 22.3 Conduct security penetration testing
    - Test for common security vulnerabilities
    - Verify rate limiting and input validation effectiveness
    - Test authentication and authorization security
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 22.4 Final deployment readiness verification
    - Verify all environment configurations
    - Test deployment procedures in staging environment
    - Confirm all documentation is complete and accurate
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 23. Final Checkpoint - Production Ready System
  - Ensure all tests pass, verify deployment readiness, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP development
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The system is designed for production deployment with comprehensive security and monitoring
- External service integration supports both Exotel and Twilio for flexibility
- All sensitive configuration is managed through environment variables
- The implementation follows modern best practices for scalability and maintainability