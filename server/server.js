import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
const GEMINI_API_KEY_PAID = process.env.GEMINI_API_KEY_PAID

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' })) // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Helper function to check DB availability
function isDBAvailable() {
  return db !== null
}

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    dbConnected: isDBAvailable(),
    port: PORT,
  })
})

// ==================== GEMINI VISION VERIFICATION ====================
async function verifyQuestWithGemini(questTitle, questDescription, imageBase64) {
  try {
    if (!GEMINI_API_KEY_PAID) {
      console.log('No Gemini API key, auto-approving quest')
      return { verified: true, confidence: 'auto-approved', reason: 'No API key configured' }
    }

    const prompt = `You are verifying if a user completed a climate action quest.

Quest Title: "${questTitle}"
Quest Description: "${questDescription}"

Analyze the provided image and determine if it shows evidence of completing this quest.

Respond with ONLY valid JSON:
{
  "verified": true/false,
  "confidence": "high/medium/low",
  "reason": "Brief explanation of what you see and why it matches or doesn't match the quest"
}

VERIFICATION GUIDELINES:
- Be reasonable and fair - understand that mobile photos may be lower quality, but they should still show the relevant activity
- Accept photos that clearly show evidence of the quest being completed, even if not perfect quality
- Look for the main subject/action of the quest in the image
- If the image shows something that could reasonably be the quest activity, verify it
- If the image is completely unrelated to the quest, reject it

Examples of what to ACCEPT:
- Quest "Walk Short Trip" + photo of outdoors, street, sidewalk, park, walking = verified: true
- Quest "Unplug Chargers" + photo showing outlet, unplugged cables, charger = verified: true
- Quest "Reusable Bag" + photo of reusable bag, shopping with bag, cloth bag = verified: true
- Quest "Bike 2km" + photo showing bicycle, person on bike, bike path = verified: true
- Quest "Plant Tree" + photo of planting, tree, seedling, garden, soil with plants = verified: true
- Quest "Meatless Meal" + photo of vegetarian food (pasta, salad, vegetables, rice dishes without visible meat) = verified: true
- Quest "Compost" + photo of compost bin, organic waste, composting area = verified: true

Examples of what to REJECT:
- Quest "Bike 2km" + photo of indoor room, random object, car = verified: false
- Quest "Meatless Meal" + photo clearly showing steak, chicken, fish = verified: false
- Quest "Walk Short Trip" + photo of completely unrelated indoor scene = verified: false
- Quest "Plant Tree" + photo of random indoor items, no plants = verified: false
- Any quest + photo that has nothing to do with the activity = verified: false

Be fair but not overly lenient. The photo should reasonably show the quest activity.`

    console.log('Verifying quest with Gemini:', questTitle)
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY_PAID,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: { 
          temperature: 0.4,  // Balanced verification
          maxOutputTokens: 400 
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Gemini API error:', response.status, errorText)
      return { verified: false, confidence: 'error', reason: 'Verification service is temporarily unavailable. Please try again in a moment.' }
    }

    const data = await response.json()
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!resultText) {
      console.log('No verification result from Gemini - Rejecting')
      return { verified: false, confidence: 'error', reason: 'Verification service returned no result. Please try again.' }
    }

    console.log('Raw Gemini response:', resultText)

    // Parse JSON from response - handle markdown code blocks
    let jsonStr = resultText.trim()
    
    // Remove markdown code blocks if present
    if (jsonStr.includes('```')) {
      const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim()
      }
    }
    
    // If still no match, try to find JSON object
    if (jsonStr.startsWith('```') || !jsonStr.startsWith('{')) {
      const objectMatch = jsonStr.match(/({[\s\S]*})/)
      if (objectMatch && objectMatch[1]) {
        jsonStr = objectMatch[1].trim()
      }
    }

    console.log('Parsed JSON string:', jsonStr)
    const result = JSON.parse(jsonStr)
    console.log('Gemini verification:', result)
    return result
  } catch (error) {
    console.error('Gemini verification error:', error.message, '- Rejecting')
    return { verified: false, confidence: 'error', reason: 'Verification service encountered an error. Please try again.' }
  }
}

// ==================== GEMINI QUEST GENERATION ====================
async function generateQuestWithGemini(location, userLevel) {
  try {
    if (!GEMINI_API_KEY_PAID) {
      console.log('No paid Gemini API key, using fallback quest')
      return null
    }

    const difficulty = userLevel < 2 ? 'easy' : userLevel < 5 ? 'medium' : 'hard'
    const pointsRange = difficulty === 'easy' ? [15, 40] : difficulty === 'medium' ? [35, 60] : [50, 80]
    const points = Math.floor(Math.random() * (pointsRange[1] - pointsRange[0]) + pointsRange[0])
    
    const prompt = `Generate a single EMISSION REDUCTION quest for ASEAN climate action game.
Location: ${location}

Create a quest with this structure (return ONLY valid JSON):
{
  "emoji": "single emoji",
  "title": "Short quest name (3-5 words)",
  "description": "What to do (1 sentence max)",
  "co2Saved": estimated_co2_in_kg,
  "difficulty": "${difficulty}"
}

Important:
- Quest MUST directly reduce carbon emissions or energy use
- Focus on EASY daily actions: turn off lights, unplug chargers, use fans instead of AC, bike/walk short trips, avoid plastic bags, buy local food, use reusable items
- ASEAN region specific (Philippines, Thailand, Vietnam, Indonesia, Malaysia, Singapore, Myanmar)
- Must be completable in 30 minutes to 2 hours
- Examples: "Skip the car, walk 1km", "Unplug devices for 3 hours", "Use fan instead of AC today", "Bring reusable bag shopping"
- CO2 saved: 0.1 to 2.0 kg range (realistic daily amounts)`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY_PAID,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Gemini API rate limit reached, using fallback quests')
      } else {
        console.log('Gemini API error:', response.status)
      }
      return null
    }

    const data = await response.json()
    const questText = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!questText) {
      console.log('No quest text from Gemini')
      return null
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = questText
    const jsonMatch = questText.match(/```json\n?([\s\S]*?)\n?```/) || questText.match(/({[\s\S]*})/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const questData = JSON.parse(jsonStr)
    
    return {
      emoji: questData.emoji || '🌱',
      title: questData.title || 'Climate Action',
      description: questData.description || 'Help the climate',
      points,
      co2Saved: questData.co2Saved || 0.5,
      difficulty,
    }
  } catch (error) {
    console.error('Gemini error:', error.message)
    return null
  }
}

