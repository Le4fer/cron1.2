// main.js - VERSIÓN CORREGIDA Y COMPLETA
class CronosMind {
    constructor() {
        this.data = {
            user: {
                name: 'Usuario',
                streak: 0,
                joinedDate: new Date().toISOString(),
                settings: {
                    theme: 'dark',
                    notifications: true,
                    autoSave: true
                }
            },
            goals: [],
            journals: {},
            stats: {
                completedGoals: 0,
                totalEntries: 0,
                currentStreak: 0
            }
        };
        
        this.currentDate = new Date();
        this.autoSaveInterval = null;
        this.initialized = false;
        this.init();
    }
    
    async init() {
        if (this.initialized) return;
        
        await this.loadData();
        this.updateUI();
        this.setupEventListeners();
        this.startAutoSave();
        this.setupSync();
        this.setupKeyboardShortcuts();
        
        this.initialized = true;
        console.log('✅ CronosMind inicializado correctamente');
    }
    
    async loadData() {
        try {
            // Cargar desde localStorage primero
            const savedData = localStorage.getItem('cronosmind_data');
            if (savedData) {
                this.data = JSON.parse(savedData);
            }
            
            // Intentar cargar desde servidor
            try {
                const response = await fetch('php/load.php');
                if (response.ok) {
                    const serverData = await response.json();
                    this.data = { ...this.data, ...serverData };
                }
            } catch (e) {
                console.log('Modo offline - usando datos locales');
            }
            
            // Asegurar estructura de datos
            if (!this.data.goals) this.data.goals = [];
            if (!this.data.journals) this.data.journals = {};
            if (!this.data.stats) this.data.stats = { completedGoals: 0, totalEntries: 0, currentStreak: 0 };
            if (!this.data.user) this.data.user = { name: 'Usuario', streak: 0, joinedDate: new Date().toISOString() };
            
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }
    
    async saveData() {
        try {
            // Guardar en localStorage
            localStorage.setItem('cronosmind_data', JSON.stringify(this.data));
            
            // Actualizar estadísticas
            this.updateStats();
            
            // Guardar en servidor si está disponible
            try {
                await fetch('php/save.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.data)
                });
            } catch (e) {
                console.log('Modo offline - datos guardados localmente');
            }
            
            // Notificar a otros componentes
            this.notifyComponents();
            
        } catch (error) {
            console.error('Error guardando datos:', error);
        }
    }
    
    updateStats() {
        // Calcular estadísticas
        this.data.stats.completedGoals = (this.data.goals || []).filter(g => g.completed).length;
        this.data.stats.totalEntries = Object.values(this.data.journals || {}).reduce(
            (sum, day) => sum + (day?.length || 0), 0
        );
        this.data.stats.currentStreak = this.calculateStreak();
        this.data.user.streak = this.data.stats.currentStreak;
    }
    
