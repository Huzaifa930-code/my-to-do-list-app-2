class TodoApp {
constructor() {
        this.todos = [];
        this.filteredTodos = [];
        this.editingId = null;
        this.draggedElement = null;
        this.db = new TodoDatabase();
        this.deadlineUpdateInterval = null;

        // Constants
        this.ANIMATION_DELAY = 300;
        this.DEADLINE_UPDATE_INTERVAL = 60000;
    }

    async initializeApp() {
        try {
            await this.db.init();

            const migratedCount = await this.db.migrateFromLocalStorage();
            if (migratedCount > 0) {
                console.log(`Migrated ${migratedCount} todos from localStorage to IndexedDB`);
            }

            await this.loadTodos();
            this.initializeElements();
            this.bindEvents();
            this.applyFilters();
            this.updateStats();
            this.setupKeyboardShortcuts();

            this.deadlineUpdateInterval = setInterval(() => this.updateDeadlines(), this.DEADLINE_UPDATE_INTERVAL);
            this.updateDeadlines();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.initializeElements();
            this.bindEvents();
            this.applyFilters();
            this.updateStats();
            this.setupKeyboardShortcuts();
        }
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        if (this.deadlineUpdateInterval) {
            clearInterval(this.deadlineUpdateInterval);
            this.deadlineUpdateInterval = null;
        }
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.deadlineInput = document.getElementById('deadlineInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.categorySelect = document.getElementById('categorySelect');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.searchInput = document.getElementById('searchInput');
        this.filterCategory = document.getElementById('filterCategory');
        this.filterStatus = document.getElementById('filterStatus');
        this.filterPriority = document.getElementById('filterPriority');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.pendingTasks = document.getElementById('pendingTasks');
        this.historyBtn = document.getElementById('historyBtn');
        this.historyModal = document.getElementById('historyModal');
        this.historyList = document.getElementById('historyList');
        this.closeModal = document.querySelector('.close');
        this.errorContainer = this.createErrorContainer();
    }

    createErrorContainer() {
        let container = document.getElementById('error-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'error-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: linear-gradient(135deg, #ffc107 0%, #ffeb3b 100%);
            color: #000000;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;

        this.errorContainer.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 5000);
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.deadlineInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter events
        this.searchInput.addEventListener('input', () => this.applyFilters());
        this.filterCategory.addEventListener('change', () => this.applyFilters());
        this.filterStatus.addEventListener('change', () => this.applyFilters());
        this.filterPriority.addEventListener('change', () => this.applyFilters());

        // History modal events
        this.historyBtn.addEventListener('click', () => this.showHistory());
        this.closeModal.addEventListener('click', () => this.hideHistory());
        window.addEventListener('click', (e) => {
            if (e.target === this.historyModal) {
                this.hideHistory();
            }
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.destroy());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.addTodo();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.searchInput.focus();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAllTasks();
                        break;
                }
            }

            if (e.key === 'Delete') {
                this.deleteSelectedTasks();
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Input validation and sanitization
    validateTodoInput(text, deadline) {
        if (!text || text.trim().length === 0) {
            this.showError('Please enter a task description before adding!');
            return false;
        }

        if (text.length > 500) {
            this.showError('Todo text cannot exceed 500 characters');
            return false;
        }

        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (deadlineDate <= new Date()) {
                this.showError('Deadline must be in the future');
                return false;
            }
        }

        return true;
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';

        // Basic XSS protection
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim();
    }

    async addTodo() {
        const text = this.sanitizeInput(this.todoInput.value.trim());
        const deadline = this.deadlineInput.value;
        const priority = this.prioritySelect.value;
        const category = this.categorySelect.value;

        // Validate input
        if (!this.validateTodoInput(text, deadline)) return;

        const todo = {
            id: this.generateId(),
            text,
            deadline: deadline || null,
            priority,
            category,
            completed: false,
            createdAt: new Date().toISOString(),
            selected: false
        };

        // Optimistically add to UI first
        this.todos.unshift(todo);
        this.applyFilters();
        this.updateStats();

        try {
            await this.db.addTodo(todo);

            // Clear form only after successful save
            this.todoInput.value = '';
            this.deadlineInput.value = '';
            this.prioritySelect.value = 'medium';
            this.categorySelect.value = 'general';
            this.todoInput.focus();
        } catch (error) {
            console.error('Failed to add todo:', error);
            // Revert optimistic update
            this.todos = this.todos.filter(t => t.id !== todo.id);
            this.applyFilters();
            this.updateStats();
            this.showError('Failed to save todo. Please try again.');
        }
    }

    async deleteTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('slide-out');
            setTimeout(async () => {
                try {
                    await this.db.deleteTodo(id);
                    this.todos = this.todos.filter(todo => todo.id !== id);
                    this.applyFilters();
                    this.updateStats();
                } catch (error) {
                    console.error('Failed to delete todo:', error);
                    // Revert animation
                    todoElement.classList.remove('slide-out');
                    this.showError('Failed to delete todo. Please try again.');
                }
            }, this.ANIMATION_DELAY);
        }
    }

    async toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const originalCompleted = todo.completed;
        const originalCompletedAt = todo.completedAt;

        // Optimistic update
        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? new Date().toISOString() : null;
        this.applyFilters();
        this.updateStats();

        try {
            await this.db.updateTodo(todo);
        } catch (error) {
            console.error('Failed to update todo:', error);
            // Revert to original state
            todo.completed = originalCompleted;
            todo.completedAt = originalCompletedAt;
            this.applyFilters();
            this.updateStats();
            this.showError('Failed to update todo. Please try again.');
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.applyFilters();

        // Focus on the edit input with proper error handling
        this.focusEditInput(id);
    }

    focusEditInput(id) {
        // Use requestAnimationFrame for better DOM timing
        requestAnimationFrame(() => {
            const editInput = document.querySelector(`[data-id="${id}"] .todo-text.editing`);
            if (editInput && editInput.focus) {
                try {
                    editInput.focus();
                    editInput.select();
                } catch (error) {
                    console.warn('Failed to focus edit input:', error);
                }
            }
        });
    }

    async saveEdit(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            const sanitizedText = this.sanitizeInput(newText.trim());
            const originalText = todo.text;

            // Optimistic update
            todo.text = sanitizedText;

            try {
                await this.db.updateTodo(todo);
            } catch (error) {
                console.error('Failed to update todo:', error);
                // Revert change
                todo.text = originalText;
                this.showError('Failed to update todo. Please try again.');
            }
        }
        this.editingId = null;
        this.applyFilters();
    }

    cancelEdit() {
        this.editingId = null;
        this.applyFilters();
    }

    formatTimeRemaining(deadline, isCompleted = false) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const timeDiff = deadlineDate - now;

        if (isCompleted) return 'COMPLETED';
        if (timeDiff <= 0) return 'OVERDUE';

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    }

    getDeadlineClass(deadline, isCompleted = false) {
        if (isCompleted) return 'deadline-completed';

        const now = new Date();
        const deadlineDate = new Date(deadline);
        const timeDiff = deadlineDate - now;
        const hoursRemaining = timeDiff / (1000 * 60 * 60);

        if (timeDiff <= 0) return 'deadline-overdue';
        if (hoursRemaining <= 1) return 'deadline-urgent';
        if (hoursRemaining <= 24) return 'deadline-soon';
        return 'deadline-normal';
    }

    updateDeadlines() {
        const deadlineDisplays = document.querySelectorAll('.deadline-display');
        deadlineDisplays.forEach(display => {
            try {
                const deadline = display.dataset.deadline;
                const todoItem = display.closest('.todo-item');

                if (!deadline || !todoItem) return;

                const todoId = todoItem.dataset.id;
                if (!todoId) return;

                const todo = this.todos.find(t => t.id === todoId);
                if (!todo) return;

                const isCompleted = todo.completed;
                const timeRemaining = this.formatTimeRemaining(deadline, isCompleted);
                const deadlineClass = this.getDeadlineClass(deadline, isCompleted);

                display.textContent = `Due: ${timeRemaining}`;
                display.className = `deadline-display ${deadlineClass}`;
            } catch (error) {
                console.warn('Error updating deadline display:', error);
            }
        });
    }

    async applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const categoryFilter = this.filterCategory.value;
        const statusFilter = this.filterStatus.value;
        const priorityFilter = this.filterPriority.value;

        try {
            // Use database filtering for better performance
            this.filteredTodos = await this.db.getTodosWithFilters({
                category: categoryFilter,
                priority: priorityFilter,
                completed: statusFilter,
                searchTerm: searchTerm || undefined
            });
        } catch (error) {
            console.error('Database filtering failed, falling back to client-side:', error);
            // Fallback to client-side filtering
            this.filteredTodos = this.todos.filter(todo => {
                const matchesSearch = todo.text.toLowerCase().includes(searchTerm);
                const matchesCategory = categoryFilter === 'all' || todo.category === categoryFilter;
                const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'completed' && todo.completed) ||
                    (statusFilter === 'pending' && !todo.completed);
                const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;

                return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
            });
        }

        this.render();
    }

    selectAllTasks() {
        const hasSelected = this.todos.some(todo => todo.selected);
        this.todos.forEach(todo => todo.selected = !hasSelected);
        this.applyFilters();
    }

    deleteSelectedTasks() {
        const selectedTodos = this.todos.filter(todo => todo.selected);
        if (selectedTodos.length > 0) {
            selectedTodos.forEach(todo => this.deleteTodo(todo.id));
        }
    }

    toggleSelect(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.selected = !todo.selected;
            this.applyFilters();
        }
    }

    setupDragAndDrop() {
        const todoItems = document.querySelectorAll('.todo-item');
        todoItems.forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', (e) => {
                this.draggedElement = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                if (this.draggedElement) {
                    this.draggedElement.classList.remove('dragging');
                    this.draggedElement = null;
                }
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedElement && this.draggedElement !== item) {
                    const draggedId = this.draggedElement.dataset.id;
                    const targetId = item.dataset.id;

                    const draggedIndex = this.todos.findIndex(t => t.id === draggedId);
                    const targetIndex = this.todos.findIndex(t => t.id === targetId);

                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        const draggedTodo = this.todos.splice(draggedIndex, 1)[0];
                        this.todos.splice(targetIndex, 0, draggedTodo);

                        this.updateTodoOrder();
                        this.applyFilters();
                    }
                }
            });
        });
    }

    getCategoryIcon(category) {
        const icons = {
            general: 'GEN',
            work: 'WORK',
            personal: 'PERS',
            shopping: 'SHOP',
            health: 'HLTH'
        };
        return icons[category] || 'GEN';
    }

    getPriorityIcon(priority) {
        const icons = {
            high: 'HIGH',
            medium: 'MED',
            low: 'LOW'
        };
        return icons[priority] || 'MED';
    }

    render() {
        // Determine if any filters are active
        const hasActiveFilters = this.searchInput.value ||
            this.filterCategory.value !== 'all' ||
            this.filterStatus.value !== 'all' ||
            this.filterPriority.value !== 'all';

        const todosToRender = hasActiveFilters ? this.filteredTodos : this.todos;

        this.todoList.innerHTML = '';

        todosToRender.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''} ${todo.selected ? 'selected' : ''} fade-in`;
            li.dataset.id = todo.id;

            const deadlineHtml = todo.deadline ? `
                <div class="deadline-display ${this.getDeadlineClass(todo.deadline, todo.completed)}" data-deadline="${todo.deadline}">
                    Due: ${this.formatTimeRemaining(todo.deadline, todo.completed)}
                </div>
            ` : '';

            const isEditing = this.editingId === todo.id;
            const textContent = isEditing ?
                `<input type="text" class="todo-text editing" value="${todo.text}" />` :
                `<span class="todo-text">${todo.text}</span>`;

            li.innerHTML = `
                <div class="todo-content">
                    <div class="todo-header">
                        <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-action="toggle">
                            ${todo.completed ? '✓' : ''}
                        </div>
                        ${textContent}
                    </div>
                    <div class="todo-meta">
                        <span class="priority-badge priority-${todo.priority}">
                            ${this.getPriorityIcon(todo.priority)} ${todo.priority.toUpperCase()}
                        </span>
                        <span class="category-badge">
                            ${this.getCategoryIcon(todo.category)} ${todo.category.toUpperCase()}
                        </span>
                        <span class="created-date">Created: ${new Date(todo.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${deadlineHtml}
                </div>
                <div class="todo-actions">
                    <button class="drag-handle" title="Drag to reorder">|||</button>
                    ${isEditing ?
                        `<button class="edit-btn" data-action="save">Save</button>
                         <button class="edit-btn" data-action="cancel">Cancel</button>` :
                        `<button class="edit-btn" data-action="edit">Edit</button>`
                    }
                    <button class="delete-btn" data-action="delete">Delete</button>
                </div>
            `;

            // Add event listeners
            const checkbox = li.querySelector('.todo-checkbox');
            const editBtn = li.querySelector('[data-action="edit"]');
            const saveBtn = li.querySelector('[data-action="save"]');
            const cancelBtn = li.querySelector('[data-action="cancel"]');
            const deleteBtn = li.querySelector('[data-action="delete"]');
            const editInput = li.querySelector('.todo-text.editing');

            if (checkbox) {
                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleComplete(todo.id);
                });
            }

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startEdit(todo.id);
                });
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const input = li.querySelector('.todo-text.editing');
                    this.saveEdit(todo.id, input.value);
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.cancelEdit();
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteTodo(todo.id);
                });
            }

            if (editInput) {
                editInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.saveEdit(todo.id, e.target.value);
                    } else if (e.key === 'Escape') {
                        this.cancelEdit();
                    }
                });

                editInput.addEventListener('blur', () => {
                    this.saveEdit(todo.id, editInput.value);
                });
            }

            // Toggle selection on click
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.todo-actions') && !e.target.closest('.todo-checkbox') && !isEditing) {
                    this.toggleSelect(todo.id);
                }
            });

            this.todoList.appendChild(li);
        });

        // Setup drag and drop after rendering
        requestAnimationFrame(() => this.setupDragAndDrop());
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        this.totalTasks.textContent = total;
        this.completedTasks.textContent = completed;
        this.pendingTasks.textContent = pending;
    }

    async updateTodoOrder() {
        try {
            for (const todo of this.todos) {
                await this.db.updateTodo(todo);
            }
        } catch (error) {
            console.error('Failed to update todo order:', error);
            this.showError('Failed to save new order. Changes may be lost.');
        }
    }

    async loadTodos() {
        try {
            this.todos = await this.db.getAllTodos();
        } catch (error) {
            console.error('Failed to load todos:', error);
            this.todos = [];
            this.showError('Failed to load todos from database.');
        }
    }

    showHistory() {
        this.renderHistory();
        this.historyModal.style.display = 'block';
    }

    hideHistory() {
        this.historyModal.style.display = 'none';
    }

    renderHistory() {
        const completedTodos = this.todos.filter(todo => todo.completed);

        if (completedTodos.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">No completed tasks yet!</p>';
            return;
        }

        // Sort by completion date (most recent first)
        completedTodos.sort((a, b) => {
            const aDate = new Date(a.completedAt || a.createdAt);
            const bDate = new Date(b.completedAt || b.createdAt);
            return bDate - aDate;
        });

        this.historyList.innerHTML = completedTodos.map(todo => `
            <div class="history-item">
                <div class="history-content">
                    <div class="history-text">${todo.text}</div>
                    <div class="history-meta">
                        <span class="priority-badge priority-${todo.priority}">
                            ${this.getPriorityIcon(todo.priority)} ${todo.priority.toUpperCase()}
                        </span>
                        <span class="category-badge">
                            ${this.getCategoryIcon(todo.category)} ${todo.category.toUpperCase()}
                        </span>
                        <span class="completed-date">Completed: ${new Date(todo.completedAt || todo.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${todo.deadline ? `
                        <div class="deadline-display deadline-completed" data-deadline="${todo.deadline}">
                            Original Due: ${new Date(todo.deadline).toLocaleDateString()}
                        </div>
                    ` : ''}
                </div>
                <div class="history-actions">
                    <button class="restore-btn" onclick="app.restoreTask('${todo.id}')">Restore</button>
                    <button class="delete-btn" onclick="app.permanentlyDelete('${todo.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async restoreTask(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const originalCompleted = todo.completed;
            const originalCompletedAt = todo.completedAt;

            try {
                todo.completed = false;
                todo.completedAt = null;
                await this.db.updateTodo(todo);
                this.applyFilters();
                this.updateStats();
                this.renderHistory();
            } catch (error) {
                console.error('Failed to restore todo:', error);
                // Revert changes
                todo.completed = originalCompleted;
                todo.completedAt = originalCompletedAt;
                this.showError('Failed to restore todo. Please try again.');
            }
        }
    }

    async permanentlyDelete(id) {
        if (confirm('Are you sure you want to permanently delete this task?')) {
            try {
                await this.db.deleteTodo(id);
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.updateStats();
                this.renderHistory();
            } catch (error) {
                console.error('Failed to permanently delete todo:', error);
                this.showError('Failed to delete todo. Please try again.');
            }
        }
    }
}

// Initialize the app when DOM is loaded
let app;
let auth;

document.addEventListener("DOMContentLoaded", () => {
    app = new TodoApp();
    auth = new AuthManager(app);

    // Make sure auth is globally available
    window.auth = auth;
});