// Helper to create a quest for user (checks for duplicates BEFORE inserting)
async function createUserQuest(userId, location, userLevel, existingTitles = new Set()) {
  const fallbackQuests = [
    // Honor System - Can't verify with photos
    { emoji: '💡', title: 'Lights Off 3 Hours', description: 'Turn off all lights when not in room for 3+ hours', points: 25, co2Saved: 0.3, difficulty: 'easy', verificationType: 'honor-system' },
    { emoji: '🔌', title: 'Unplug Chargers', description: 'Unplug phone/laptop chargers when not charging', points: 20, co2Saved: 0.2, difficulty: 'easy', verificationType: 'honor-system' },
    { emoji: '🌬️', title: 'Fan Over AC', description: 'Use electric fan instead of aircon for 4 hours', points: 40, co2Saved: 1.2, difficulty: 'easy', verificationType: 'honor-system' },
    { emoji: '💧', title: 'Cold Water Laundry', description: 'Wash clothes with cold water instead of hot', points: 25, co2Saved: 0.4, difficulty: 'easy', verificationType: 'honor-system' },
    { emoji: '🥤', title: 'No Plastic Straws', description: 'Refuse plastic straws for all drinks today', points: 15, co2Saved: 0.05, difficulty: 'easy', verificationType: 'honor-system' },
    { emoji: '💻', title: 'Screen Brightness Down', description: 'Reduce screen brightness by 50% all day', points: 20, co2Saved: 0.2, difficulty: 'easy', verificationType: 'honor-system' },
    { emoji: '🚿', title: 'Short Shower', description: 'Limit shower to 5 minutes (saves hot water energy)', points: 25, co2Saved: 0.6, difficulty: 'easy', verificationType: 'honor-system' },
    
    // Photo Required - Clear visual proof needed
    { emoji: '🚶', title: 'Walk Short Trip', description: 'Walk instead of drive for trips under 1km', points: 30, co2Saved: 0.5, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🚴', title: 'Bike 2km Today', description: 'Use bicycle instead of motorbike for one trip', points: 35, co2Saved: 0.8, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🚌', title: 'Take the Jeepney', description: 'Use public transport instead of private car once', points: 35, co2Saved: 1.5, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🛍️', title: 'Reusable Bag', description: 'Bring reusable bag when shopping (no plastic)', points: 20, co2Saved: 0.1, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🌾', title: 'Buy Local Produce', description: 'Get vegetables from local market (no imports)', points: 30, co2Saved: 0.6, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '♻️', title: 'Recycle Bottles', description: 'Collect and recycle 5 plastic bottles', points: 25, co2Saved: 0.3, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🌱', title: 'Plant a Seedling', description: 'Plant herbs, vegetables or flowers in your home', points: 40, co2Saved: 0.8, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '💧', title: 'Reusable Water Bottle', description: 'Use refillable bottle instead of buying plastic', points: 20, co2Saved: 0.15, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🍃', title: 'Compost Organic Waste', description: 'Start or add to compost bin with food scraps', points: 35, co2Saved: 0.4, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🧵', title: 'Repair Not Replace', description: 'Fix clothing, bag, or item instead of buying new', points: 40, co2Saved: 1.0, difficulty: 'medium', verificationType: 'photo-required' },
    { emoji: '🥢', title: 'Metal/Bamboo Straw', description: 'Use reusable straw instead of plastic or paper', points: 15, co2Saved: 0.05, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🚗', title: 'Carpool Today', description: 'Share ride with 2+ people instead of solo driving', points: 45, co2Saved: 1.8, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🚶‍♀️', title: 'Use Stairs', description: 'Take stairs instead of elevator (at least 3 floors)', points: 25, co2Saved: 0.1, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🧹', title: 'Pick Up Litter', description: 'Clean up 10+ pieces of trash in public area', points: 30, co2Saved: 0.2, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🌿', title: 'Start Herb Garden', description: 'Grow basil, mint, or other herbs at home', points: 35, co2Saved: 0.3, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '👕', title: 'Thrift Shop', description: 'Buy second-hand clothing or items', points: 40, co2Saved: 1.2, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🌳', title: 'Tree Planting', description: 'Plant a tree in your community or backyard', points: 50, co2Saved: 2.0, difficulty: 'medium', verificationType: 'photo-required' },
    { emoji: '🧴', title: 'Eco-Friendly Products', description: 'Buy biodegradable or zero-waste products', points: 30, co2Saved: 0.5, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '🍽️', title: 'Meatless Meal', description: 'Prepare and eat plant-based lunch or dinner', points: 35, co2Saved: 1.5, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '📄', title: 'Use Both Sides Paper', description: 'Reuse paper by writing on both sides', points: 15, co2Saved: 0.1, difficulty: 'easy', verificationType: 'photo-required' },
    { emoji: '☀️', title: 'Air Dry Clothes', description: 'Hang clothes to dry instead of using dryer', points: 30, co2Saved: 0.7, difficulty: 'easy', verificationType: 'photo-required' },
    
    // Photo Bonus - Optional photo for extra points
    { emoji: '🍱', title: 'Pack Lunch', description: 'Bring homemade lunch (avoid food delivery packaging)', points: 30, co2Saved: 0.5, difficulty: 'easy', verificationType: 'photo-bonus', bonusPoints: 10 },
  ]

  // Try multiple times to get a unique quest
  let quest = null
  let attempts = 0
  
  while (!quest && attempts < 3) {
    attempts++
    const candidateQuest = await generateQuestWithGemini(location, userLevel)
    
    if (candidateQuest && !existingTitles.has(candidateQuest.title)) {
      quest = candidateQuest
      console.log('Gemini generated unique quest:', quest.title)
      break
    }
  }
  
  // Fallback to random quest if Gemini fails or duplicates
  if (!quest) {
    // Filter fallback quests to only unused ones
    const availableFallbacks = fallbackQuests.filter(q => !existingTitles.has(q.title))
    
    if (availableFallbacks.length === 0) {
      console.log('All quests used, resetting pool')
      // If all quests are used, just pick a random one (allow repeats)
      quest = fallbackQuests[Math.floor(Math.random() * fallbackQuests.length)]
    } else {
      quest = availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)]
    }
    console.log('Using fallback quest:', quest.title)
  }
  
  // If still no quest (shouldn't happen), return null instead of crashing
  if (!quest) {
    console.error('Failed to generate quest after all attempts')
    return null
  }

  // Insert into database only after duplicate check
  const result = await db.collection('quests').insertOne({
    userId: new ObjectId(userId),
    emoji: quest.emoji,
    title: quest.title,
    description: quest.description,
    points: quest.points,
    co2Saved: quest.co2Saved,
    difficulty: quest.difficulty || 'easy',
    verificationType: quest.verificationType || 'honor-system',
    bonusPoints: quest.bonusPoints || 0,
    completed: false,
    createdAt: new Date(),
    completedAt: null,
  })

  return {
    id: result.insertedId.toString(),
    ...quest,
    completed: false,
  }
}

