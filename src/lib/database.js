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
        this.db.onerror = (event) => {
          console.error('Database error:', event.target.error);
        };
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;

          if (!db.objectStoreNames.contains('todos')) {
            const store = db.createObjectStore('todos', { keyPath: 'id' });
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
    return this.executeTransaction('todos', 'readwrite', (store) => store.add(todo));
  }

  async updateTodo(todo) {
    if (!todo || !todo.id) {
      throw new Error('Invalid todo object: missing id');
    }
    return this.executeTransaction('todos', 'readwrite', (store) => store.put(todo));
  }

  async deleteTodo(id) {
    if (!id) {
      throw new Error('Invalid todo id');
    }
    return this.executeTransaction('todos', 'readwrite', (store) => store.delete(id));
  }

  async getAllTodos() {
    return this.executeTransaction('todos', 'readonly', (store) => store.getAll());
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default TodoDatabase;