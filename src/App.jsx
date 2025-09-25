import { useState, useEffect } from 'react'
import TodoApp from './components/TodoApp'
import LoginScreen from './components/LoginScreen'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('todo_user')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    if (user.username !== 'guest') {
      localStorage.setItem('todo_user', JSON.stringify(user))
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('todo_user')
  }

  return (
    <>
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <TodoApp user={currentUser} onLogout={handleLogout} />
      )}
    </>
  )
}

export default App