// Helper to calculate level from points
function calculateLevel(points) {
  return Math.floor(points / 500) + 1
}

// MongoDB Connection
let db = null
let dbConnectPromise = null

async function connectDB() {
  try {
    const mongoOptions = {
      minPoolSize: 0,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    }
    
    const client = new MongoClient(MONGODB_URI, mongoOptions)
    await client.connect()
    db = client.db('climatewatch')
    console.log('Connected to MongoDB')
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('quests').createIndex({ userId: 1 })
    await db.collection('feeds').createIndex({ userId: 1 })
    // TTL index: auto-delete feed posts older than 7 days
    await db.collection('feeds').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 604800, name: 'feed_ttl_7d' }
    )
    console.log('Feed TTL index ensured (7 days)')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    dbConnectPromise = null // allow retry on next request
    throw error
  }
}

function ensureDB() {
  if (!dbConnectPromise) {
    dbConnectPromise = connectDB()
  }
  return dbConnectPromise
}

// Ensure DB is connected before handling any API request
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next()
  try {
    await ensureDB()
    next()
  } catch (err) {
    res.status(503).json({ error: 'Database connection failed. Please try again shortly.' })
  }
})

// Auth Middleware
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.email = decoded.email
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ==================== PASSWORD VALIDATION ====================
const COMMON_PASSWORDS = [
  'password', 'password123', 'password1234',
  'qwerty', 'qwerty123',
  '123456', '1234567', '12345678', '123456789',
  'abc123', 'abcdefg',
  'letmein', 'welcome', 'admin', 'pass',
]

function validatePassword(password) {
  const errors = []
  
  // Check length (8–12 characters)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  } else if (password.length > 12) {
    errors.push('Password must be no more than 12 characters')
  }
  
  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Must include at least one uppercase letter (A-Z)')
  }
  
  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Must include at least one lowercase letter (a-z)')
  }
  
  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Must include at least one number (0-9)')
  }
  
  // Check for special characters (REQUIRED)
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Must include at least one special character (e.g. !@#$%)')
  }
  
  // Check against common passwords
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password too common or contains common sequences')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ==================== AUTH ROUTES ====================

