# Todo List REST API

A comprehensive REST API for managing todo items with full CRUD operations, filtering, and validation.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- 🔍 Advanced filtering and search
- ✔️ Input validation and error handling
- 📊 Statistics endpoint
- 🔒 Security middleware (Helmet, CORS)
- 📝 Request logging
- 🎯 Priority levels and categories
- ⏰ Deadline management

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Todo Operations

#### Get All Todos
```http
GET /api/todos
```

**Query Parameters:**
- `category` - Filter by category (general, work, personal, shopping, health)
- `priority` - Filter by priority (low, medium, high)
- `completed` - Filter by completion status (true/false)
- `search` - Search in todo text

**Example:**
```http
GET /api/todos?category=work&priority=high&completed=false&search=meeting
```

#### Get Single Todo
```http
GET /api/todos/:id
```

#### Create New Todo
```http
POST /api/todos
Content-Type: application/json

{
  "text": "Complete project documentation",
  "priority": "high",
  "category": "work",
  "deadline": "2024-01-31T23:59:59.000Z"
}
```

#### Update Todo
```http
PUT /api/todos/:id
Content-Type: application/json

{
  "text": "Updated todo text",
  "priority": "medium",
  "category": "personal",
  "completed": false,
  "deadline": "2024-02-01T12:00:00.000Z"
}
```

#### Toggle Todo Completion
```http
PATCH /api/todos/:id/toggle
```

#### Delete Todo
```http
DELETE /api/todos/:id
```

#### Get Statistics
```http
GET /api/todos/stats
```

## Data Structure

### Todo Object
```json
{
  "id": "uuid-string",
  "text": "Todo item description",
  "completed": false,
  "priority": "medium",
  "category": "general",
  "deadline": "2024-01-31T23:59:59.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Field Constraints
- **text**: Required, max 500 characters
- **priority**: Optional, one of: `low`, `medium`, `high`
- **category**: Optional, one of: `general`, `work`, `personal`, `shopping`, `health`
- **deadline**: Optional, ISO 8601 date string
- **completed**: Optional, boolean

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "text",
      "message": "Todo text is required"
    }
  ]
}
```

## Example Usage

### Create a Todo
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Buy groceries",
    "priority": "medium",
    "category": "shopping",
    "deadline": "2024-01-20T18:00:00.000Z"
  }'
```

### Get All Work Todos
```bash
curl "http://localhost:3000/api/todos?category=work"
```

### Toggle Todo Completion
```bash
curl -X PATCH http://localhost:3000/api/todos/your-todo-id/toggle
```

### Get Statistics
```bash
curl http://localhost:3000/api/todos/stats
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Server-side validation for all inputs
- **Request Limiting**: JSON payload size limit (10MB)

## Development

The API uses in-memory storage for simplicity. In production, replace the `todos` array with a proper database (MongoDB, PostgreSQL, etc.).

## License

ISC