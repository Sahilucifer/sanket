'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScanService, ScanData } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ScanPage() {
  const [vehicle, setVehicle] = useState<ScanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const params = useParams();
  const vehicleId = params.vehicleId as string;

  useEffect(() => {
    fetchVehicleInfo();
  }, [vehicleId]);

  const fetchVehicleInfo = async () => {
    try {
      setIsLoading(true);
      const vehicleData = await ScanService.getScanData(vehicleId);
      setVehicle(vehicleData);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerPhone.trim()) return;

    // Format phone number for Indian numbers
    let formattedPhone = callerPhone.trim();
    
    // Remove all non-digits
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 prefix
    if (digitsOnly.length === 10 && digitsOnly.match(/^[6-9]/)) {
      formattedPhone = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      formattedPhone = `+${digitsOnly}`;
    } else if (!formattedPhone.startsWith('+')) {
      // If it doesn't start with +, add it
      formattedPhone = `+${digitsOnly}`;
    }

    // Validate phone number
    if (!ScanService.validatePhoneNumber(formattedPhone)) {
      alert('Please enter a valid Indian mobile number (10 digits starting with 6-9)');
      return;
    }

    setIsInitiatingCall(true);
    try {
      const result = await ScanService.initiateCall(vehicleId, formattedPhone);
      setCallSuccess(true);
      setShowCallForm(false);
      setCallerPhone('');
      
      // Show success message for 5 seconds
      setTimeout(() => setCallSuccess(false), 5000);
    } catch (err: any) {
      alert('Error initiating call: ' + err.message);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  const handleEmergencyAlert = async () => {
    if (!confirm('Are you sure you want to send an emergency alert to the vehicle owner? This should only be used for urgent situations.')) {
      return;
    }

    setIsSendingAlert(true);
    try {
      const result = await ScanService.sendEmergencyAlert(vehicleId);
      setAlertSuccess(true);
      
      // Show success message for 5 seconds
      setTimeout(() => setAlertSuccess(false), 5000);
    } catch (err: any) {
      alert('Error sending emergency alert: ' + err.message);
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" message="Loading vehicle information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Vehicle</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
          <p className="text-gray-600 mb-6">This QR code doesn't seem to be valid.</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Check if vehicle is active
  if (!vehicle.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Inactive</h2>
          <p className="text-gray-600 mb-6">This vehicle is currently inactive and cannot receive calls or alerts.</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Messages */}
        {callSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Call initiated successfully! You should receive a call shortly.
            </div>
          </div>
        )}

        {alertSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Emergency alert sent successfully! The vehicle owner has been notified.
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vehicle: {vehicle.car_number}
          </h1>
          <p className="text-gray-600">
            Need to contact the owner of this vehicle? Choose an option below.
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 mb-8">
          {/* Call Owner Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Owner</h3>
                <p className="text-gray-600 mb-4">
                  Contact the vehicle owner through our secure calling system. Your phone number will not be shared.
                </p>
                
                {!showCallForm ? (
                  <button
                    onClick={() => setShowCallForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Call
                  </button>
                ) : (
                  <form onSubmit={handleInitiateCall} className="space-y-3">
                    <div>
                      <label htmlFor="callerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Phone Number
                      </label>
                      <input
                        id="callerPhone"
                        type="tel"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9557352327 or +919557352327"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your Indian mobile number. We'll call you first, then connect you to the owner.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isInitiatingCall || !callerPhone.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isInitiatingCall ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Initiating...</span>
                          </>
                        ) : (
                          'Initiate Call'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCallForm(false);
                          setCallerPhone('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Alert Card */}
          <div className="bg-white p-6 rounded-lg shadow border-yellow-200 bg-yellow-50">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Alert</h3>
                <p className="text-gray-600 mb-4">
                  For urgent situations only. This will immediately notify the vehicle owner via call and SMS.
                </p>
                <button
                  onClick={handleEmergencyAlert}
                  disabled={isSendingAlert}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSendingAlert ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Sending Alert...</span>
                    </>
                  ) : (
                    'Send Emergency Alert'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-white p-6 rounded-lg shadow bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2zm10-12V6a4 4 0 00-8 0v3h8z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Privacy Protected</h3>
              <p className="text-sm text-blue-700">
                Your privacy is protected. Phone numbers are never shared between parties. 
                All communication goes through our secure system.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
            Learn more about our service
          </Link>
        </div>
      </div>
    </div>
  );
}