// SIGN UP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, location, avatar } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    if (/\s/.test(email)) {
      return res.status(400).json({ error: 'Email must not contain spaces' })
    }

    if (/\s/.test(password)) {
      return res.status(400).json({ error: 'Password must not contain spaces' })
    }

    if (!isDBAvailable()) {
      return res.status(503).json({ error: 'Database unavailable. Please configure MongoDB URI in .env file.' })
    }
    
    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      })
    }
    
    const users = db.collection('users')
    const existing = await users.findOne({ email })
    
    if (existing) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    const hashedPassword = await bcryptjs.hash(password, 10)
    
    const result = await users.insertOne({
      email,
      password: hashedPassword,
      name,
      location: location || 'Manila, Philippines',
      avatar: avatar || name.substring(0, 2).toUpperCase(),
      points: 0,
      rank: 0,
      dayStreak: 0,
      level: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    // Generate first quest for new user
    const firstQuest = await createUserQuest(result.insertedId.toString(), location || 'Manila, Philippines', 1)
    
    const token = jwt.sign({ userId: result.insertedId.toString(), email }, JWT_SECRET, { expiresIn: '7d' })
    
    return res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: {
        id: result.insertedId.toString(),
        email,
        name,
        location: location || 'Manila, Philippines',
        avatar: avatar || name.substring(0, 2).toUpperCase(),
        points: 0,
        rank: 0,
        dayStreak: 0,
        level: 1,
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: error.message })
  }
})

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (!isDBAvailable()) {
      return res.status(503).json({ error: 'Database unavailable. Please configure MongoDB URI in .env file.' })
    }
    
    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' })
    }
    
    const passwordMatch = await bcryptjs.compare(password, user.password)
    
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid password' })
    }
    
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    
    return res.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        location: user.location,
        avatar: user.avatar,
        points: user.points,
        level: calculateLevel(user.points),
        rank: user.rank,
        dayStreak: user.dayStreak,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== USER ROUTES ====================

// GET USER PROFILE
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    if (!isDBAvailable()) {
      return res.status(503).json({ error: 'Database unavailable. Please configure MongoDB URI in .env file.' })
    }

    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Calculate level from points
    const level = calculateLevel(user.points)
    const pointsToNextLevel = (level * 500) - user.points
    
    // Get current active quest
    let currentQuest = null
    const activeQuest = await db.collection('quests').findOne({ 
      userId: new ObjectId(req.userId),
      completed: false 
    })
    
    if (activeQuest) {
      currentQuest = {
        id: activeQuest._id.toString(),
        emoji: activeQuest.emoji,
        title: activeQuest.title,
        description: activeQuest.description,
        points: activeQuest.points,
        co2Saved: activeQuest.co2Saved,
        difficulty: activeQuest.difficulty,
        completed: activeQuest.completed,
      }
    }
    
    const { password, ...userWithoutPassword } = user
    
    return res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      location: user.location,
      avatar: user.avatar,
      points: user.points,
      level,
      pointsToNextLevel,
      rank: user.rank,
      dayStreak: user.dayStreak,
      currentQuest,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: error.message })
  }
})

// UPDATE USER PROFILE (only own data)
app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { name, location, avatar } = req.body
    
    const updateData = {}
    if (name) updateData.name = name
    if (location) updateData.location = location
    if (avatar) updateData.avatar = avatar
    updateData.updatedAt = new Date()
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Backfill avatar and name into all existing feed posts by this user
    const feedUpdate = {}
    if (avatar) feedUpdate.avatar = avatar
    if (name) feedUpdate.user = name
    if (Object.keys(feedUpdate).length > 0) {
      await db.collection('feeds').updateMany(
        { userId: req.userId },
        { $set: feedUpdate }
      )
    }
    
    const user = result.value
    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        location: user.location,
        avatar: user.avatar,
        points: user.points,
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE ACCOUNT (cascade delete)
app.delete('/api/user/account', verifyToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.userId)
    
    // Delete user quests (stored with ObjectId userId)
    await db.collection('quests').deleteMany({ userId: userId })
    
    // Delete user feeds (stored with string userId)
    await db.collection('feeds').deleteMany({ userId: req.userId })
    
    // Delete user
    const result = await db.collection('users').deleteOne({ _id: userId })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    return res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: error.message })
  }
})

