# Requirements Document

## Introduction

The Masked Calling Parking Alert System is a full-stack web application that enables car owners to provide a secure way for others to contact them when their vehicle is blocking or causing parking issues. The system uses masked calling technology to protect privacy while facilitating communication between vehicle owners and concerned parties.

## Glossary

- **System**: The Masked Calling Parking Alert System
- **Vehicle_Owner**: A registered user who owns and has registered a vehicle
- **Caller**: An anonymous person who scans a QR code and initiates contact
- **Masked_Call**: A phone call where both parties' real numbers are hidden using a virtual number
- **Virtual_Number**: A system-provided phone number that routes calls between parties
- **QR_Code**: A scannable code that links to a vehicle's contact page
- **Emergency_Alert**: An automated notification system for urgent situations
- **Call_Service**: External service (Exotel/Twilio) providing masked calling functionality

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a vehicle owner, I want to register with my phone number, so that I can securely access the system and receive calls about my vehicle.

#### Acceptance Criteria

1. WHEN a user provides a phone number for registration, THE System SHALL send an OTP verification code
2. WHEN a user enters a valid OTP, THE System SHALL create a user account and generate a JWT token
3. WHEN a user attempts to access protected routes without authentication, THE System SHALL redirect to the login page
4. WHEN a user logs in with valid credentials, THE System SHALL provide a JWT token valid for 24 hours
5. THE System SHALL store user information including name and verified phone number

### Requirement 2: Vehicle Registration and QR Code Generation

**User Story:** As a vehicle owner, I want to register my vehicle and get a QR code, so that others can contact me when needed without knowing my personal information.

#### Acceptance Criteria

1. WHEN a vehicle owner registers a vehicle with car number, THE System SHALL create a unique vehicle_id
2. WHEN a vehicle is registered, THE System SHALL generate a QR code image linking to /scan/{vehicle_id}
3. WHEN a QR code is generated, THE System SHALL store the QR image URL in a storage bucket
4. THE System SHALL associate each vehicle with exactly one vehicle owner
5. WHEN a vehicle owner views their vehicles, THE System SHALL display car number and QR code without exposing phone numbers

### Requirement 3: Public Vehicle Scanning and Contact Interface

**User Story:** As a person who needs to contact a vehicle owner, I want to scan a QR code and access contact options, so that I can reach the owner without knowing their personal details.

#### Acceptance Criteria

1. WHEN a user visits /scan/{vehicle_id}, THE System SHALL display the vehicle's car number
2. WHEN the scan page loads, THE System SHALL show a "Call Owner" button and "Emergency Alert" button
3. WHEN a scan occurs, THE System SHALL log the scan event with timestamp and vehicle_id
4. THE System SHALL NOT display any personal information about the vehicle owner on the scan page
5. WHEN an invalid vehicle_id is accessed, THE System SHALL display an appropriate error message

### Requirement 4: Masked Calling System

**User Story:** As a caller, I want to contact a vehicle owner through a masked call, so that neither party's phone number is revealed during communication.

#### Acceptance Criteria

1. WHEN a caller clicks "Call Owner", THE System SHALL initiate a masked call using the Call_Service
2. WHEN a masked call is initiated, THE System SHALL use a Virtual_Number to connect both parties
3. WHEN a masked call is in progress, THE System SHALL ensure neither party sees the other's real phone number
4. WHEN a masked call is completed, THE System SHALL log the call with vehicle_id, caller_number, timestamp, and status
5. THE System SHALL handle call failures gracefully and provide appropriate error messages

### Requirement 5: Emergency Alert System

**User Story:** As a caller in an urgent situation, I want to send an emergency alert, so that the vehicle owner is immediately notified through multiple channels.

#### Acceptance Criteria

1. WHEN a caller clicks "Emergency Alert", THE System SHALL immediately initiate an automated call to the vehicle owner
2. WHEN an emergency alert is triggered, THE System SHALL send an SMS message to the vehicle owner
3. WHEN emergency notifications are sent, THE System SHALL log the alert with vehicle_id, timestamp, and message content
4. THE System SHALL use predefined emergency message templates for consistency
5. WHEN emergency alerts fail to send, THE System SHALL retry up to 3 times and log failure status

