'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VehicleService, Vehicle } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VehicleDetailsPage() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      setIsLoading(true);
      const vehicleData = await VehicleService.getVehicle(vehicleId);
      setVehicle(vehicleData);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDownloadQR = async () => {
    if (!vehicle?.qrUrl) return;

    try {
      // Add timestamp to prevent caching issues
      const qrUrlWithTimestamp = `${vehicle.qrUrl}?t=${Date.now()}`;
      
      // Fetch the image to handle CORS issues
      const response = await fetch(qrUrlWithTimestamp);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${vehicle.carNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      showNotification('QR code downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = vehicle.qrUrl;
      link.download = `qr-code-${vehicle.carNumber}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('QR code download initiated (fallback method)', 'success');
    }
  };

  const handleRegenerateQR = async () => {
    if (!vehicle) return;

    try {
      setIsRegeneratingQR(true);
      const result = await VehicleService.regenerateQRCode(vehicleId);
      
      // Update the vehicle with the new QR URL
      setVehicle(prev => prev ? { ...prev, qrUrl: result.qrUrl } : null);
      
      // Also refresh the vehicle data to ensure we have the latest info
      await fetchVehicle();
      
      // Show success message
      showNotification('QR code regenerated successfully!', 'success');
    } catch (err: any) {
      showNotification('Error regenerating QR code: ' + err.message, 'error');
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  const handleToggleActive = async () => {
    if (!vehicle) return;

    try {
      const updatedVehicle = await VehicleService.updateVehicle(vehicleId, {
        isActive: !vehicle.isActive,
      });
      setVehicle(updatedVehicle);
      showNotification(
        `Vehicle ${updatedVehicle.isActive ? 'activated' : 'deactivated'} successfully!`, 
        'success'
      );
    } catch (err: any) {
      showNotification('Error updating vehicle: ' + err.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading vehicle..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!vehicle) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
            <p className="text-gray-600 mb-4">The vehicle you're looking for doesn't exist.</p>
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className="inline-flex text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{vehicle.carNumber}</h1>
                <p className="text-gray-600">
                  Vehicle Details • {vehicle.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* QR Code Section */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code</h2>
                
                {vehicle.qrUrl ? (
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img
                        src={`${vehicle.qrUrl}?t=${Date.now()}`}
                        alt={`QR Code for ${vehicle.carNumber}`}
                        className="w-48 h-48 mx-auto"
                        onError={(e) => {
                          // If image fails to load, try without timestamp
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('?t=')) {
                            target.src = vehicle.qrUrl!;
                          }
                        }}
                      />
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={handleDownloadQR}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
                      >
                        Download QR Code
                      </button>
                      <button
                        onClick={() => window.open(vehicle.qrUrl!, '_blank')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors w-full"
                      >
                        View QR Code
                      </button>
                      <button
                        onClick={handleRegenerateQR}
                        disabled={isRegeneratingQR}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRegeneratingQR ? 'Regenerating...' : 'Regenerate QR Code'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">QR code not available</p>
                    <button
                      onClick={handleRegenerateQR}
                      disabled={isRegeneratingQR}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegeneratingQR ? 'Generating...' : 'Generate QR Code'}
                    </button>
                  </div>
                )}
              </div>

              {/* Vehicle Information */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Car Number</dt>
                      <dd className="text-lg font-semibold text-gray-900">{vehicle.carNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vehicle.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={handleToggleActive}
                          className="ml-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          {vehicle.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(vehicle.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(vehicle.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Scan URL */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan URL</h2>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <code className="text-sm text-gray-800 break-all">
                      {VehicleService.getScanPageUrl(vehicle.id)}
                    </code>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    This is the URL people will visit when they scan your QR code.
                  </p>
                </div>

                {/* Actions */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                  <div className="space-y-3">
                    <Link
                      href={`/scan/${vehicle.id}`}
                      className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      target="_blank"
                    >
                      Preview Scan Page
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use Your QR Code</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Download & Print</h3>
                  <p className="text-sm text-gray-600">
                    Download the QR code and print it on a durable material.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Place in Vehicle</h3>
                  <p className="text-sm text-gray-600">
                    Place the QR code on your dashboard or window where it's visible.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Stay Connected</h3>
                  <p className="text-sm text-gray-600">
                    Others can now scan the code to contact you securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}