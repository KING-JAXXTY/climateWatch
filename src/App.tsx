import { useEffect, useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { LoginPage, SignupPage } from './Auth'
import VirtualTree from './VirtualTree'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type Quest = {
  id: string
  emoji: string
  title: string
  description: string
  points: number
  co2Saved: number
  completed: boolean
  verificationType?: 'photo-required' | 'photo-bonus' | 'honor-system'
  bonusPoints?: number
}

type Message = {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: number
}

type FeedItem = {
  id: string
  userId: string
  user: string
  avatar: string
  action: string
  timestamp: Date
  verified: boolean
  points: number
  likes: number
  likedBy: string[]
}

type Ranking = {
  id: string
  name: string
  avatar: string
  location: string
  points: number
  rank: number
  dayStreak: number
  rankPosition: number
}


function App() {
  const { user, token, loading, logout, isAuthenticated, refreshProfile } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')
  const [currentPage, setCurrentPage] = useState<'home' | 'feed' | 'rankings' | 'profile' | 'tree'>('home')
  
  // Quests
  const [quests, setQuests] = useState<Quest[]>([])
  const [questsResetHours, setQuestsResetHours] = useState<number | null>(null)
  const [photoVerifyQuestId, setPhotoVerifyQuestId] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  
  // Feed
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [newFeedAction, setNewFeedAction] = useState('')
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [postFocused, setPostFocused] = useState(false)
  
  // Rankings
  const [rankings, setRankings] = useState<Ranking[]>([])
  
  // Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! Ask me anything about climate action and emissions in ASEAN!',
      sender: 'ai',
      timestamp: Date.now(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [editingProfile, setEditingProfile] = useState(false)
  const [showDevTeam, setShowDevTeam] = useState(false)
  const [showSysInfo, setShowSysInfo] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileLocation, setProfileLocation] = useState(user?.location || '')
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '🌿')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showHonestyPledge, setShowHonestyPledge] = useState(false)
  const [honestyQuestId, setHonestyQuestId] = useState<string | null>(null)

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(user?.email || '')
  const [newPasswordFP, setNewPasswordFP] = useState('')
  const [confirmPasswordFP, setConfirmPasswordFP] = useState('')
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchQuests()
      fetchFeed()
      fetchRankings()
    }
  }, [isAuthenticated, token])

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name)
      setProfileLocation(user.location)
      setProfileAvatar(user.avatar || '🌿')
    }
  }, [user])

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchQuests = async () => {
    try {
      const response = await fetch(`${API_URL}/quests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.waitingForReset) {
          setQuestsResetHours(data.hoursLeft)
          setQuests([])
        } else {
          setQuestsResetHours(null)
          setQuests(data.quests ?? data)
        }
      }
    } catch (error) {
      console.error('Fetch quests error:', error)
    }
  }

  const fetchFeed = async () => {
    try {
      const response = await fetch(`${API_URL}/feed`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (response.ok) {
        const data = await response.json()
        setFeedItems(data)
        // Seed liked state from server — posts where current user is in likedBy
        const alreadyLiked = new Set<string>(
          data.filter((p: any) => Array.isArray(p.likedBy) && p.likedBy.includes(user?.id)).map((p: any) => p.id as string)
        )
        setLikedItems(alreadyLiked)
      }
    } catch (error) {
      console.error('Fetch feed error:', error)
    }
  }

  const fetchRankings = async () => {
    try {
      const response = await fetch(`${API_URL}/rankings`)
      if (response.ok) {
        const data = await response.json()
        setRankings(data)
      }
    } catch (error) {
      console.error('Fetch rankings error:', error)
    }
  }

  const completeQuest = async (questId: string) => {
    try {
      const response = await fetch(`${API_URL}/quests/${questId}/complete`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        fetchQuests()
        fetchRankings() // Auto-update rankings when quest is completed
        refreshProfile() // Refresh user profile to show updated points/level
      }
    } catch (error) {
      console.error('Complete quest error:', error)
    }
  }

  const handleHonorSystemComplete = (questId: string) => {
    setHonestyQuestId(questId)
    setShowHonestyPledge(true)
  }

  const confirmHonestyPledge = () => {
    if (honestyQuestId) {
      completeQuest(honestyQuestId)
      setShowHonestyPledge(false)
      setHonestyQuestId(null)
    }
  }

  const completeQuestWithPhoto = async (questId: string, photoBase64: string) => {
    setVerifying(true)
    setVerificationMessage('Verifying your photo...')
    try {
      const response = await fetch(`${API_URL}/quests/${questId}/complete`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64: photoBase64 }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const bonusMsg = data.bonusPointsEarned ? ` +${data.bonusPointsEarned} bonus points!` : ''
        setVerificationMessage(`✅ Verified! ${data.verificationReason}${bonusMsg}`)
        setTimeout(() => {
          setPhotoVerifyQuestId(null)
          setSelectedPhoto(null)
          setVerificationMessage('')
          fetchQuests()
          fetchRankings()
          refreshProfile()
        }, 2000)
      } else {
        setVerificationMessage(`❌ ${data.error}: ${data.reason || 'Please try again with a clearer photo'}`)
        // Clear the rejected photo so user can retry with a different image
        setSelectedPhoto(null)
      }
    } catch (error) {
      console.error('Complete quest with photo error:', error)
      setVerificationMessage('❌ Error verifying photo. Please try again.')
      // Clear the photo on error so user can retry
      setSelectedPhoto(null)
    } finally {
      setVerifying(false)
    }
  }

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      // Compress and convert image to JPEG for consistent format
      const compressedBase64 = await compressImage(file)
      setSelectedPhoto(compressedBase64)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image. Please try another photo.')
    }
  }

  // Compress image to reduce size and ensure JPEG format
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Create canvas to compress image
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Resize if too large (max 1920px on longest side)
          const maxSize = 1920
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize
              width = maxSize
            } else {
              width = (width / height) * maxSize
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to JPEG with 85% quality
          const base64 = canvas.toDataURL('image/jpeg', 0.85)
          const base64Data = base64.split(',')[1] // Remove data:image/jpeg;base64, prefix
          resolve(base64Data)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const deleteQuest = async (questId: string) => {
    // Warn user about daily quest limits
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this quest?\n\n' +
      'Note: You can only get new quests once per day (resets every 24 hours).\n' +
      'Deleting quests won\'t give you new ones immediately!'
    )
    
    if (!confirmDelete) return
    
    try {
      const response = await fetch(`${API_URL}/quests/${questId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        console.log('Quest deleted successfully')
        fetchQuests()
      } else {
        const error = await response.text()
        console.error('Delete quest error:', response.status, error)
      }
    } catch (error) {
      console.error('Delete quest error:', error)
    }
  }

  const createFeedPost = async () => {
    if (!newFeedAction.trim()) return

    try {
      const response = await fetch(`${API_URL}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: newFeedAction }),
      })
      if (response.ok) {
        setNewFeedAction('')
        fetchFeed()
      }
    } catch (error) {
      console.error('Create feed error:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userQuestion = chatInput
    setChatInput('')
    setAiLoading(true)

    try {
      const response = await fetch(`${API_URL}/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: userQuestion }),
      })

      if (!response.ok) {
        throw new Error('AI assistant unavailable')
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || 'Sorry, I couldn\'t process that. Try asking about climate actions!',
        sender: 'ai',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('AI error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting. Please try again!',
        sender: 'ai',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setAiLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: profileName, location: profileLocation, avatar: profileAvatar }),
      })
      if (response.ok) {
        setEditingProfile(false)
        await refreshProfile()
        fetchRankings()
        fetchFeed()
      }
    } catch (error) {
      console.error('Update profile error:', error)
    }
  }

  const handleForgotPassword = async () => {
    if (!newPasswordFP || !confirmPasswordFP) {
      setForgotPasswordMessage('All fields are required')
      return
    }

    if (newPasswordFP !== confirmPasswordFP) {
      setForgotPasswordMessage('Passwords do not match')
      return
    }

    if (newPasswordFP.length < 6) {
      setForgotPasswordMessage('Password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch(`${API_URL}/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          newPassword: newPasswordFP,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordMessage('Password updated successfully! Please log in again.')
        setTimeout(() => {
          logout()
          setShowForgotPassword(false)
        }, 2000)
      } else {
        setForgotPasswordMessage(`${data.error}`)
      }
    } catch (error) {
      setForgotPasswordMessage('Error updating password')
      console.error('Forgot password error:', error)
    }
  }

  const deleteAccount = async () => {
    try {
      const response = await fetch(`${API_URL}/user/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        logout()
      }
    } catch (error) {
      console.error('Delete account error:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F0F7F4' }}>
        <div style={{ fontSize: '2rem' }}>Loading...</div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
    } else {
      return <SignupPage onSwitchToLogin={() => setAuthView('login')} />
    }
  }

  // Authenticated - show main app
  const completedQuests = quests.filter((q) => q.completed).length
  const totalCO2 = quests.reduce((sum, q) => (q.completed ? sum + q.co2Saved : sum), 0)
  const potentialCO2 = quests.reduce((sum, q) => (!q.completed ? sum + (q.co2Saved || 0) : sum), 0)

  return (
    <div className="page active">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="app-name" onClick={() => window.location.reload()} title="Refresh">ClimateWatch <span>ASEAN</span></div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="topbar-username">{user?.name.split(' ')[0]}</div>
          <button
            onClick={logout}
            className="logout-circle"
            title="Logout"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* SCROLL AREA */}
      <div className="scroll-area">
        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div>
            <div className="greeting">
              <p>Let's make today count for the planet</p>
            </div>

            {/* AI ASSISTANT PANEL */}
            <div className="ai-panel">
              <div className="ai-panel-label">
                <div className="ai-logo-mark">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="aiGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    {/* Outer ring */}
                    <circle cx="22" cy="22" r="20" fill="url(#aiGrad)" opacity="0.12" />
                    <circle cx="22" cy="22" r="20" stroke="url(#aiGrad)" strokeWidth="1.5" fill="none" />
                    {/* Leaf shape */}
                    <path d="M22 10 C30 10 34 16 34 22 C34 28 30 34 22 34 C22 34 10 28 10 22 C10 16 14 10 22 10 Z" fill="url(#aiGrad)" opacity="0.18" />
                    <path d="M22 10 C30 10 34 16 34 22" stroke="url(#aiGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" filter="url(#glow)" />
                    <path d="M22 34 C14 34 10 28 10 22" stroke="url(#aiGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    {/* Center stem */}
                    <line x1="22" y1="12" x2="22" y2="32" stroke="url(#aiGrad)" strokeWidth="1.4" strokeLinecap="round" />
                    {/* Circuit nodes */}
                    <circle cx="22" cy="22" r="3" fill="url(#aiGrad)" filter="url(#glow)" />
                    <circle cx="22" cy="15" r="1.5" fill="#06b6d4" opacity="0.8" />
                    <circle cx="22" cy="29" r="1.5" fill="#22c55e" opacity="0.8" />
                    {/* Side branches */}
                    <line x1="22" y1="19" x2="28" y2="17" stroke="url(#aiGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                    <line x1="22" y1="22" x2="29" y2="22" stroke="url(#aiGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                    <line x1="22" y1="25" x2="27" y2="27" stroke="url(#aiGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                    <line x1="22" y1="19" x2="16" y2="17" stroke="url(#aiGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                    <line x1="22" y1="25" x2="17" y2="27" stroke="url(#aiGrad)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                    {/* Branch dots */}
                    <circle cx="28" cy="17" r="1.2" fill="#06b6d4" opacity="0.7" />
                    <circle cx="29" cy="22" r="1.2" fill="#10b981" opacity="0.7" />
                    <circle cx="27" cy="27" r="1.2" fill="#22c55e" opacity="0.7" />
                  </svg>
                </div>
                <div className="ai-panel-text">
                  <span className="ai-title">ClimaAi</span>
                  <span className="ai-subtitle">Ask about ASEAN emissions & climate actions</span>
                </div>
              </div>
              
              {messages.length > 0 && (
                <div className="ai-messages-compact">
                  {messages.slice(-3).map((msg) => (
                    <div key={msg.id} className={`ai-msg ${msg.sender}`}>
                      {msg.sender === 'ai' ? (
                        <div className="ai-msg-label ai-chip">
                          <svg width="18" height="18" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="chipGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                              </linearGradient>
                            </defs>
                            <circle cx="22" cy="22" r="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
                            <path d="M22 10 C30 10 34 16 34 22 C34 28 30 34 22 34 C22 34 10 28 10 22 C10 16 14 10 22 10 Z" fill="rgba(255,255,255,0.15)" />
                            <line x1="22" y1="12" x2="22" y2="32" stroke="url(#chipGrad)" strokeWidth="1.4" strokeLinecap="round" />
                            <circle cx="22" cy="22" r="3" fill="white" />
                            <circle cx="22" cy="15" r="1.5" fill="white" opacity="0.8" />
                            <circle cx="22" cy="29" r="1.5" fill="white" opacity="0.8" />
                            <line x1="22" y1="19" x2="28" y2="17" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                            <line x1="22" y1="22" x2="29" y2="22" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                            <line x1="22" y1="25" x2="27" y2="27" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                          </svg>
                        </div>
                      ) : (
                        <span className="ai-msg-label user-chip">You</span>
                      )}
                      <div className="ai-msg-text">{msg.text}</div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-msg ai">
                      <div className="ai-msg-label ai-chip">
                        <svg width="18" height="18" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="22" cy="22" r="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
                          <path d="M22 10 C30 10 34 16 34 22 C34 28 30 34 22 34 C22 34 10 28 10 22 C10 16 14 10 22 10 Z" fill="rgba(255,255,255,0.15)" />
                          <line x1="22" y1="12" x2="22" y2="32" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                          <circle cx="22" cy="22" r="3" fill="white" />
                          <circle cx="22" cy="15" r="1.5" fill="white" opacity="0.8" />
                          <circle cx="22" cy="29" r="1.5" fill="white" opacity="0.8" />
                          <line x1="22" y1="19" x2="28" y2="17" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                          <line x1="22" y1="22" x2="29" y2="22" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                          <line x1="22" y1="25" x2="27" y2="27" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
                        </svg>
                      </div>
                      <div className="ai-msg-text">
                        <div className="typing">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="ai-input-bar">
                <input
                  className="ai-input"
                  placeholder="Ask me anything about climate action..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !aiLoading && handleSendMessage()}
                />
                <button 
                  className="ai-send-btn" 
                  onClick={handleSendMessage} 
                  disabled={aiLoading || !chatInput.trim()}
                >
                  {aiLoading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="score-row">
              <div className="score-pill" style={{ animationDelay: '0.1s' }}>
                <div className="num">{user?.points || 0}</div>
                <div className="lbl">Eco Points</div>
              </div>
              <div className="score-pill" style={{ animationDelay: '0.2s' }}>
                <div className="num">{user?.dayStreak || 0}</div>
                <div className="lbl">Day Streak</div>
              </div>
              <div className="score-pill" style={{ animationDelay: '0.3s' }}>
                <div className="num">{(user?.points || 0) > 0 ? `#${user?.rank || '-'}` : 'Unranked'}</div>
                <div className="lbl">ASEAN Rank</div>
              </div>
              <div className="score-pill" style={{ animationDelay: '0.4s' }}>
                <div className="num">{totalCO2.toFixed(1)}</div>
                <div className="lbl">kg CO₂ Today</div>
              </div>
              <div className="score-pill" style={{ animationDelay: '0.5s' }}>
                <div className="num">{completedQuests}</div>
                <div className="lbl">Quests Done</div>
              </div>
            </div>

            <div className="content">

              <div style={{ marginTop: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div className="section-title">Daily Quests</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(240, 253, 244, 0.35)', fontStyle: 'italic' }}>Resets daily</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {quests.length === 0 ? (
                    <div style={{ 
                      padding: '24px', 
                      textAlign: 'center', 
                      background: questsResetHours ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1))' : 'rgba(14, 35, 20, 0.6)', 
                      borderRadius: '12px',
                      color: questsResetHours ? '#fcd34d' : 'rgba(240, 253, 244, 0.45)',
                      border: questsResetHours ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(52, 211, 153, 0.1)'
                    }}>
                      {questsResetHours ? (
                        <>
                          <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>⏳</div>
                          <div style={{ fontWeight: 700 }}>New quests in ~{questsResetHours}h</div>
                          <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>Daily quests refresh every 24 hours. Come back soon!</div>
                        </>
                      ) : (
                        <>
                          <div>Loading your daily quests...</div>
                          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>New quests generate automatically!</div>
                        </>
                      )}
                    </div>
                  ) : (
                    quests.slice(0, 5).map((quest, index) => (
                      <div 
                        key={quest.id} 
                        className={`quest-card ${quest.completed ? 'done' : ''}`}
                        style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                      >
                      <div className="quest-top">
                        <div className="quest-emoji">{quest.emoji}</div>
                        <div className="quest-info">
                          <div className="quest-name">{quest.title}</div>
                          <div className="quest-pts">+{quest.points} pts</div>
                        </div>
                        <div className={`quest-circle ${quest.completed ? 'done' : ''}`}>
                          {quest.completed ? '✔' : ''}
                        </div>
                      </div>
                      {/* Photo Upload Section */}
                      {photoVerifyQuestId === quest.id && !quest.completed ? (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginTop: '8px' }}>
                          {selectedPhoto ? (
                            <div>
                              <img 
                                src={`data:image/jpeg;base64,${selectedPhoto}`} 
                                alt="Proof" 
                                style={{ 
                                  width: '100%', 
                                  maxHeight: '200px', 
                                  objectFit: 'contain',
                                  borderRadius: '8px',
                                  marginBottom: '12px'
                                }} 
                              />
                              {verificationMessage && (
                                <div style={{
                                  padding: '8px 12px',
                                  background: verificationMessage.includes('✅') ? '#d1fae5' : '#fee2e2',
                                  color: verificationMessage.includes('✅') ? '#065f46' : '#991b1b',
                                  borderRadius: '6px',
                                  marginBottom: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  {verificationMessage}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setPhotoVerifyQuestId(null)
                                    setSelectedPhoto(null)
                                    setVerificationMessage('')
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: 'rgba(240, 253, 244, 0.08)',
                                    color: 'rgba(240, 253, 244, 0.65)',
                                    border: '1px solid rgba(240, 253, 244, 0.12)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => completeQuestWithPhoto(quest.id, selectedPhoto)}
                                  disabled={verifying}
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: verifying ? '#cbd5e1' : 'linear-gradient(135deg, #06b6d4, #10b981)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: verifying ? 'not-allowed' : 'pointer',
                                    fontWeight: '700'
                                  }}
                                >
                                  {verifying ? 'Verifying...' : 'Verify & Complete'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ 
                                padding: '24px',
                                background: 'rgba(14, 35, 20, 0.95)',
                                borderRadius: '8px',
                                border: '2px dashed rgba(52, 211, 153, 0.3)',
                                textAlign: 'center',
                                color: 'rgba(240, 253, 244, 0.45)',
                                marginBottom: '12px'
                              }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
                                <div style={{ fontSize: '0.85rem' }}>Take or choose a photo</div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <label style={{ flex: 1 }}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handlePhotoSelect}
                                    style={{ display: 'none' }}
                                  />
                                  <div style={{
                                    padding: '10px',
                                    background: '#06b6d4',
                                    color: 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                  }}>
                                    📷 Take Photo
                                  </div>
                                </label>
                                <label style={{ flex: 1 }}>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                                    onChange={handlePhotoSelect}
                                    style={{ display: 'none' }}
                                  />
                                  <div style={{
                                    padding: '10px',
                                    background: '#10b981',
                                    color: 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                  }}>
                                    🖼️ Choose File
                                  </div>
                                </label>
                              </div>
                              <button
                                onClick={() => setPhotoVerifyQuestId(null)}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  background: 'rgba(240, 253, 244, 0.08)',
                                  color: 'rgba(240, 253, 244, 0.65)',
                                  border: '1px solid rgba(240, 253, 244, 0.12)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', padding: '10px', justifyContent: 'flex-end' }}>
                          {!quest.completed ? (
                            <>
                              {quest.verificationType === 'photo-required' ? (
                                // Photo Required - Only photo upload option
                                <button
                                  onClick={() => {
                                    setPhotoVerifyQuestId(quest.id)
                                    // Clear any previous photo/message when opening new quest
                                    setSelectedPhoto(null)
                                    setVerificationMessage('')
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                  }}
                                >
                                  Upload Proof (Required)
                                </button>
                              ) : quest.verificationType === 'photo-bonus' ? (
                                // Photo Bonus - Both options
                                <>
                                  <button
                                    onClick={() => {
                                      setPhotoVerifyQuestId(quest.id)
                                      // Clear any previous photo/message when opening new quest
                                      setSelectedPhoto(null)
                                      setVerificationMessage('')
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    ⭐ Photo (+{quest.bonusPoints || 10} Bonus)
                                  </button>
                                  <button
                                    onClick={() => completeQuest(quest.id)}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    Complete
                                  </button>
                                </>
                              ) : (
                                // Honor System - Just complete button
                                <button
                                  onClick={() => handleHonorSystemComplete(quest.id)}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                  }}
                                >
                                  Mark Complete
                                </button>
                              )}
                              <button
                                onClick={() => deleteQuest(quest.id)}
                                style={{
                                  padding: '8px 12px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#fca5a5',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => completeQuest(quest.id)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Completed
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                  )}
                </div>
              </div>

              <div className="impact-banner" style={{ animationDelay: '0.6s', marginTop: '24px' }}>
                <div className="big">{potentialCO2.toFixed(1)} kg</div>
                <div className="desc">CO₂ Still Available to Save Today</div>
                <div className="equiv">
                  {potentialCO2 > 0 
                    ? `Complete your remaining quests! If you do them daily, you'll save ${(potentialCO2 * 7).toFixed(1)}kg/week - equal to planting ${Math.max(1, Math.round((potentialCO2 * 7) / 20))} trees!`
                    : 'All quests completed! Great job!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEED PAGE */}
        {currentPage === 'feed' && (
          <div className="feed-page">
            {/* FEED HEADER */}
            <div className="feed-header">
              <div className="feed-header-top">
                <div className="feed-header-title">Community Feed</div>
                <div className="feed-header-badge">
                  <span className="feed-live-dot"></span>
                  Live
                </div>
              </div>
              <div className="feed-header-sub">
                {feedItems.length} climate actions shared by your community
              </div>
            </div>

            {/* SCROLLABLE MESSAGES AREA */}
            <div className="feed-scroll">
              {feedItems.length === 0 ? (
                <div className="feed-empty">
                  <div className="feed-empty-icon">🌍</div>
                  <div className="feed-empty-title">No actions yet</div>
                  <div className="feed-empty-sub">Be the first to share a climate action!</div>
                </div>
              ) : (
                <div className="feed-list">
                  {feedItems.map((item, index) => {
                    const isLiked = likedItems.has(item.id)
                    const isOwn = item.userId === user?.id
                    const timeAgo = (() => {
                      const diff = Date.now() - new Date(item.timestamp).getTime()
                      const mins = Math.floor(diff / 60000)
                      if (mins < 1) return 'just now'
                      if (mins < 60) return `${mins}m ago`
                      const hrs = Math.floor(mins / 60)
                      if (hrs < 24) return `${hrs}h ago`
                      return `${Math.floor(hrs / 24)}d ago`
                    })()
                    return (
                      <div key={item.id} className={`feed-card-v2 ${isOwn ? 'own-message' : ''}`} style={{ animationDelay: `${index * 0.06}s` }}>
                        <div className="feed-card-left">
                          <div
                            className="feed-card-avatar"
                            style={{ background: isOwn
                              ? 'linear-gradient(135deg, #059669, #10b981)'
                              : 'linear-gradient(135deg, #06b6d4, #10b981)'
                            }}
                          >
                            {item.avatar}
                          </div>
                          {!isOwn && <div className="feed-card-line"></div>}
                        </div>
                        <div className="feed-card-body">
                          <div className="feed-card-header">
                            <div className="feed-card-user">
                              {isOwn ? 'You' : item.user}
                              {item.verified && (
                                <span className="feed-verified-badge">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="feed-card-time">{timeAgo}</div>
                          </div>
                          <div className="feed-card-action">{item.action}</div>
                          <div className="feed-card-footer">
                            <button
                              className={`feed-like-btn ${isLiked ? 'liked' : ''}`}
                              onClick={async () => {
                                const currentlyLiked = likedItems.has(item.id)
                                const nowLiked = !currentlyLiked
                                // Optimistic update
                                setLikedItems(prev => {
                                  const next = new Set(prev)
                                  nowLiked ? next.add(item.id) : next.delete(item.id)
                                  return next
                                })
                                setFeedItems(prev => prev.map(p =>
                                  p.id === item.id ? { ...p, likes: (p.likes || 0) + (nowLiked ? 1 : -1) } : p
                                ))
                                // Persist to server
                                try {
                                  const res = await fetch(`${API_URL}/feed/${item.id}/like`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                  })
                                  if (res.ok) {
                                    const data = await res.json()
                                    // Reconcile with real server count
                                    setFeedItems(prev => prev.map(p =>
                                      p.id === item.id ? { ...p, likes: data.likes } : p
                                    ))
                                  }
                                } catch (e) {
                                  // Revert on failure
                                  setLikedItems(prev => {
                                    const next = new Set(prev)
                                    nowLiked ? next.delete(item.id) : next.add(item.id)
                                    return next
                                  })
                                  setFeedItems(prev => prev.map(p =>
                                    p.id === item.id ? { ...p, likes: (p.likes || 0) + (nowLiked ? -1 : 1) } : p
                                  ))
                                }
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                              </svg>
                              {item.likes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* FIXED COMPOSER — always visible above bottom nav */}
            <div className={`feed-composer ${postFocused ? 'focused' : ''}`}>
              <div className="feed-composer-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)' }}>
                {user?.avatar}
              </div>
              <textarea
                className="feed-composer-input"
                placeholder="Share a climate action…"
                value={newFeedAction}
                onChange={(e) => setNewFeedAction(e.target.value)}
                onFocus={() => setPostFocused(true)}
                onBlur={() => setPostFocused(false)}
                rows={1}
              />
              <button
                className={`feed-post-btn ${newFeedAction.trim() ? 'active' : ''}`}
                onClick={createFeedPost}
                disabled={!newFeedAction.trim()}
                title="Post"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        )}


        {/* RANKINGS PAGE */}
        {currentPage === 'rankings' && (
          <div>
            <div className="topbar" style={{ background: 'transparent', padding: '16px 20px' }}>
              <div className="topbar-title">Rankings</div>
            </div>

            <div className="content">
              {/* Your position card */}
              {user && rankings.some(r => r.id === user.id) && (() => {
                const myEntry = rankings.find(r => r.id === user.id)!
                return (
                  <div className="lb-my-rank-card">
                    <div className="lb-my-rank-avatar-wrap">
                      <div className="lb-my-rank-avatar">
                        {user.avatar || user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="lb-my-rank-badge">
                        {myEntry.rankPosition === 1 ? '🥇' : myEntry.rankPosition === 2 ? '🥈' : myEntry.rankPosition === 3 ? '🥉' : `#${myEntry.rankPosition}`}
                      </div>
                    </div>
                    <div className="lb-my-rank-info">
                      <div className="lb-my-rank-label">Your Position</div>
                      <div className="lb-my-rank-name">{user.name}</div>
                      {user.location && <div className="lb-my-rank-loc">{user.location}</div>}
                    </div>
                    <div className="lb-my-rank-right">
                      <div className="lb-my-rank-pos">#{myEntry.rankPosition}</div>
                      <div className="lb-my-rank-pts">{user.points.toLocaleString()} pts</div>
                      {(user.dayStreak ?? 0) > 0 && (
                        <div className="lb-my-rank-streak">🔥 {user.dayStreak}d streak</div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div className="section-title">Global Leaderboard</div>

              {rankings.length === 0 ? (
                <div className="lb-empty">
                  <div className="lb-empty-icon">🏆</div>
                  <div className="lb-empty-text">No rankings yet</div>
                  <div className="lb-empty-sub">Complete quests to earn points and appear here</div>
                </div>
              ) : (
                <div className="lb-card">
                  {rankings.slice(0, 20).map((rank, index) => (
                    <div
                      key={rank.id}
                      className={`lb-row${rank.id === user?.id ? ' me' : ''}${index < 3 ? ` top${index + 1}` : ''}`}
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <div className={`lb-rank${index === 0 ? ' gold' : index === 1 ? ' silver' : index === 2 ? ' bronze' : ''}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${rank.rankPosition}`}
                      </div>
                      <div
                        className="feed-avatar"
                        style={{
                          background:
                            index === 0 ? 'linear-gradient(135deg, #92670a, #f5c518)' :
                            index === 1 ? 'linear-gradient(135deg, #555, #a0a0a0)' :
                            index === 2 ? 'linear-gradient(135deg, #7a3b10, #c07838)' :
                            '#1A7A4A',
                          width: '36px', height: '36px', fontSize: '0.78rem', flexShrink: 0,
                        }}
                      >
                        {rank.avatar}
                      </div>
                      <div className="lb-name">
                        <div className="lb-name-row">
                          {rank.name}
                          {rank.id === user?.id && <span className="lb-you-badge">You</span>}
                        </div>
                        <div className="lb-sub">{rank.location}</div>
                      </div>
                      {rank.dayStreak > 0 && (
                        <div className="lb-streak">🔥{rank.dayStreak}</div>
                      )}
                      <div className="lb-pts">{rank.points.toLocaleString()}<span className="lb-pts-label"> pts</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE PAGE */}
        {currentPage === 'profile' && (
          <div>
            <div className="profile-hero">
              <div className="profile-pic">{user?.avatar}</div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-loc">{user?.location}</div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="pnum">{user?.points || 0}</div>
                  <div className="plbl">Eco Points</div>
                </div>
                <div className="profile-stat">
                  <div className="pnum">{user?.dayStreak || 0}</div>
                  <div className="plbl">Day Streak</div>
                </div>
                <div className="profile-stat">
                  <div className="pnum">#{user?.rank || 0}</div>
                  <div className="plbl">Rank</div>
                </div>
              </div>
            </div>

            <div className="content">
              {!editingProfile ? (
                <>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="prof-edit-btn"
                  >
                    Edit Profile
                  </button>

                  <div className="section-title">About</div>

                  {/* Single combined about card */}
                  <div className="about-card">

                    {/* ClimateWatch accordion */}
                    <button
                      className="about-dev-toggle"
                      onClick={() => setShowSysInfo(p => !p)}
                    >
                      <div className="about-dev-toggle-left">
                        <div>
                          <div className="about-system-name">ClimateWatch</div>
                          <div className="about-system-tagline">Your Climate Action Companion</div>
                        </div>
                      </div>
                      <div className={`about-dev-chevron${showSysInfo ? ' open' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </button>

                    {showSysInfo && (
                      <div className="about-sys-body">
                        <p className="about-system-desc">
                          ClimateWatch is a gamified climate action platform designed to inspire everyday people to take
                          meaningful steps toward a greener future. By turning eco-friendly habits into quests, points,
                          and achievements, it makes sustainability engaging, measurable, and rewarding.
                        </p>
                        <div className="about-features">
                          <div className="about-feature-item">
                            <span>🎯</span>
                            <div>
                              <div className="about-feature-title">Daily Eco Quests</div>
                              <div className="about-feature-sub">AI-generated tasks tailored to your location and level</div>
                            </div>
                          </div>
                          <div className="about-feature-item">
                            <span>🌱</span>
                            <div>
                              <div className="about-feature-title">Virtual Tree & Carbon Tracker</div>
                              <div className="about-feature-sub">See your real environmental impact grow over time</div>
                            </div>
                          </div>
                          <div className="about-feature-item">
                            <span>🏆</span>
                            <div>
                              <div className="about-feature-title">Global Leaderboard</div>
                              <div className="about-feature-sub">Compete and inspire others across the ASEAN region</div>
                            </div>
                          </div>
                          <div className="about-feature-item">
                            <span>🤝</span>
                            <div>
                              <div className="about-feature-title">Community Feed</div>
                              <div className="about-feature-sub">Share your actions and motivate your community</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="about-divider" />

                    {/* Developers accordion */}
                    <button
                      className="about-dev-toggle"
                      onClick={() => setShowDevTeam(p => !p)}
                    >
                      <div className="about-dev-toggle-left">
                        <div>
                          <div className="about-dev-title">The Developers</div>
                          <div className="about-dev-uni">Mariano Marcos State University · Philippines</div>
                        </div>
                      </div>
                      <div className={`about-dev-chevron${showDevTeam ? ' open' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </button>

                    {showDevTeam && (
                      <div className="about-dev-list">
                        <div className="about-dev-item">
                          <div className="about-dev-avatar">AC</div>
                          <div className="about-dev-name">Andrew Duldulao Caditan</div>
                        </div>
                        <div className="about-dev-item">
                          <div className="about-dev-avatar">CD</div>
                          <div className="about-dev-name">Camille Ira Dela Cruz</div>
                        </div>
                        <div className="about-dev-item">
                          <div className="about-dev-avatar">HD</div>
                          <div className="about-dev-name">Hanni Marie Dadia</div>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="section-title" style={{ marginTop: '24px' }}>Account Settings</div>
                </>
              ) : (
                <>
                  <div className="prof-edit-form">
                    <label className="prof-form-label">Avatar</label>
                    <div className="avatar-picker">
                      {['🌿','🦋','🌊','🐢','🌳','🦁','🐬','🌸','🦅','🌺','🍃','🦜','🌏','🌱','🐘','🦩','⚡','🔥','❄️','🌙'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className={`avatar-option${profileAvatar === emoji ? ' selected' : ''}`}
                          onClick={() => setProfileAvatar(emoji)}
                        >{emoji}</button>
                      ))}
                    </div>
                    <label className="prof-form-label">Name</label>
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="prof-form-input"
                    />
                    <label className="prof-form-label">Location</label>
                    <select
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      className="prof-form-input"
                    >
                      <option>Manila, Philippines</option>
                      <option>Bangkok, Thailand</option>
                      <option>Singapore</option>
                      <option>Ho Chi Minh City, Vietnam</option>
                      <option>Kuala Lumpur, Malaysia</option>
                      <option>Jakarta, Indonesia</option>
                      <option>Yangon, Myanmar</option>
                    </select>
                    <div className="prof-form-row">
                      <button onClick={updateProfile} className="prof-save-btn">Save</button>
                      <button onClick={() => setEditingProfile(false)} className="prof-cancel-btn">Cancel</button>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowForgotPassword(true)}
                className="prof-action-btn"
              >
                Change Password
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="prof-danger-btn"
              >
                Delete Account
              </button>

              {/* Version Info */}
              <div style={{
                textAlign: 'center',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(52, 211, 153, 0.1)',
                color: 'rgba(240, 253, 244, 0.25)',
                fontSize: '0.75rem',
                fontWeight: '400'
              }}>
                Version 123.2
              </div>

            </div>
          </div>
        )}

        {/* CHANGE PASSWORD MODAL — fixed top overlay */}
        {showForgotPassword && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box" style={{ maxWidth: '400px' }}>
              <div className="delete-confirm-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>🔑</div>
              <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: '700', 
                color: 'rgba(240, 253, 244, 0.95)', 
                marginBottom: '16px',
                textAlign: 'center'
              }}>Change Password</h3>
              <div className="prof-edit-form">
                <label className="prof-form-label">Email</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="prof-form-input"
                />
                <label className="prof-form-label">New Password</label>
                <input
                  type="password"
                  value={newPasswordFP}
                  onChange={(e) => setNewPasswordFP(e.target.value)}
                  className="prof-form-input"
                />
                <label className="prof-form-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPasswordFP}
                  onChange={(e) => setConfirmPasswordFP(e.target.value)}
                  className="prof-form-input"
                />
              </div>
              {forgotPasswordMessage && (
                <p className="prof-success-msg" style={{ marginTop: '12px', textAlign: 'center' }}>{forgotPasswordMessage}</p>
              )}
              <div className="delete-confirm-actions" style={{ marginTop: '20px' }}>
                <button onClick={handleForgotPassword} className="prof-save-btn" style={{ flex: 1 }}>
                  Update Password
                </button>
                <button
                  onClick={() => { 
                    setShowForgotPassword(false); 
                    setForgotPasswordMessage(''); 
                    setNewPasswordFP(''); 
                    setConfirmPasswordFP('');
                    setForgotPasswordEmail(user?.email || '');
                  }}
                  className="prof-cancel-btn"
                  style={{ flex: 1 }}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM — fixed top overlay */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box">
              <div className="delete-confirm-icon">⚠️</div>
              <p className="delete-confirm-msg">Are you sure? This <strong>cannot be undone</strong>.</p>
              <div className="delete-confirm-actions">
                <button onClick={deleteAccount} className="prof-confirm-delete-btn">Yes, Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="prof-cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* HONESTY PLEDGE — fixed top overlay */}
        {showHonestyPledge && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box" style={{ maxWidth: '420px' }}>
              <div className="delete-confirm-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>🌱</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'rgba(240, 253, 244, 0.95)', 
                marginBottom: '12px',
                textAlign: 'center'
              }}>Honesty Pledge</h3>
              <p className="delete-confirm-msg" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                Did you truly complete this quest?
              </p>
              <p style={{ 
                fontSize: '0.85rem', 
                color: 'rgba(240, 253, 244, 0.65)', 
                textAlign: 'center',
                lineHeight: '1.5',
                marginTop: '12px'
              }}>
                ClimateWatch works on trust. Your honesty helps build a genuine community committed to real climate action.
              </p>
              <div className="delete-confirm-actions" style={{ marginTop: '20px' }}>
                <button onClick={confirmHonestyPledge} className="prof-save-btn" style={{ flex: 1 }}>Yes, I Completed It</button>
                <button onClick={() => { setShowHonestyPledge(false); setHonestyQuestId(null); }} className="prof-cancel-btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* VIRTUAL TREE PAGE */}
        {currentPage === 'tree' && <VirtualTree />}
      </div>

      {/* BOTTOM NAV */
      <div className="bottom-nav">
        {(['home', 'feed', 'tree', 'rankings', 'profile'] as const).map((page) => (
          <div
            key={page}
            className={`nav-item ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            <div className="nav-icon">
              {page === 'home' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
                  <polyline points="9 21 9 13 15 13 15 21"/>
                </svg>
              )}
              {page === 'feed' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )}
              {page === 'tree' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22V12"/>
                  <path d="M12 12C12 12 7 9.5 7 5.5a5 5 0 0 1 10 0C17 9.5 12 12 12 12z"/>
                  <path d="M12 16C12 16 8 14 6 11"/>
                  <path d="M12 16C12 16 16 14 18 11"/>
                </svg>
              )}
              {page === 'rankings' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="18" y="3" width="4" height="18" rx="1"/>
                  <rect x="10" y="8" width="4" height="13" rx="1"/>
                  <rect x="2" y="13" width="4" height="8" rx="1"/>
                </svg>
              )}
              {page === 'profile' && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>
            <div className="nav-label">{page.charAt(0).toUpperCase() + page.slice(1)}</div>
          </div>
        ))}
      </div>
}
    </div>
  )
}

export default App

