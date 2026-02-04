'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VehicleService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';

// Validation schema
const vehicleSchema = z.object({
  car_number: z
    .string()
    .min(3, 'Car number must be at least 3 characters')
    .max(20, 'Car number must not exceed 20 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Car number can only contain letters, numbers, spaces, and hyphens')
    .transform(val => val.toUpperCase().trim()),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function NewVehiclePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const onSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Transform snake_case to camelCase for API
      const vehicleData = {
        carNumber: data.car_number
      };
      const vehicle = await VehicleService.createVehicle(vehicleData);
      // Redirect to vehicle details page
      router.push(`/vehicles/${vehicle.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
                <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
                <p className="text-gray-600">Register your vehicle to get a QR code</p>
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
        <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-6 rounded-lg shadow">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="car_number" className="block text-sm font-medium text-gray-700">
                    Car Number / License Plate
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('car_number')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ABC-1234"
                      autoComplete="off"
                    />
                  </div>
                  {errors.car_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.car_number.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your vehicle's license plate number or any identifier you prefer
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    What happens next?
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• A unique QR code will be generated for your vehicle</li>
                    <li>• You can download and print the QR code</li>
                    <li>• Place the QR code on your vehicle's dashboard or window</li>
                    <li>• Others can scan it to contact you securely</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Creating...</span>
                      </>
                    ) : (
                      'Create Vehicle'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tips for Vehicle Registration
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-2">Use your official license plate number for easy identification</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-2">You can register multiple vehicles with the same account</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-2">Your personal information is never shared with people who scan the code</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}