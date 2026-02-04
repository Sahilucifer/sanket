'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleService, Vehicle } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const vehicleData = await VehicleService.getVehicles();
      setVehicles(vehicleData);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await VehicleService.deleteVehicle(vehicleId);
      // Refresh vehicles list
      await fetchVehicles();
    } catch (err: any) {
      alert('Error deleting vehicle: ' + err.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/vehicles/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Vehicle
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Vehicles Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Vehicles</h2>
                <span className="text-sm text-gray-500">
                  {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" message="Loading vehicles..." />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by registering your first vehicle.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/vehicles/new"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Vehicle
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white p-6 rounded-lg shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vehicle.carNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {vehicle.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/vehicles/${vehicle.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {vehicle.qrUrl && (
                        <div className="mb-4">
                          <img
                            src={vehicle.qrUrl}
                            alt={`QR Code for ${vehicle.carNumber}`}
                            className="w-32 h-32 mx-auto border rounded"
                          />
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        <p>Created: {new Date(vehicle.createdAt).toLocaleDateString()}</p>
                        <p>Updated: {new Date(vehicle.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/vehicles/new"
                    className="block text-blue-600 hover:text-blue-700 text-sm"
                  >
                    → Add New Vehicle
                  </Link>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How It Works
                </h3>
                <p className="text-sm text-gray-600">
                  Register your vehicle, get a QR code, and place it on your car. 
                  Others can scan it to contact you securely.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Privacy Protected
                </h3>
                <p className="text-sm text-gray-600">
                  Your personal information is never shared. All communication 
                  goes through our secure masked calling system.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}