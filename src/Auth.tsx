import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { validatePassword, getStrengthColor } from './passwordValidator'
import './Auth.css'

interface LoginPageProps {
  onSwitchToSignup: () => void
}

export const LoginPage = ({ onSwitchToSignup }: LoginPageProps) => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed')
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>ClimateWatch</h1>
          <p>Your climate action companion</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?</p>
          <button onClick={onSwitchToSignup} className="link-button">
            Create one now
          </button>
        </div>
      </div>
    </div>
  )
}

interface SignupPageProps {
  onSwitchToLogin: () => void
}

export const SignupPage = ({ onSwitchToLogin }: SignupPageProps) => {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('Manila, Philippines')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password validation
  const passwordValidation = validatePassword(password)
  const passwordValid = passwordValidation.isValid

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!passwordValid) {
      setError('Please fix password errors before signing up')
      return
    }

    setLoading(true)

    const avatar = name.substring(0, 2).toUpperCase()
    const result = await signup(email, password, name, location, avatar)

    if (!result.success) {
      setError(result.error || 'Signup failed')
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>ClimateWatch</h1>
          <p>Join the climate action movement</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option>Manila, Philippines</option>
              <option>Bangkok, Thailand</option>
              <option>Singapore</option>
              <option>Ho Chi Minh City, Vietnam</option>
              <option>Kuala Lumpur, Malaysia</option>
              <option>Jakarta, Indonesia</option>
              <option>Yangon, Myanmar</option>
            </select>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="password-strength-wrapper">
                <div className="password-strength-label">
                  Strength: <span style={{ color: getStrengthColor(passwordValidation.strength) }}>
                    {passwordValidation.strength.toUpperCase()}
                  </span>
                </div>
                <div className="password-strength-bar-container">
                  <div 
                    className="password-strength-bar"
                    style={{
                      width: `${(Object.entries(passwordValidation).filter(([_, v]) => !Array.isArray(v) && _ !== 'strength' && v).length / 2) * 25}%`,
                      backgroundColor: getStrengthColor(passwordValidation.strength),
                    }} 
                  />
                </div>

                {/* Validation errors */}
                {passwordValidation.errors.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {passwordValidation.errors.map((err, idx) => (
                      <div key={idx} className="password-error-item">
                        <span>×</span> {err}
                      </div>
                    ))}
                  </div>
                )}

                {/* Success message */}
                {passwordValid && (
                  <div className="password-success">
                    <span>✓</span> Password meets all requirements!
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || !passwordValid} className="auth-button">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <button onClick={onSwitchToLogin} className="link-button">
            Login here
          </button>
        </div>
      </div>
    </div>
  )
}
