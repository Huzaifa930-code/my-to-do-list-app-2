class TodoDatabase {
    constructor() {
        this.dbName = 'TodoApp';
        this.version = 1;
        this.db = null;
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            return this.db;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(new Error(`Database error: ${request.error?.message || 'Unknown error'}`));

            request.onsuccess = () => {
                this.db = request.result;

                // Handle database errors during operation
                this.db.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                };

                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                try {
                    const db = event.target.result;

                    // Create todos store if it doesn't exist
                    if (!db.objectStoreNames.contains('todos')) {
                        const store = db.createObjectStore('todos', { keyPath: 'id' });

                        // Create indexes for efficient querying
                        store.createIndex('completed', 'completed', { unique: false });
                        store.createIndex('priority', 'priority', { unique: false });
                        store.createIndex('category', 'category', { unique: false });
                        store.createIndex('createdAt', 'createdAt', { unique: false });
                        store.createIndex('deadline', 'deadline', { unique: false });
                        store.createIndex('text', 'text', { unique: false });
                        store.createIndex('selected', 'selected', { unique: false });
                    }
                } catch (upgradeError) {
                    reject(new Error(`Database upgrade failed: ${upgradeError.message}`));
                }
            };

            request.onblocked = () => {
                console.warn('Database upgrade blocked. Please close other tabs using this application.');
            };
        });
    }

    async executeTransaction(storeName, mode, operation) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
                transaction.onabort = () => reject(new Error('Transaction aborted'));

                const request = operation(store);

                if (request) {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(new Error(`Operation failed: ${request.error?.message || 'Unknown error'}`));
                }
            } catch (error) {
                reject(new Error(`Transaction setup failed: ${error.message}`));
            }
        });
    }

    async addTodo(todo) {
        if (!todo || !todo.id) {
            throw new Error('Invalid todo object: missing id');
        }

        return this.executeTransaction('todos', 'readwrite', (store) => {
            return store.add(todo);
        });
    }

    async updateTodo(todo) {
        if (!todo || !todo.id) {
            throw new Error('Invalid todo object: missing id');
        }

        return this.executeTransaction('todos', 'readwrite', (store) => {
            return store.put(todo);
        });
    }

    async deleteTodo(id) {
        if (!id) {
            throw new Error('Invalid todo id');
        }

        return this.executeTransaction('todos', 'readwrite', (store) => {
            return store.delete(id);
        });
    }

    async getTodo(id) {
        if (!id) {
            throw new Error('Invalid todo id');
        }

        return this.executeTransaction('todos', 'readonly', (store) => {
            return store.get(id);
        });
    }

    async getAllTodos() {
        return this.executeTransaction('todos', 'readonly', (store) => {
            return store.getAll();
        });
    }

    async getTodosByCategory(category) {
        if (!category) {
            throw new Error('Category is required');
        }

        return this.executeTransaction('todos', 'readonly', (store) => {
            const index = store.index('category');
            return index.getAll(category);
        });
    }

    async getTodosByPriority(priority) {
        if (!priority) {
            throw new Error('Priority is required');
        }

        return this.executeTransaction('todos', 'readonly', (store) => {
            const index = store.index('priority');
            return index.getAll(priority);
        });
    }

    async getTodosByStatus(completed) {
        if (typeof completed !== 'boolean') {
            throw new Error('Status must be a boolean');
        }

        return this.executeTransaction('todos', 'readonly', (store) => {
            const index = store.index('completed');
            return index.getAll(completed);
        });
    }

    async searchTodos(searchTerm) {
        if (!searchTerm || typeof searchTerm !== 'string') {
            throw new Error('Search term must be a non-empty string');
        }

        const todos = await this.getAllTodos();
        const term = searchTerm.toLowerCase();

        return todos.filter(todo =>
            todo.text && todo.text.toLowerCase().includes(term)
        );
    }

    async getOverdueTodos() {
        const todos = await this.getAllTodos();
        const now = new Date();

        return todos.filter(todo => {
            if (!todo.deadline || todo.completed) return false;

            try {
                return new Date(todo.deadline) < now;
            } catch (error) {
                console.warn(`Invalid deadline format for todo ${todo.id}:`, todo.deadline);
                return false;
            }
        });
    }

    async getTodosWithFilters({
        category,
        priority,
        completed,
        searchTerm,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = {}) {
        try {
            let todos = await this.getAllTodos();

            // Apply filters
            if (category && category !== 'all') {
                todos = todos.filter(todo => todo.category === category);
            }

            if (priority && priority !== 'all') {
                todos = todos.filter(todo => todo.priority === priority);
            }

            if (completed !== undefined && completed !== 'all') {
                const isCompleted = completed === 'completed' || completed === true;
                todos = todos.filter(todo => todo.completed === isCompleted);
            }

            if (searchTerm && typeof searchTerm === 'string') {
                const term = searchTerm.toLowerCase();
                todos = todos.filter(todo =>
                    todo.text && todo.text.toLowerCase().includes(term)
                );
            }

            // Sort todos
            todos.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                // Handle date sorting
                if (sortBy === 'createdAt' || sortBy === 'deadline') {
                    try {
                        aValue = new Date(aValue || 0);
                        bValue = new Date(bValue || 0);
                    } catch (error) {
                        console.warn('Invalid date format in sorting:', error);
                        aValue = new Date(0);
                        bValue = new Date(0);
                    }
                }

                // Handle string sorting
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (sortOrder === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });

            return todos;
        } catch (error) {
            console.error('Error in getTodosWithFilters:', error);
            throw new Error(`Failed to filter todos: ${error.message}`);
        }
    }

    async clearAllTodos() {
        return this.executeTransaction('todos', 'readwrite', (store) => {
            return store.clear();
        });
    }

    async getStats() {
        try {
            const todos = await this.getAllTodos();
            const total = todos.length;
            const completed = todos.filter(todo => todo.completed).length;
            const pending = total - completed;

            let overdue = 0;
            const now = new Date();

            const byCategory = {};
            const byPriority = {};

            todos.forEach(todo => {
                // Count overdue todos
                if (todo.deadline && !todo.completed) {
                    try {
                        if (new Date(todo.deadline) < now) {
                            overdue++;
                        }
                    } catch (error) {
                        console.warn(`Invalid deadline for todo ${todo.id}:`, todo.deadline);
                    }
                }

                // Count by category
                if (todo.category) {
                    byCategory[todo.category] = (byCategory[todo.category] || 0) + 1;
                }

                // Count by priority
                if (todo.priority) {
                    byPriority[todo.priority] = (byPriority[todo.priority] || 0) + 1;
                }
            });

            return {
                total,
                completed,
                pending,
                overdue,
                byCategory,
                byPriority
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }

    async exportData() {
        try {
            const todos = await this.getAllTodos();
            return {
                todos,
                exportDate: new Date().toISOString(),
                version: this.version,
                dbName: this.dbName
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw new Error(`Failed to export data: ${error.message}`);
        }
    }

    async importData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format: data must be an object');
        }

        if (!data.todos || !Array.isArray(data.todos)) {
            throw new Error('Invalid data format: todos must be an array');
        }

        try {
            // Clear existing data
            await this.clearAllTodos();

            // Import new data
            let importedCount = 0;
            for (const todo of data.todos) {
                if (todo && todo.id) {
                    await this.addTodo(todo);
                    importedCount++;
                } else {
                    console.warn('Skipping invalid todo:', todo);
                }
            }

            return importedCount;
        } catch (error) {
            console.error('Error importing data:', error);
            throw new Error(`Failed to import data: ${error.message}`);
        }
    }

    async migrateFromLocalStorage() {
        try {
            const localStorageData = localStorage.getItem('todos');
            if (!localStorageData) {
                return 0;
            }

            let todos;
            try {
                todos = JSON.parse(localStorageData);
            } catch (parseError) {
                console.error('Invalid JSON in localStorage:', parseError);
                return 0;
            }

            if (!Array.isArray(todos)) {
                console.warn('localStorage data is not an array');
                return 0;
            }

            let migratedCount = 0;
            for (const todo of todos) {
                if (todo && todo.id) {
                    try {
                        await this.addTodo(todo);
                        migratedCount++;
                    } catch (error) {
                        console.warn(`Failed to migrate todo ${todo.id}:`, error);
                    }
                }
            }

            // Only remove localStorage data if migration was successful
            if (migratedCount > 0) {
                localStorage.removeItem('todos');
                console.log(`Successfully migrated ${migratedCount} todos from localStorage`);
            }

            return migratedCount;
        } catch (error) {
            console.error('Error migrating from localStorage:', error);
            return 0;
        }
    }

    async getDatabaseSize() {
        try {
            if (!navigator.storage || !navigator.storage.estimate) {
                return { used: 'unknown', quota: 'unknown' };
            }

            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage ? Math.round(estimate.usage / 1024 / 1024 * 100) / 100 : 'unknown',
                quota: estimate.quota ? Math.round(estimate.quota / 1024 / 1024 * 100) / 100 : 'unknown'
            };
        } catch (error) {
            console.error('Error getting database size:', error);
            return { used: 'error', quota: 'error' };
        }
    }

    async healthCheck() {
        try {
            if (!this.db) {
                return { healthy: false, error: 'Database not initialized' };
            }

            // Try to read all todos to verify database integrity
            const todos = await this.getAllTodos();

            return {
                healthy: true,
                todoCount: todos.length,
                dbVersion: this.db.version,
                dbName: this.db.name
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}