import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

const GOOGLE_CLIENT_ID = "704431364110-pavu61gakv9n5ofmnf7rl7jt11md8qqc.apps.googleusercontent.com" // Replace with actual ID
const FB_APP_ID = "1889807325052217" // Replace with actual ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
