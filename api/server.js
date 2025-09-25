const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage (replace with database in production)
let todos = [
  {
    id: uuidv4(),
    text: "Sample todo item",
    completed: false,
    priority: "medium",
    category: "general",
    deadline: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Todo validation schemas
const todoValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Todo text is required')
    .isLength({ max: 500 })
    .withMessage('Todo text cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('category')
    .optional()
    .isIn(['general', 'work', 'personal', 'shopping', 'health'])
    .withMessage('Invalid category'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO date'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean')
];

const idValidation = [
  param('id')
    .notEmpty()
    .withMessage('Todo ID is required')
    .isUUID()
    .withMessage('Invalid todo ID format')
];

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Todo API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /api/todos - Get all todos with optional filtering
app.get('/api/todos', (req, res) => {
  try {
    const { category, priority, completed, search } = req.query;
    let filteredTodos = [...todos];

    // Apply filters
    if (category && category !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.category === category);
    }

    if (priority && priority !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.priority === priority);
    }

    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      filteredTodos = filteredTodos.filter(todo => todo.completed === isCompleted);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredTodos = filteredTodos.filter(todo =>
        todo.text.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by creation date (newest first)
    filteredTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: filteredTodos,
      total: filteredTodos.length,
      filters_applied: {
        category: category || 'all',
        priority: priority || 'all',
        completed: completed || 'all',
        search: search || ''
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve todos',
      error: error.message
    });
  }
});

// GET /api/todos/stats - Get todo statistics
app.get('/api/todos/stats', (req, res) => {
  try {
    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      by_priority: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length
      },
      by_category: {
        general: todos.filter(t => t.category === 'general').length,
        work: todos.filter(t => t.category === 'work').length,
        personal: todos.filter(t => t.category === 'personal').length,
        shopping: todos.filter(t => t.category === 'shopping').length,
        health: todos.filter(t => t.category === 'health').length
      },
      overdue: todos.filter(t =>
        t.deadline && new Date(t.deadline) < new Date() && !t.completed
      ).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

// GET /api/todos/:id - Get a specific todo
app.get('/api/todos/:id', idValidation, handleValidationErrors, (req, res) => {
  try {
    const todo = todos.find(t => t.id === req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve todo',
      error: error.message
    });
  }
});

// POST /api/todos - Create a new todo
app.post('/api/todos', todoValidation, handleValidationErrors, (req, res) => {
  try {
    const { text, priority = 'medium', category = 'general', deadline } = req.body;

    const newTodo = {
      id: uuidv4(),
      text: text.trim(),
      completed: false,
      priority,
      category,
      deadline: deadline || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    todos.push(newTodo);

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: newTodo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create todo',
      error: error.message
    });
  }
});

// PUT /api/todos/:id - Update a todo
app.put('/api/todos/:id', [...idValidation, ...todoValidation], handleValidationErrors, (req, res) => {
  try {
    const todoIndex = todos.findIndex(t => t.id === req.params.id);

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    const { text, priority, category, deadline, completed } = req.body;

    // Update todo with provided fields
    todos[todoIndex] = {
      ...todos[todoIndex],
      text: text ? text.trim() : todos[todoIndex].text,
      priority: priority || todos[todoIndex].priority,
      category: category || todos[todoIndex].category,
      deadline: deadline !== undefined ? deadline : todos[todoIndex].deadline,
      completed: completed !== undefined ? completed : todos[todoIndex].completed,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Todo updated successfully',
      data: todos[todoIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update todo',
      error: error.message
    });
  }
});

// PATCH /api/todos/:id/toggle - Toggle todo completion status
app.patch('/api/todos/:id/toggle', idValidation, handleValidationErrors, (req, res) => {
  try {
    const todoIndex = todos.findIndex(t => t.id === req.params.id);

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    todos[todoIndex].completed = !todos[todoIndex].completed;
    todos[todoIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: `Todo marked as ${todos[todoIndex].completed ? 'completed' : 'pending'}`,
      data: todos[todoIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle todo',
      error: error.message
    });
  }
});

// DELETE /api/todos/:id - Delete a todo
app.delete('/api/todos/:id', idValidation, handleValidationErrors, (req, res) => {
  try {
    const todoIndex = todos.findIndex(t => t.id === req.params.id);

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];

    res.json({
      success: true,
      message: 'Todo deleted successfully',
      data: deletedTodo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete todo',
      error: error.message
    });
  }
});

// GET /api/todos/stats - Get todo statistics
app.get('/api/todos/stats', (req, res) => {
  try {
    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      by_priority: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length
      },
      by_category: {
        general: todos.filter(t => t.category === 'general').length,
        work: todos.filter(t => t.category === 'work').length,
        personal: todos.filter(t => t.category === 'personal').length,
        shopping: todos.filter(t => t.category === 'shopping').length,
        health: todos.filter(t => t.category === 'health').length
      },
      overdue: todos.filter(t =>
        t.deadline && new Date(t.deadline) < new Date() && !t.completed
      ).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /api/health',
      'GET /api/todos',
      'GET /api/todos/:id',
      'POST /api/todos',
      'PUT /api/todos/:id',
      'PATCH /api/todos/:id/toggle',
      'DELETE /api/todos/:id',
      'GET /api/todos/stats'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Todo API server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 API endpoints: http://localhost:${PORT}/api/todos`);
});

module.exports = app;