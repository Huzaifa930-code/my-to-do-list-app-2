import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { LogOut, Plus, Trash2, Filter, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import TodoDatabase from '../lib/database'

export default function TodoApp({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('general')
  const [deadline, setDeadline] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [db, setDb] = useState(null)

  useEffect(() => {
    const initDb = async () => {
      const database = new TodoDatabase()
      await database.init()
      setDb(database)
      const allTodos = await database.getAllTodos()
      setTodos(allTodos)
    }
    initDb()

    return () => {
      if (db) {
        db.close()
      }
    }
  }, [])

  const addTodo = async () => {
    if (!newTodo.trim() || !db) return

    const todo = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      priority: priority,
      category: category,
      deadline: deadline,
      createdAt: new Date().toISOString()
    }

    await db.addTodo(todo)
    setTodos([...todos, todo])
    setNewTodo('')
    setDeadline('')
  }

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo || !db) return

    const updatedTodo = { ...todo, completed: !todo.completed }
    await db.updateTodo(updatedTodo)
    setTodos(todos.map(t => t.id === id ? updatedTodo : t))
  }

  const deleteTodo = async (id) => {
    if (!db) return

    await db.deleteTodo(id)
    setTodos(todos.filter(t => t.id !== id))
  }

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || todo.category === filterCategory
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && todo.completed) ||
      (filterStatus === 'pending' && !todo.completed)
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-purple-200 dark:border-green-500/20">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-yellow-500 to-green-600 dark:from-green-400 dark:via-yellow-400 dark:to-green-500 bg-clip-text text-transparent">
              Todo List
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Welcome, {user.displayName}!</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="shadow-sm border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={onLogout} className="shadow-sm border-purple-300 dark:border-green-500/30 text-purple-600 dark:text-green-400 hover:bg-purple-100 dark:hover:bg-green-500/10">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-600 to-yellow-700 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{stats.total}</div>
                <div className="text-yellow-100 mt-2">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{stats.completed}</div>
                <div className="text-green-100 mt-2">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{stats.pending}</div>
                <div className="text-red-100 mt-2">Pending</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200 dark:border-green-500/20">
          <CardHeader className="border-b border-purple-200 dark:border-green-500/20 bg-gradient-to-r from-purple-100 to-yellow-100 dark:from-green-900/40 dark:to-yellow-900/40">
            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Add New Task</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Input
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                className="text-lg bg-white dark:bg-gray-900/50 border-purple-300 dark:border-green-500/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-purple-300 dark:border-green-500/30 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-purple-300 dark:border-green-500/30 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                >
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="shopping">Shopping</option>
                  <option value="health">Health</option>
                </select>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-white dark:bg-gray-900/50 border-purple-300 dark:border-green-500/30 text-gray-900 dark:text-gray-100"
                />
                <Button onClick={addTodo} className="bg-gradient-to-r from-purple-600 to-yellow-600 dark:from-green-600 dark:to-yellow-600 hover:from-purple-700 hover:to-yellow-700 dark:hover:from-green-700 dark:hover:to-yellow-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200 dark:border-green-500/20">
          <CardHeader className="border-b border-purple-200 dark:border-green-500/20 bg-gradient-to-r from-yellow-100 to-purple-100 dark:from-yellow-900/40 dark:to-green-900/40">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-gray-900/50 border-purple-300 dark:border-green-500/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-purple-300 dark:border-green-500/30 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="shopping">Shopping</option>
                <option value="health">Health</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-purple-300 dark:border-green-500/30 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="flex h-10 w-full rounded-md border border-purple-300 dark:border-green-500/30 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200 dark:border-green-500/20">
          <CardHeader className="border-b border-purple-200 dark:border-green-500/20 bg-gradient-to-r from-purple-100 to-yellow-100 dark:from-green-900/40 dark:to-yellow-900/40">
            <CardTitle className="text-gray-900 dark:text-gray-100">Tasks ({filteredTodos.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredTodos.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12 text-lg">No tasks found. Add one above!</p>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 dark:border-green-500/20 bg-purple-50/50 dark:bg-gray-900/40 hover:bg-purple-100/60 dark:hover:bg-gray-900/60 hover:shadow-md transition-all duration-200"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="mt-1 border-purple-400 dark:border-green-500/50 data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-base ${todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {todo.text}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-green-900/50 text-purple-700 dark:text-green-400 border border-purple-300 dark:border-green-500/30">
                          {todo.category}
                        </span>
                        {todo.deadline && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 border border-yellow-400 dark:border-yellow-500/30">
                            {new Date(todo.deadline).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}