import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toaster'
import { Lock } from 'lucide-react'

export function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // For now, we'll use email for both methods
      const loginEmail = loginMethod === 'email' ? email : phone + '@temp.com'
      await signIn(loginEmail, password)
      toast('Successfully signed in', 'success')
      // Small delay to ensure state updates
      setTimeout(() => {
        navigate('/dashboard')
      }, 100)
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'Failed to sign in'
      toast(errorMessage, 'error')
      
      // If timeout, provide helpful message
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        setTimeout(() => {
          toast('Check your internet connection and try again', 'default')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-[#2CA01C] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">TS</span>
            </div>
            <span className="text-xl font-semibold text-[#0073C5]">TURBO SOFTWARE</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Let's get you in to Turbo Software</h1>
        </div>

        {/* Login Method Toggle */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'email'
                ? 'border-[#2CA01C] text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Email or user ID
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'phone'
                ? 'border-[#2CA01C] text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {loginMethod === 'email' ? (
              <Input
                type="email"
                placeholder="Email or user ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-[#2CA01C] focus:border-[#2CA01C] focus:ring-[#2CA01C]"
              />
            ) : (
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
                className="border-[#2CA01C] focus:border-[#2CA01C] focus:ring-[#2CA01C]"
              />
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="border-[#2CA01C] focus:border-[#2CA01C] focus:ring-[#2CA01C]"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#2CA01C] border-gray-300 rounded focus:ring-[#2CA01C]"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2CA01C] hover:bg-[#1e7a0f] text-white font-semibold py-3 flex items-center justify-center space-x-2 shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
          </Button>

          {/* Legal Text */}
          <p className="text-xs text-gray-600 text-center mt-4">
            By selecting Sign in, you agree to Turbo Software{' '}
            <a href="#" className="text-[#0073C5] hover:underline">Terms</a> and{' '}
            <a href="#" className="text-[#0073C5] hover:underline">Privacy Policy</a>. Our{' '}
            <a href="#" className="text-[#0073C5] hover:underline">Privacy Policy</a> applies to your personal data.
          </p>

          {/* Create Account Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-700">
              New to Turbo Software?{' '}
              <a href="/register" className="text-[#0073C5] hover:underline font-medium">
                Create an account
              </a>
            </p>
          </div>

          {/* reCAPTCHA Notice */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Invisible reCAPTCHA by Google{' '}
            <a href="#" className="text-[#0073C5] hover:underline">Privacy Policy</a> and{' '}
            <a href="#" className="text-[#0073C5] hover:underline">Terms of Use</a>.
          </p>
        </form>
      </div>
    </div>
  )
}