// FORGOT PASSWORD - Change password with email verification
app.post('/api/user/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' })
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      })
    }

    const user = await db.collection('users').findOne({ email })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10)

    const result = await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    )

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'Failed to update password' })
    }

    return res.json({ 
      message: 'Password updated successfully',
      email: user.email,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== QUEST ROUTES ====================

// GET USER QUESTS
app.get('/api/quests', verifyToken, async (req, res) => {
  try {
    // Get only this user's quests from MongoDB (real data only)
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) })
    const userLevel = user?.level || 1
    const location = user?.location || 'Manila, Philippines'

    // Check when quests were last generated for this user
    const lastQuestGeneration = user?.lastQuestGenerationDate
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get ALL user's incomplete quests (don't filter by time here)
    let quests = await db.collection('quests')
      .find({ 
        userId: new ObjectId(req.userId)
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Count how many quests user already has from today
    const todaysExisting = quests.filter(q => new Date(q.createdAt) >= twentyFourHoursAgo)
    const todaysCount = todaysExisting.length
    const needsMoreQuests = todaysCount < 5
    const shouldGenerateQuests = !lastQuestGeneration || new Date(lastQuestGeneration) < twentyFourHoursAgo

    // Generate if: (1) fewer than 5 quests today, OR (2) no quests at all and 24h passed
    if (needsMoreQuests && (todaysCount === 0 ? shouldGenerateQuests : true)) {
      const needed = 5 - todaysCount
      console.log(`Topping up quests for user: have ${todaysCount}, generating ${needed} more`)
      
      // Delete old quests (more than 24 hours old) before generating new ones
      if (todaysCount === 0) {
        await db.collection('quests').deleteMany({
          userId: new ObjectId(req.userId),
          createdAt: { $lt: twentyFourHoursAgo }
        })
      }
      
      // Get existing quest titles to avoid duplicates
      const allUserQuests = await db.collection('quests')
        .find({ userId: new ObjectId(req.userId) })
        .toArray()
      const existingTitles = new Set(allUserQuests.map(q => q.title))
      
      // Generate only the needed quests IN PARALLEL with a per-call timeout
      // Wrap each Gemini call with a 6s timeout so a stalled request falls back fast
      const withTimeout = (promise, ms) =>
        Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(null), ms))])

      const rawResults = await Promise.all(
        Array.from({ length: needed }, () => withTimeout(generateQuestWithGemini(location, userLevel), 6000))
      )
      
      // Step 2: Fill in any nulls (Gemini failures) with fallback quests
      const fallbackPool = [
        { emoji: '💡', title: 'Lights Off 3 Hours', description: 'Turn off all lights when not in room for 3+ hours', points: 25, co2Saved: 0.3, difficulty: 'easy', verificationType: 'honor-system' },
        { emoji: '🔌', title: 'Unplug Chargers', description: 'Unplug phone/laptop chargers when not charging', points: 20, co2Saved: 0.2, difficulty: 'easy', verificationType: 'honor-system' },
        { emoji: '🌬️', title: 'Fan Over AC', description: 'Use electric fan instead of aircon for 4 hours', points: 40, co2Saved: 1.2, difficulty: 'easy', verificationType: 'honor-system' },
        { emoji: '🚿', title: 'Short Shower', description: 'Limit shower to 5 minutes (saves hot water energy)', points: 25, co2Saved: 0.6, difficulty: 'easy', verificationType: 'honor-system' },
        { emoji: '🛍️', title: 'Reusable Bag', description: 'Bring reusable bag when shopping (no plastic)', points: 20, co2Saved: 0.1, difficulty: 'easy', verificationType: 'photo-required' },
        { emoji: '🚶', title: 'Walk Short Trip', description: 'Walk instead of drive for trips under 1km', points: 30, co2Saved: 0.5, difficulty: 'easy', verificationType: 'photo-required' },
        { emoji: '♻️', title: 'Recycle Bottles', description: 'Collect and recycle 5 plastic bottles', points: 25, co2Saved: 0.3, difficulty: 'easy', verificationType: 'photo-required' },
        { emoji: '🍽️', title: 'Meatless Meal', description: 'Prepare and eat plant-based lunch or dinner', points: 35, co2Saved: 1.5, difficulty: 'easy', verificationType: 'photo-required' },
        { emoji: '☀️', title: 'Air Dry Clothes', description: 'Hang clothes to dry instead of using dryer', points: 30, co2Saved: 0.7, difficulty: 'easy', verificationType: 'photo-required' },
        { emoji: '💧', title: 'Reusable Water Bottle', description: 'Use refillable bottle instead of buying plastic', points: 20, co2Saved: 0.15, difficulty: 'easy', verificationType: 'photo-required' },
      ]
      
      // Deduplicate by title and fill to needed count
      const usedTitles = new Set(existingTitles)
      const questDataList = []
      for (const q of rawResults) {
        if (q && !usedTitles.has(q.title)) {
          usedTitles.add(q.title)
          questDataList.push(q)
        }
      }
      // Fill remaining slots with fallbacks (unique ones first)
      for (const fb of fallbackPool) {
        if (questDataList.length >= needed) break
        if (!usedTitles.has(fb.title)) {
          usedTitles.add(fb.title)
          questDataList.push(fb)
        }
      }
      // Last resort: if still under needed, allow any fallback not already in this batch
      const batchTitles = new Set(questDataList.map(q => q.title))
      for (const fb of fallbackPool) {
        if (questDataList.length >= needed) break
        if (!batchTitles.has(fb.title)) {
          batchTitles.add(fb.title)
          questDataList.push(fb)
        }
      }
      
      // Step 3: Final count check to guard against race conditions
      // (two simultaneous requests could both have entered this block)
      const finalCount = await db.collection('quests').countDocuments({
        userId: new ObjectId(req.userId),
        createdAt: { $gte: twentyFourHoursAgo }
      })
      const actualNeeded = Math.max(0, 5 - finalCount)
      const now = new Date()
      const questDocs = questDataList.slice(0, actualNeeded).map(q => ({
        userId: new ObjectId(req.userId),
        emoji: q.emoji,
        title: q.title,
        description: q.description,
        points: q.points,
        co2Saved: q.co2Saved,
        difficulty: q.difficulty || 'easy',
        verificationType: q.verificationType || 'honor-system',
        bonusPoints: q.bonusPoints || 0,
        completed: false,
        createdAt: now,
        completedAt: null,
      }))
      
      if (questDocs.length > 0) {
        await db.collection('quests').insertMany(questDocs)
      }
      const generatedQuests = questDocs
      
      console.log(`Auto-generated ${generatedQuests.length} new daily quests (parallel)`)
      
      // Update user's last quest generation timestamp
      await db.collection('users').updateOne(
        { _id: new ObjectId(req.userId) },
        { $set: { lastQuestGenerationDate: new Date() } }
      )
      
      // Fetch the newly created quests
      quests = await db.collection('quests')
        .find({ 
          userId: new ObjectId(req.userId)
        })
        .sort({ createdAt: -1 })
        .toArray()
    } else if (todaysCount === 0 && !shouldGenerateQuests) {
      // User deleted all quests but hasn't waited 24 hours
      const msLeft = new Date(lastQuestGeneration).getTime() + 24 * 60 * 60 * 1000 - Date.now()
      const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000))
      console.log(`⏳ User must wait ${hoursLeft} more hours for new quests`)
      return res.json({ waitingForReset: true, hoursLeft, quests: [] })
    }
    
    // Only return quests from today (last 24 hours) for display
    const todaysQuests = quests.filter(q => new Date(q.createdAt) >= twentyFourHoursAgo)
    
    return res.json(todaysQuests.map(q => ({
      id: q._id.toString(),
      emoji: q.emoji,
      title: q.title,
      description: q.description,
      points: q.points,
      co2Saved: q.co2Saved,
      difficulty: q.difficulty || 'medium',
      completed: q.completed,
      createdAt: q.createdAt,
      completedAt: q.completedAt,
      verificationType: q.verificationType || 'honor-system',
      bonusPoints: q.bonusPoints || 0,
    })))
  } catch (error) {
    console.error('Get quests error:', error)
    res.status(500).json({ error: error.message })
  }
})