### Requirement 6: Comprehensive Logging System

**User Story:** As a system administrator, I want detailed logs of all system activities, so that I can monitor usage, troubleshoot issues, and ensure system reliability.

#### Acceptance Criteria

1. WHEN any call is initiated, THE System SHALL log caller_number, vehicle_id, timestamp, and call status
2. WHEN any SMS is sent, THE System SHALL log recipient, message content, timestamp, and delivery status
3. WHEN any QR code is scanned, THE System SHALL log vehicle_id, timestamp, and scan source
4. THE System SHALL store all logs in the database with appropriate indexing for queries
5. WHEN logs are queried, THE System SHALL support filtering by date range, vehicle_id, and event type

### Requirement 7: Security and Privacy Protection

**User Story:** As a vehicle owner, I want my personal information protected, so that my privacy is maintained while still allowing necessary communication.

#### Acceptance Criteria

1. WHEN API responses are sent to frontend, THE System SHALL never include real phone numbers
2. WHEN rate limiting thresholds are exceeded, THE System SHALL block requests and return appropriate error codes
3. WHEN user input is received, THE System SHALL validate and sanitize all data before processing
4. THE System SHALL store all sensitive configuration in environment variables
5. WHEN authentication tokens expire, THE System SHALL require re-authentication

### Requirement 8: Database Schema and Data Management

**User Story:** As a system architect, I want a well-structured database schema, so that data is organized efficiently and relationships are maintained properly.

#### Acceptance Criteria

1. THE System SHALL maintain a users table with id, name, and phone fields
2. THE System SHALL maintain a vehicles table with id, user_id, car_number, and qr_url fields
3. THE System SHALL maintain a call_logs table with id, vehicle_id, caller_number, timestamp, and status fields
4. THE System SHALL maintain an alert_logs table with id, vehicle_id, timestamp, and message fields
5. WHEN foreign key relationships exist, THE System SHALL enforce referential integrity

### Requirement 9: Frontend User Interface

**User Story:** As a user, I want an intuitive web interface, so that I can easily manage my vehicles and access system features.

#### Acceptance Criteria

1. THE System SHALL provide a login page at /login for user authentication
2. THE System SHALL provide a dashboard page showing user's registered vehicles
3. THE System SHALL provide a vehicles page at /vehicles for vehicle management
4. THE System SHALL provide individual vehicle pages at /vehicles/{id} showing QR codes
5. THE System SHALL use Tailwind CSS for consistent styling across all pages

### Requirement 10: API Architecture and Integration

**User Story:** As a developer, I want well-structured APIs, so that the frontend can interact efficiently with backend services.

#### Acceptance Criteria

1. THE System SHALL provide authentication APIs at /auth for login and registration
2. THE System SHALL provide vehicle management APIs at /vehicle for CRUD operations
3. THE System SHALL provide scanning APIs at /scan for QR code interactions
4. THE System SHALL provide calling APIs at /call for masked call initiation
5. THE System SHALL provide alert APIs at /alert for emergency notifications

### Requirement 11: External Service Integration

**User Story:** As a system operator, I want reliable integration with external services, so that masked calling and SMS features work consistently.

#### Acceptance Criteria

1. WHEN integrating with Call_Service, THE System SHALL support both Exotel and Twilio APIs
2. WHEN external service calls fail, THE System SHALL implement retry logic with exponential backoff
3. WHEN service responses are received, THE System SHALL parse and validate all data before processing
4. THE System SHALL maintain service configuration through environment variables
5. WHEN service quotas are exceeded, THE System SHALL handle errors gracefully and notify administrators

### Requirement 12: Deployment and Production Readiness

**User Story:** As a DevOps engineer, I want deployment-ready code with proper configuration, so that the system can be deployed reliably to production environments.

#### Acceptance Criteria

1. THE System SHALL provide separate build scripts for development and production environments
2. THE System SHALL include example environment files with all required variables
3. THE System SHALL support deployment to Vercel for frontend and Railway/Render for backend
4. THE System SHALL include comprehensive deployment instructions and setup guides
5. WHEN deployed to production, THE System SHALL use Supabase for database and logging storage