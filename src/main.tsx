import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Remove loading spinner once React has mounted
setTimeout(() => {
  const loader = document.getElementById('root-loader')
  if (loader) loader.style.display = 'none'
}, 100)