    calculateStreak() {
        if (!this.data.journals) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            if (this.data.journals[dateStr] && this.data.journals[dateStr].length > 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    updateUI() {
        // Actualizar fecha
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Actualizar nombre de usuario
        const userNameElements = document.querySelectorAll('.user-name, #userNameDisplay');
        userNameElements.forEach(el => {
            if (el) el.textContent = this.data.user?.name || 'Usuario';
        });
        
        // Actualizar racha
        const streakElements = document.querySelectorAll('.user-streak span, #userStreak, #currentStreak');
        streakElements.forEach(el => {
            if (el) el.textContent = this.data.stats?.currentStreak || 0;
        });
        
        // Actualizar estadísticas del dashboard
        const completedElement = document.getElementById('completedGoals');
        if (completedElement) completedElement.textContent = this.data.stats?.completedGoals || 0;
        
        const inProgressElement = document.getElementById('inProgress');
        if (inProgressElement) {
            const pending = (this.data.goals || []).filter(g => !g.completed).length;
            inProgressElement.textContent = pending;
        }
        
        const entriesElement = document.getElementById('totalEntries');
        if (entriesElement) entriesElement.textContent = this.data.stats?.totalEntries || 0;
        
        const streakElement = document.getElementById('currentStreak');
        if (streakElement) streakElement.textContent = this.data.stats?.currentStreak || 0;
        
        // Cargar metas del día si estamos en dashboard
        this.loadDailyGoals();
    }
    
    loadDailyGoals() {
        const goalsList = document.getElementById('dailyGoals');
        if (!goalsList) return;
        
        const today = new Date().toDateString();
        const dailyGoals = (this.data.goals || []).filter(g => g.date === today);
        
        if (dailyGoals.length === 0) {
            goalsList.innerHTML = '<p class="no-data">No hay metas para hoy. ¡Crea una!</p>';
            return;
        }
        
        goalsList.innerHTML = '';
        dailyGoals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-item';
            goalElement.innerHTML = `
                <input type="checkbox" ${goal.completed ? 'checked' : ''} data-id="${goal.id}">
                <label>${goal.title}</label>
                <span class="goal-type ${goal.type}">${goal.type}</span>
            `;
            
            const checkbox = goalElement.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                goal.completed = e.target.checked;
                this.saveData();
                this.updateUI();
                this.showNotification(goal.completed ? '¡Meta completada! 🎉' : 'Meta pendiente');
            });
            
            goalsList.appendChild(goalElement);
        });
    }
    
    // MÉTODO PARA GUARDAR JOURNAL EN CUALQUIER PÁGINA
    saveJournalEntry(text, mood = 'neutral') {
        if (!text || text.trim() === '') {
            this.showNotification('Escribe algo antes de guardar', 'warning');
            return false;
        }
        
        const today = new Date().toDateString();
        
        if (!this.data.journals) this.data.journals = {};
        if (!this.data.journals[today]) this.data.journals[today] = [];
        
        const newEntry = {
            id: Date.now(),
            text: text.trim(),
            mood: mood,
            timestamp: new Date().toISOString(),
            wordCount: text.trim().split(/\s+/).length
        };
        
        this.data.journals[today].push(newEntry);
        this.saveData();
        this.updateUI();
        this.showNotification('✨ Reflexión guardada correctamente', 'success');
        
        // Disparar evento para actualizar otras páginas
        window.dispatchEvent(new CustomEvent('journalSaved', { detail: newEntry }));
        
        return true;
    }
    
    // MÉTODO PARA CREAR META EN CUALQUIER PÁGINA
    addNewGoal(title, type = 'obligatoria', category = 'personal', priority = 'media', deadline = null) {
        if (!title || title.trim() === '') {
            this.showNotification('El título es requerido', 'warning');
            return null;
        }
        
        const newGoal = {
            id: Date.now(),
            title: title.trim(),
            type: type,
            category: category,
            priority: priority,
            completed: false,
            date: new Date().toDateString(),
            createdAt: new Date().toISOString(),
            deadline: deadline || new Date().toISOString().split('T')[0]
        };
        
        if (!this.data.goals) this.data.goals = [];
        this.data.goals.push(newGoal);
        
        this.saveData();
        this.updateUI();
        this.showNotification('🎯 Meta creada exitosamente', 'success');
        
        // Disparar evento para actualizar otras páginas
        window.dispatchEvent(new CustomEvent('goalCreated', { detail: newGoal }));
        
        return newGoal;
    }
    
    // MÉTODO PARA ELIMINAR META
    deleteGoal(goalId) {
        if (!confirm('¿Estás seguro de eliminar esta meta?')) return false;
        
        this.data.goals = (this.data.goals || []).filter(g => g.id !== goalId);
        this.saveData();
        this.updateUI();
        this.showNotification('Meta eliminada', 'info');
        
        window.dispatchEvent(new CustomEvent('goalDeleted', { detail: { id: goalId } }));
        return true;
    }
    
    // MÉTODO PARA EDITAR META
    editGoal(goalId, updates) {
        const goal = (this.data.goals || []).find(g => g.id === goalId);
        if (!goal) return false;
        
        Object.assign(goal, updates);
        this.saveData();
        this.updateUI();
        this.showNotification('Meta actualizada', 'success');
        
        window.dispatchEvent(new CustomEvent('goalUpdated', { detail: goal }));
        return true;
    }
    
    // MÉTODO PARA TOGGLE META
    toggleGoal(goalId) {
        const goal = (this.data.goals || []).find(g => g.id === goalId);
        if (!goal) return false;
        
        goal.completed = !goal.completed;
        this.saveData();
        this.updateUI();
        this.showNotification(goal.completed ? '¡Meta completada! 🎉' : 'Meta pendiente');
        
        window.dispatchEvent(new CustomEvent('goalToggled', { detail: goal }));
        return true;
    }
    
    // MÉTODO PARA OBTENER METAS
    getGoals(type = 'all', date = null) {
        let goals = this.data.goals || [];
        
        if (type !== 'all') {
            goals = goals.filter(g => g.type === type);
        }
        
        if (date) {
            goals = goals.filter(g => g.date === date);
        }
        
        return goals;
    }
    
    // MÉTODO PARA OBTENER JOURNAL
    getJournals(date = null, limit = null) {
        if (!this.data.journals) return [];
        
        if (date) {
            return this.data.journals[date] || [];
        }
        
        let allEntries = [];
        Object.entries(this.data.journals).forEach(([date, entries]) => {
            entries.forEach(entry => {
                allEntries.push({ ...entry, displayDate: date });
            });
        });
        
        allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (limit) {
            allEntries = allEntries.slice(0, limit);
        }
        
        return allEntries;
    }
    
    // NOTIFICACIONES
    showNotification(message, type = 'success') {
        // Eliminar notificaciones anteriores
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📌';
    }
    
    // EXPORTAR DATOS
    async exportData(format = 'json') {
        try {
            const dataStr = JSON.stringify(this.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cronosmind_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Datos exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exportando:', error);
            this.showNotification('Error al exportar', 'error');
        }
    }
    
    // NOTIFICAR A OTROS COMPONENTES
    notifyComponents() {
        window.dispatchEvent(new CustomEvent('cronosmindDataUpdated', { 
            detail: { data: this.data } 
        }));
    }
    
    // SETUP DE EVENT LISTENERS
    setupEventListeners() {
        // Botón de nuevo registro en dashboard
        document.getElementById('newEntryBtn')?.addEventListener('click', () => {
            this.showJournalModal();
        });
        
        // Botón de exportar
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        // Botón de añadir meta
        document.getElementById('addGoalBtn')?.addEventListener('click', () => {
            const title = prompt('Nueva meta:');
            if (title) {
                const type = prompt('Tipo (obligatoria/importante/opcional):', 'obligatoria');
                this.addNewGoal(title, type);
            }
        });
        
        // Guardar journal rápido
        document.getElementById('saveQuickJournal')?.addEventListener('click', () => {
            const text = document.getElementById('quickJournal')?.value;
            if (text) {
                this.saveJournalEntry(text);
                document.getElementById('quickJournal').value = '';
            }
        });
    }
    
    showJournalModal() {
        const modal = document.getElementById('journalModal');
        if (modal) {
            modal.style.display = 'flex';
            const textarea = document.getElementById('modalJournalText');
            if (textarea) textarea.focus();
        }
    }
    
    // AUTO-SAVE
    startAutoSave() {
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = setInterval(() => {
            this.saveData();
        }, 30000); // Cada 30 segundos
    }
    
    // SINCRONIZACIÓN ENTRE PESTAÑAS
    setupSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'cronosmind_data' && e.newValue) {
                const newData = JSON.parse(e.newValue);
                if (JSON.stringify(this.data) !== JSON.stringify(newData)) {
                    this.data = newData;
                    this.updateUI();
                    this.showNotification('Datos sincronizados desde otra pestaña', 'info');
                }
            }
        });
    }
    
    // ATALOS DE TECLADO
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: Nueva entrada
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showJournalModal();
            }
            
            // Ctrl/Cmd + S: Guardar
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveData();
                this.showNotification('Guardado manual', 'success');
            }
        });
    }
}

// Hacer disponible globalmente
window.CronosMind = CronosMind;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (!window.cronosMind) {
        window.cronosMind = new CronosMind();
    }
});