// CREATE/ADD QUEST (user can add custom quests)
app.post('/api/quests', verifyToken, async (req, res) => {
  try {
    const { emoji, title, description, points, co2Saved } = req.body
    
    if (!emoji || !title || !description || !points) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const result = await db.collection('quests').insertOne({
      userId: req.userId,
      emoji,
      title,
      description,
      points: parseInt(points),
      co2Saved: parseFloat(co2Saved) || 0,
      completed: false,
      createdAt: new Date(),
    })
    
    return res.status(201).json({
      message: 'Quest created successfully',
      quest: {
        id: result.insertedId.toString(),
        userId: req.userId,
        emoji,
        title,
        description,
        points,
        co2Saved,
        completed: false,
      }
    })
  } catch (error) {
    console.error('Create quest error:', error)
    res.status(500).json({ error: error.message })
  }
})

// COMPLETE QUEST (toggle completion and add points with optional photo verification)
app.put('/api/quests/:questId/complete', verifyToken, async (req, res) => {
  try {
    const questId = new ObjectId(req.params.questId)
    const { imageBase64 } = req.body // Optional photo evidence
    
    // Get quest to verify ownership
    const quest = await db.collection('quests').findOne({ _id: questId })
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' })
    }
    
    // Use string comparison for userId
    const questUserId = quest.userId.toString ? quest.userId.toString() : quest.userId
    if (questUserId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
    
    // If quest is already completed, allow toggling off without verification
    if (quest.completed) {
      await db.collection('quests').updateOne(
        { _id: questId },
        { $set: { completed: false, completedAt: null } }
      )
      return res.json({
        message: 'Quest unmarked',
        completed: false,
        pointsEarned: 0,
      })
    }
    
    // Check if photo is REQUIRED for this quest type
    if (quest.verificationType === 'photo-required' && !imageBase64) {
      return res.status(400).json({ 
        error: 'Photo required',
        reason: 'This quest requires photo verification to complete',
      })
    }
    
    // COMPLETING QUEST: Verify photo if provided
    let verificationResult = null
    let bonusPointsEarned = 0
    
    if (imageBase64) {
      console.log('Verifying photo evidence for quest:', quest.title)
      verificationResult = await verifyQuestWithGemini(quest.title, quest.description, imageBase64)
      
      if (!verificationResult.verified) {
        return res.status(400).json({ 
          error: 'Photo verification failed',
          reason: verificationResult.reason,
          confidence: verificationResult.confidence,
          verified: false
        })
      }
      console.log('Photo verified! Confidence:', verificationResult.confidence)
      
      // Award bonus points for photo-bonus quests
      if (quest.verificationType === 'photo-bonus' && quest.bonusPoints) {
        bonusPointsEarned = quest.bonusPoints
        console.log(`Bonus points awarded: +${bonusPointsEarned}`)
      }
    }
    
    // Toggle completion
    const newCompleted = true
    
    // Update quest
    await db.collection('quests').updateOne(
      { _id: questId },
      { $set: { completed: newCompleted, completedAt: newCompleted ? new Date() : null } }
    )
    
    // Update user points if completing
    if (newCompleted) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) })
      const totalPointsEarned = quest.points + bonusPointsEarned
      const newPoints = (user.points || 0) + totalPointsEarned
      const newLevel = calculateLevel(newPoints)
      
      // Calculate day streak
      let newDayStreak = user.dayStreak || 0
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Check if user completed any quests today (count includes the quest just marked complete)
      const completedTodayCount = await db.collection('quests').countDocuments({
        userId: new ObjectId(req.userId),
        completed: true,
        completedAt: { $gte: today }
      })
      
      // If this is the first quest completed today (count === 1 because we just marked it complete)
      if (completedTodayCount === 1) {
        // Check if user completed quests yesterday
        const tomorrowStart = new Date(today)
        tomorrowStart.setDate(tomorrowStart.getDate() + 1)
        
        const completedYesterdayCount = await db.collection('quests').countDocuments({
          userId: new ObjectId(req.userId),
          completed: true,
          completedAt: { 
            $gte: yesterday,
            $lt: today
          }
        })
        
        if (completedYesterdayCount > 0) {
          // Continue streak
          newDayStreak += 1
        } else {
          // Start new streak
          newDayStreak = 1
        }
      }
      // If already completed quests today, keep current streak
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(req.userId) },
        { 
          $set: { points: newPoints, level: newLevel, dayStreak: newDayStreak, updatedAt: new Date() }
        }
      )
      
      console.log(`Quest completed! +${totalPointsEarned} points (base: ${quest.points}, bonus: ${bonusPointsEarned}). New level: ${newLevel}. Streak: ${newDayStreak} days`)
    }
    
    return res.json({
      message: 'Quest completed successfully',
      completed: newCompleted,
      pointsEarned: newCompleted ? quest.points : 0,
      bonusPointsEarned: bonusPointsEarned,
      totalPointsEarned: newCompleted ? quest.points + bonusPointsEarned : 0,
      verified: verificationResult ? verificationResult.verified : true,
      verificationReason: verificationResult ? verificationResult.reason : 'No photo verification required',
      verificationConfidence: verificationResult ? verificationResult.confidence : 'none',
    })
  } catch (error) {
    console.error('Complete quest error:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE QUEST
app.delete('/api/quests/:questId', verifyToken, async (req, res) => {
  try {
    const questId = new ObjectId(req.params.questId)
    
    const quest = await db.collection('quests').findOne({ _id: questId })
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' })
    }
    
    // Use string comparison for userId
    const questUserId = quest.userId.toString ? quest.userId.toString() : quest.userId
    if (questUserId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
    
    // Prevent deleting completed quests
    if (quest.completed) {
      return res.status(400).json({ error: 'Cannot delete completed quests. They are part of your achievement history!' })
    }
    
    await db.collection('quests').deleteOne({ _id: questId })
    
    return res.json({ message: 'Quest deleted successfully' })
  } catch (error) {
    console.error('Delete quest error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== FEED ROUTES ====================

// GET GLOBAL FEED (everyone can see)
app.get('/api/feed', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const feeds = await db.collection('feeds')
      .find({ createdAt: { $gte: oneWeekAgo } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return res.json(feeds.map(f => ({
      ...f,
      id: f._id.toString(),
      likes: f.likes || 0,
      likedBy: f.likedBy || [],
    })))
  } catch (error) {
    console.error('Get feed error:', error)
    res.status(500).json({ error: error.message })
  }
})

// CREATE FEED POST (only your own)
app.post('/api/feed', verifyToken, async (req, res) => {
  try {
    const { action } = req.body
    
    if (!action) {
      return res.status(400).json({ error: 'Action description required' })
    }
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) })
    
    const POST_POINTS = 0

    const result = await db.collection('feeds').insertOne({
      userId: req.userId,
      user: user.name,
      avatar: user.avatar,
      action,
      timestamp: new Date(),
      verified: false,
      points: POST_POINTS,
      likes: 0,
      likedBy: [],
      createdAt: new Date(),
    })

    // No points awarded for posting
    
    return res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: result.insertedId.toString(),
        userId: req.userId,
        user: user.name,
        avatar: user.avatar,
        action,
        timestamp: new Date(),
        verified: false,
        points: POST_POINTS,
        likes: 0,
        likedBy: [],
      }
    })
  } catch (error) {
    console.error('Create feed error:', error)
    res.status(500).json({ error: error.message })
  }
})

