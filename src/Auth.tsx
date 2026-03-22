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
  const [location, setLocation] = useState('Philippines')
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
              <optgroup label="ASEAN">
                <option>Philippines</option>
                <option>Thailand</option>
                <option>Singapore</option>
                <option>Vietnam</option>
                <option>Malaysia</option>
                <option>Indonesia</option>
                <option>Myanmar</option>
                <option>Cambodia</option>
                <option>Laos</option>
                <option>Brunei</option>
                <option>Timor-Leste</option>
              </optgroup>
              <optgroup label="East Asia">
                <option>Japan</option>
                <option>China</option>
                <option>South Korea</option>
                <option>Taiwan</option>
                <option>Hong Kong</option>
                <option>Mongolia</option>
              </optgroup>
              <optgroup label="South Asia">
                <option>India</option>
                <option>Bangladesh</option>
                <option>Sri Lanka</option>
                <option>Pakistan</option>
                <option>Nepal</option>
                <option>Bhutan</option>
                <option>Maldives</option>
              </optgroup>
              <optgroup label="Middle East">
                <option>United Arab Emirates</option>
                <option>Saudi Arabia</option>
                <option>Qatar</option>
                <option>Kuwait</option>
                <option>Jordan</option>
                <option>Turkey</option>
                <option>Israel</option>
              </optgroup>
              <optgroup label="Oceania">
                <option>Australia</option>
                <option>New Zealand</option>
                <option>Papua New Guinea</option>
                <option>Fiji</option>
              </optgroup>
              <optgroup label="Europe">
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>France</option>
                <option>Spain</option>
                <option>Italy</option>
                <option>Netherlands</option>
                <option>Sweden</option>
                <option>Norway</option>
                <option>Denmark</option>
                <option>Finland</option>
                <option>Switzerland</option>
                <option>Belgium</option>
                <option>Portugal</option>
                <option>Poland</option>
                <option>Austria</option>
                <option>Greece</option>
                <option>Ireland</option>
              </optgroup>
              <optgroup label="Americas">
                <option>United States</option>
                <option>Canada</option>
                <option>Mexico</option>
                <option>Brazil</option>
                <option>Argentina</option>
                <option>Colombia</option>
                <option>Chile</option>
                <option>Peru</option>
              </optgroup>
              <optgroup label="Africa">
                <option>South Africa</option>
                <option>Nigeria</option>
                <option>Kenya</option>
                <option>Ethiopia</option>
                <option>Ghana</option>
                <option>Egypt</option>
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, '').slice(0, 12))}
                maxLength={12}
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
