// Common weak passwords to blacklist
const COMMON_PASSWORDS = [
  'password', 'password123', 'password1234',
  'qwerty', 'qwerty123',
  '123456', '1234567', '12345678', '123456789',
  'abc123', 'abcdefg',
  'letmein', 'welcome', 'admin', 'pass',
]

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
} {
  const errors: string[] = []
  let strengthScore = 0

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  } else if (password.length < 12) {
    strengthScore += 1
  } else {
    strengthScore += 2
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Must include at least one uppercase letter (A-Z)')
  } else {
    strengthScore += 1
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Must include at least one lowercase letter (a-z)')
  } else {
    strengthScore += 1
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Must include at least one number (0-9)')
  } else {
    strengthScore += 1
  }

  // Check for special characters (NOT allowed)
  if (/[^A-Za-z0-9]/.test(password)) {
    errors.push('No special characters or spaces allowed')
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password too common or contains common sequences')
  }

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak'
  if (errors.length === 0) {
    if (strengthScore >= 5) strength = 'strong'
    else if (strengthScore >= 4) strength = 'good'
    else if (strengthScore >= 2) strength = 'fair'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

export function getStrengthColor(strength: string): string {
  switch (strength) {
    case 'strong':
      return '#4caf50'
    case 'good':
      return '#8bc34a'
    case 'fair':
      return '#ffc107'
    case 'weak':
    default:
      return '#f44336'
  }
}
