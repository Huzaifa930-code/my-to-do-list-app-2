const baseURL = 'http://localhost:3000/api';

// Helper function for making requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    console.log(`${options.method || 'GET'} ${url}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---\n');

    return { response, data };
  } catch (error) {
    console.error(`Error with ${url}:`, error.message);
  }
}

// Test all endpoints
async function runTests() {
  console.log('🧪 Testing Todo REST API\n');

  // 1. Health check
  await makeRequest(`${baseURL}/health`);

  // 2. Get all todos
  await makeRequest(`${baseURL}/todos`);

  // 3. Create a todo
  const createResult = await makeRequest(`${baseURL}/todos`, {
    method: 'POST',
    body: JSON.stringify({
      text: 'Test API todo item',
      priority: 'high',
      category: 'work',
      deadline: '2024-12-31T23:59:59.000Z'
    })
  });

  let todoId = null;
  if (createResult?.data?.data?.id) {
    todoId = createResult.data.data.id;
  }

  // 4. Get specific todo (if we have an ID)
  if (todoId) {
    await makeRequest(`${baseURL}/todos/${todoId}`);
  }

  // 5. Update todo (if we have an ID)
  if (todoId) {
    await makeRequest(`${baseURL}/todos/${todoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        text: 'Updated API todo item',
        priority: 'medium',
        completed: false
      })
    });
  }

  // 6. Toggle todo completion (if we have an ID)
  if (todoId) {
    await makeRequest(`${baseURL}/todos/${todoId}/toggle`, {
      method: 'PATCH'
    });
  }

  // 7. Get all todos with filters
  await makeRequest(`${baseURL}/todos?category=work&priority=medium`);

  // 8. Try to get stats (this should work after we fix the routing)
  await makeRequest(`${baseURL}/todos/stats`);

  // 9. Create another todo for statistics
  await makeRequest(`${baseURL}/todos`, {
    method: 'POST',
    body: JSON.stringify({
      text: 'Personal task',
      priority: 'low',
      category: 'personal'
    })
  });

  // 10. Get updated stats
  await makeRequest(`${baseURL}/todos/stats`);

  console.log('✅ API testing completed');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  This test requires Node.js 18+ or a fetch polyfill');
  console.log('You can test the API manually using curl commands from the README');
} else {
  runTests();
}