// LIKE / UNLIKE A FEED POST
app.post('/api/feed/:id/like', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    let postId
    try { postId = new ObjectId(id) } catch { return res.status(400).json({ error: 'Invalid post id' }) }

    const post = await db.collection('feeds').findOne({ _id: postId })
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const likedBy = post.likedBy || []
    const alreadyLiked = likedBy.includes(userId)

    if (alreadyLiked) {
      // Unlike
      await db.collection('feeds').updateOne(
        { _id: postId },
        { $inc: { likes: -1 }, $pull: { likedBy: userId } }
      )
      return res.json({ likes: Math.max(0, (post.likes || 1) - 1), liked: false })
    } else {
      // Like
      await db.collection('feeds').updateOne(
        { _id: postId },
        { $inc: { likes: 1 }, $push: { likedBy: userId } }
      )
      return res.json({ likes: (post.likes || 0) + 1, liked: true })
    }
  } catch (error) {
    console.error('Like feed error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== RANKING ROUTES ====================

// GET GLOBAL RANKINGS (everyone can see, read-only)
app.get('/api/rankings', async (req, res) => {
  try {
    // Get all users sorted by points (real data only from MongoDB)
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const rankings = await db.collection('users')
      .find({ points: { $gt: 0 } })  // Only include users with points > 0
      .sort({ points: -1 })
      .project({ 
        name: 1, 
        avatar: 1, 
        location: 1, 
        points: 1, 
        rank: 1,
        dayStreak: 1,
      })
      .toArray()
    
    // Add rank position
    const rankedUsers = rankings.map((user, index) => ({
      ...user,
      id: user._id.toString(),
      rankPosition: index + 1,
    }))
    
    // Update rank in database
    for (const user of rankedUsers) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(user.id) },
        { $set: { rank: user.rankPosition } }
      )
    }
    
    // Set rank to null for users with 0 points
    await db.collection('users').updateMany(
      { $or: [{ points: { $lte: 0 } }, { points: { $exists: false } }] },
      { $set: { rank: null } }
    )
    
    return res.json(rankedUsers)
  } catch (error) {
    console.error('Get rankings error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== GEMINI QUEST GENERATION ====================

// GENERATE ASEAN QUESTS (connected to emissions)
app.post('/api/generate-quests', verifyToken, async (req, res) => {
  try {
    const { location = 'Manila, Philippines' } = req.body
    
    // Check if user already has quests from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existingQuests = await db.collection('quests')
      .find({ 
        userId: new ObjectId(req.userId),
        createdAt: { $gte: twentyFourHoursAgo }
      })
      .toArray()
    
    // If user has any incomplete quests from the last 24 hours, don't generate new ones
    const incompleteQuests = existingQuests.filter(q => !q.completed)
    if (incompleteQuests.length > 0) {
      const timeLeft = Math.ceil((incompleteQuests[0].createdAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000))
      return res.status(400).json({ 
        error: `Please complete your current quests first! You can generate new quests in ${timeLeft} hours.`,
        timeLeft: timeLeft
      })
    }
    
    // Get user's current level for quest difficulty scaling
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) })
    const userLevel = user?.level || 1
    
    // Get existing quest titles to avoid duplicates
    const allUserQuests = await db.collection('quests')
      .find({ userId: new ObjectId(req.userId) })
      .toArray()
    const existingTitles = new Set(allUserQuests.map(q => q.title))
    
    // Generate 5 unique quests using Gemini (free API)
    const generatedQuests = []
    let attempts = 0
    const maxAttempts = 20
    
    while (generatedQuests.length < 5 && attempts < maxAttempts) {
      attempts++
      const quest = await createUserQuest(req.userId, location, userLevel, existingTitles)
      
      // Quest already checked for duplicates inside createUserQuest
      if (quest) {
        existingTitles.add(quest.title)
        generatedQuests.push(quest)
      }
    }
    
    // If we couldn't generate 5 unique quests, fill with whatever we have
    if (generatedQuests.length < 5) {
      console.log(`Only generated ${generatedQuests.length} unique quests`)
    }
    
    return res.status(201).json({
      message: `Generated ${generatedQuests.length} new daily quests!`,
      quests: generatedQuests,
    })
  } catch (error) {
    console.error('Generate quests error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== AI ASSISTANT ROUTES (PAID API) ====================

// System prompt for climate action assistant
const ASSISTANT_SYSTEM_PROMPT = `You are ClimaAi, a friendly and enthusiastic AI assistant for ClimateWatch, a gamified climate action platform.

ABOUT THE SYSTEM:
ClimateWatch is a climate action gaming platform where users complete eco-friendly quests to earn points, level up, and track their carbon impact. The system includes:
- Daily Quests: Users get 5 eco-friendly tasks daily that reset every 24 hours. Quests have different verification types (photo required, photo bonus, or honor system). AI verifies photo evidence using computer vision.
- Points & Levels: Completing quests earns points. Every 500 points = 1 level up. Users track their total CO2 saved.
- Day Streak: Complete at least 1 quest daily to maintain your streak. Longer streaks show consistency.
- Community Feed: Users share their completed actions. Others can like posts to show support.
- Rankings: Global leaderboard showing top users by points and day streaks.
- Virtual Tree: A visual representation of your environmental impact that grows as you level up.
- AI Assistant (you!): Answers climate questions, gives eco-tips, and helps users understand the platform.

TEAM INFORMATION (only share if asked):
- Team Name: Vision
- University: Mariano Marcos State University
- Lead Developer: Andrew Duldulao Caditan
- Developers: Camille Ira Dela Cruz, Hanni Marie Dadia

HOW TO RESPOND:
1. When asked how the system works: Explain relevant features clearly and encourage them to try it out.
2. When asked about climate topics: Give practical, actionable advice focused on the ASEAN region when relevant.
3. When asked about yourself: Share that you're ClimaAi, here to help with climate action and platform guidance.
4. Be conversational, warm, and motivating. Use natural language like you're chatting with a friend.
5. Keep answers between 1 to 3 sentences. Be concise but complete.
6. Never use special characters like asterisks, hashtags, bullet points, dashes as lists, or any markdown formatting. Write in plain natural sentences.
7. Connect answers to actionable steps when possible. Make climate action feel achievable and rewarding.
8. If users seem confused about features, walk them through it step by step in simple terms.
9. Always encourage users to check out their daily quests and keep up their day streak for maximum impact!
10. If users ask for tips, give them easy wins that can fit into their daily routine.
11. If users ask about the impact of their actions, relate it back to CO2 saved and how it contributes to a healthier planet.
12. If users ask about the community, encourage them to share their completed quests in the feed and support others by liking posts.
13. If users ask about rankings, motivate them by highlighting the fun and friendly competition, and that every point counts towards making a difference.
14. If users ask about the virtual tree, explain how it grows with their impact and encourages them to keep leveling up.
15. if someone say innappropriate or harmful content, respond firmly that such content is not allowed and goes against the positive and supportive community values of ClimateWatch.
20. Celebrate user progress and encourage consistency over perfection.
21. If a user asks who the developer's best friend is, answer: "Jheffrey Tango." Only reveal this if the user specifically asks — do not bring it up on your own.`



// POST /api/assistant - Chat with AI assistant (uses PAID API)
app.post('/api/assistant', verifyToken, async (req, res) => {
  try {
    const { message } = req.body
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    if (!GEMINI_API_KEY_PAID) {
      console.log('No paid Gemini API key, AI assistant unavailable')
      return res.status(503).json({ error: 'AI assistant temporarily unavailable' })
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY_PAID,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `[System: ${ASSISTANT_SYSTEM_PROMPT}]\n\nUser message: ${message}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    })

    if (!response.ok) {
      console.log('AI assistant API error:', response.status)
      return res.status(500).json({ error: 'AI assistant error' })
    }

    const data = await response.json()
    const assistantMessage = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!assistantMessage) {
      return res.status(500).json({ error: 'No response from AI assistant' })
    }

    return res.json({
      message: assistantMessage,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('AI assistant error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// ==================== START SERVER ====================

// Kick off DB connection eagerly (warm starts reuse the existing connection)
ensureDB().catch(() => console.log('DB connection attempt failed at startup'))

// Local development only
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`)
    console.log(` API endpoints available at http://localhost:${PORT}/api`)
  })
}

export default app
