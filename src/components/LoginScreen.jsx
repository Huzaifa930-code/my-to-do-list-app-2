import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Mail, Lock, User } from 'lucide-react'
import TwoFactorAuth from './TwoFactorAuth'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)

  const handleLogin = () => {
    setError('')

    if (!email) {
      setError('Please enter an email address')
      return
    }

    if (!password) {
      setError('Please enter a password')
      return
    }

    if (email === 'admin@todo.com' && password === 'password') {
      setShow2FA(true)
    } else {
      setError('Invalid credentials. Try admin@todo.com/password')
    }
  }

  const handleGuestLogin = () => {
    const guestUser = {
      username: 'guest',
      displayName: 'Guest User',
      loginTime: new Date().toISOString()
    }
    onLogin(guestUser)
  }

  const handle2FASuccess = () => {
    const user = {
      email: email,
      username: email.split('@')[0],
      displayName: 'Administrator',
      loginTime: new Date().toISOString()
    }
    onLogin(user)
  }

  if (show2FA) {
    return <TwoFactorAuth email={email} onSuccess={handle2FASuccess} onBack={() => setShow2FA(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-green-900 to-gray-950">
      <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-green-500/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-green-400 via-yellow-400 to-green-500 bg-clip-text text-transparent">
            Todo App
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Sign in to manage your tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-green-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10 bg-gray-900/50 border-green-500/30 text-gray-100 placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-green-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10 bg-gray-900/50 border-green-500/30 text-gray-100 placeholder:text-gray-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
              {error}
            </div>
          )}

          <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700">
            Sign In
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-green-500/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">Or</span>
            </div>
          </div>

          <Button onClick={handleGuestLogin} variant="outline" className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10">
            <User className="mr-2 h-4 w-4" />
            Continue as Guest
          </Button>

          <p className="text-xs text-center text-gray-500">
            Demo: admin@todo.com / password
          </p>
        </CardContent>
      </Card>
    </div>
  )
}