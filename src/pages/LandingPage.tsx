import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function LandingPage() {
  const [selectedProduct, setSelectedProduct] = useState<'online' | 'accountant'>('online')
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const handleContinue = () => {
    navigate('/login', { state: { product: selectedProduct } })
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2CA01C]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#2CA01C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TS</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">TURBO SOFTWARE</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-sm text-gray-700 hover:text-[#2CA01C] transition-colors">For Business</a>
                <a href="#" className="text-sm text-gray-700 hover:text-[#2CA01C] transition-colors">Accountants</a>
                <a href="#" className="text-sm text-gray-700 hover:text-[#2CA01C] transition-colors">Pricing</a>
                <a href="#" className="text-sm text-gray-700 hover:text-[#2CA01C] transition-colors">Learn & Support</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">🇳🇬 EN</span>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Section - Sign In Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-bold text-[#007373] mb-4">Sign in to Turbo Software</h1>
            <p className="text-gray-600 mb-6">Choose your product to sign in:</p>
            
            <div className="space-y-3 mb-6">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProduct === 'online' 
                  ? 'border-[#2CA01C] bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="product"
                  value="online"
                  checked={selectedProduct === 'online'}
                  onChange={() => setSelectedProduct('online')}
                  className="w-5 h-5 text-[#2CA01C] border-gray-300 focus:ring-[#2CA01C] focus:ring-2"
                />
                <span className="ml-3 text-gray-900 font-medium">Turbo Software Online</span>
              </label>
              
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProduct === 'accountant' 
                  ? 'border-[#2CA01C] bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="product"
                  value="accountant"
                  checked={selectedProduct === 'accountant'}
                  onChange={() => setSelectedProduct('accountant')}
                  className="w-5 h-5 text-[#2CA01C] border-gray-300 focus:ring-[#2CA01C] focus:ring-2"
                />
                <span className="ml-3 text-gray-900 font-medium">Turbo Software Accountant</span>
              </label>
            </div>

            <Button
              onClick={handleContinue}
              className="w-full bg-[#2CA01C] hover:bg-[#1e7a0f] text-white font-semibold py-3 text-base shadow-sm"
            >
              Continue to sign in
            </Button>
          </div>
        </div>

        {/* Right Section - Promotional Banner */}
        <div className="flex-1 bg-gradient-to-br from-[#007373] to-[#005a5a] flex items-center justify-center p-8 relative overflow-hidden">
          <div className="max-w-md text-white z-10">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" />
                  <path d="M6 8h8v2H6V8zm0 4h4v2H6v-2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Easily move data between <span className="text-[#2CA01C] font-extrabold">Excel</span> and <span className="text-[#2CA01C] font-extrabold">Turbo Software</span>
            </h2>
            <p className="text-lg mb-6 text-white/90 leading-relaxed">
              Easily and accurately import or export your data from Excel to Turbo Software with our advanced integration tools.
            </p>
            <Button className="bg-[#2CA01C] hover:bg-[#1e7a0f] text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all hover:shadow-xl">
              Get the app
            </Button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32 blur-2xl"></div>
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mt-24 blur-xl"></div>
        </div>
      </div>
    </div>
  )
}

