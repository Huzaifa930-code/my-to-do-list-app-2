import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import TodoApp from './components/TodoApp'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('todoapp_user')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    if (user.username !== 'guest') {
      localStorage.setItem('todoapp_user', JSON.stringify(user))
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('todoapp_user')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <TodoApp user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App