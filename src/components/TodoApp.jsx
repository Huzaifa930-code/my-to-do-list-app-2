import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { LogOut, Plus, Trash2, Filter } from 'lucide-react'
import TodoDatabase from '../lib/database'

export default function TodoApp({ user, onLogout }) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-green-500/20">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-green-500 bg-clip-text text-transparent">
              Todo List
            </h1>
            <p className="text-gray-300 mt-1">Welcome, {user.displayName}!</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="shadow-sm border-green-500/30 text-green-400 hover:bg-green-500/10">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
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

        <Card className="shadow-xl border-0 bg-gray-800/90 backdrop-blur-sm border-green-500/20">
          <CardHeader className="border-b border-green-500/20 bg-gradient-to-r from-green-900/40 to-yellow-900/40">
            <CardTitle className="text-2xl text-gray-100">Add New Task</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Input
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                className="text-lg bg-gray-900/50 border-green-500/30 text-gray-100 placeholder:text-gray-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-green-500/30 bg-gray-900/50 text-gray-100 px-3 py-2 text-sm"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-green-500/30 bg-gray-900/50 text-gray-100 px-3 py-2 text-sm"
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
                  className="bg-gray-900/50 border-green-500/30 text-gray-100"
                />
                <Button onClick={addTodo} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gray-800/90 backdrop-blur-sm border-green-500/20">
          <CardHeader className="border-b border-green-500/20 bg-gradient-to-r from-yellow-900/40 to-green-900/40">
            <CardTitle className="flex items-center gap-2 text-gray-100">
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
                className="bg-gray-900/50 border-green-500/30 text-gray-100 placeholder:text-gray-500"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-green-500/30 bg-gray-900/50 text-gray-100 px-3 py-2 text-sm"
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
                className="flex h-10 w-full rounded-md border border-green-500/30 bg-gray-900/50 text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="flex h-10 w-full rounded-md border border-green-500/30 bg-gray-900/50 text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gray-800/90 backdrop-blur-sm border-green-500/20">
          <CardHeader className="border-b border-green-500/20 bg-gradient-to-r from-green-900/40 to-yellow-900/40">
            <CardTitle className="text-gray-100">Tasks ({filteredTodos.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredTodos.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-lg">No tasks found. Add one above!</p>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-green-500/20 bg-gray-900/40 hover:bg-gray-900/60 hover:shadow-md transition-all duration-200"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="mt-1 border-green-500/50 data-[state=checked]:bg-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-base ${todo.completed ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                        {todo.text}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-500/30">
                          {todo.category}
                        </span>
                        {todo.deadline && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-500/30">
                            {new Date(todo.deadline).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
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