import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12">
          <div className="text-xl font-bold text-gray-900">
            Sanket
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-primary-600 hover:text-primary-700">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sanket - Masked Calling Parking Alert System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure communication system for vehicle owners and concerned parties. 
            Protect your privacy while staying connected.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              For Vehicle Owners
            </h2>
            <p className="text-gray-600 mb-6">
              Register your vehicle and get a QR code that allows others to contact you 
              without revealing your personal information.
            </p>
            <Link href="/login" className="btn-primary">
              Get Started
            </Link>
          </div>
          
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Need to Contact an Owner?
            </h2>
            <p className="text-gray-600 mb-6">
              Scan a QR code on a vehicle to contact the owner securely through 
              our masked calling system.
            </p>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Scan the QR code on the vehicle or enter the vehicle ID
              </p>
              <Link href="/scan/demo" className="btn-secondary">
                View Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Register Vehicle</h3>
              <p className="text-gray-600">
                Sign up and register your vehicle to get a unique QR code.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Place QR Code</h3>
              <p className="text-gray-600">
                Print and place the QR code on your vehicle's dashboard.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Contact</h3>
              <p className="text-gray-600">
                Others can scan and contact you without seeing your personal info.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mt-16 card bg-primary-50 border-primary-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Privacy First
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your personal information is never shared. All communication goes through 
              our secure masked calling system, protecting both parties' privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}