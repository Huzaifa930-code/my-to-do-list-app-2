import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Mail, Smartphone, ArrowLeft } from 'lucide-react'

export default function TwoFactorAuth({ email, onSuccess, onBack }) {
  const [method, setMethod] = useState('email')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [authSecret, setAuthSecret] = useState('')

  useEffect(() => {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString()
    setEmailCode(generatedCode)
    console.log('📧 Email 2FA Code:', generatedCode)

    const secret = generateSecret()
    setAuthSecret(secret)
  }, [])

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  const generateTOTP = (timeWindow, secret) => {
    let hash = 0
    const str = secret + timeWindow
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return (Math.abs(hash) % 1000000).toString().padStart(6, '0')
  }

  const handleVerify = () => {
    setError('')

    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }

    if (method === 'email') {
      if (code === emailCode) {
        onSuccess()
      } else {
        setError('Invalid email verification code')
      }
    } else {
      const currentTime = Math.floor(Date.now() / 1000 / 30)
      const validCodes = [
        generateTOTP(currentTime, authSecret),
        generateTOTP(currentTime - 1, authSecret),
        generateTOTP(currentTime + 1, authSecret)
      ]

      if (validCodes.includes(code)) {
        onSuccess()
      } else {
        setError('Invalid authenticator code')
      }
    }
  }

  const handleResend = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString()
    setEmailCode(newCode)
    console.log('📧 New Email 2FA Code:', newCode)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-green-900 to-gray-950">
      <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-green-500/20">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-green-400 via-yellow-400 to-green-500 bg-clip-text text-transparent">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-gray-400">Verify your identity for {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={method === 'email' ? 'default' : 'outline'}
              className={method === 'email' ? 'flex-1 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700' : 'flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10'}
              onClick={() => setMethod('email')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button
              variant={method === 'auth' ? 'default' : 'outline'}
              className={method === 'auth' ? 'flex-1 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700' : 'flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10'}
              onClick={() => setMethod('auth')}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Authenticator
            </Button>
          </div>

          {method === 'email' ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-900/50 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">
                  Code sent! Check console: <strong>{emailCode}</strong>
                </p>
              </div>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                maxLength={6}
                className="bg-gray-900/50 border-green-500/30 text-gray-100 placeholder:text-gray-500"
              />
              <Button variant="outline" size="sm" onClick={handleResend} className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10">
                Resend Code
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-900/50 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  Setup Key: <strong className="break-all">{authSecret}</strong>
                </p>
                <p className="text-xs text-yellow-500 mt-2">
                  Current code: <strong>{generateTOTP(Math.floor(Date.now() / 1000 / 30), authSecret)}</strong>
                </p>
              </div>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                maxLength={6}
                className="bg-gray-900/50 border-green-500/30 text-gray-100 placeholder:text-gray-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="border-green-500/30 text-green-400 hover:bg-green-500/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleVerify} className="flex-1 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700">
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}