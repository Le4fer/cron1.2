// goals.js - VERSIÓN CORREGIDA CON GRÁFICOS MEJORADOS
class GoalsManager {
    constructor() {
        this.data = window.cronosMind?.data || { goals: [] };
        this.currentType = 'all';
        this.init();
    }

    init() {
        this.renderGoals();
        this.updateKPI();
        this.renderCharts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('newGoalBtn')?.addEventListener('click', () => {
            this.showGoalModal();
        });

        document.getElementById('goalForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentType = e.target.dataset.type;
                this.renderGoals();
            });
        });
    }

    showGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.display = 'flex';
            const form = document.getElementById('goalForm');
            if (form) form.reset();
            
            const today = new Date().toISOString().split('T')[0];
            const deadlineInput = document.getElementById('goalDeadline');
            if (deadlineInput) deadlineInput.value = today;
        }
    }

    saveGoal() {
        const title = document.getElementById('goalTitle')?.value;
        if (!title) {
            window.cronosMind?.showNotification('El título es requerido', 'warning');
            return;
        }

        const newGoal = {
            id: Date.now(),
            title: title,
            type: document.getElementById('goalType')?.value || 'obligatoria',
            category: document.getElementById('goalCategory')?.value || 'personal',
            priority: document.getElementById('goalPriority')?.value || 'media',
            deadline: document.getElementById('goalDeadline')?.value || new Date().toISOString().split('T')[0],
            description: document.getElementById('goalDescription')?.value || '',
            completed: false,
            createdAt: new Date().toISOString(),
            date: new Date().toDateString()
        };

        if (!this.data.goals) this.data.goals = [];
        this.data.goals.push(newGoal);
        
        if (window.cronosMind) {
            window.cronosMind.data = this.data;
            window.cronosMind.saveData();
        }
        
        document.getElementById('goalModal').style.display = 'none';
        this.renderGoals();
        this.updateKPI();
        this.renderCharts();
        
        window.cronosMind?.showNotification('Meta creada exitosamente', 'success');
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        const goals = this.getFilteredGoals();

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎯</span>
                    <p>No hay metas ${this.currentType !== 'all' ? 'de este tipo' : ''}</p>
                    <button class="btn btn-primary" onclick="window.goalsManager?.showGoalModal()">
                        Crear primera meta
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        goals.sort((a, b) => {
            const priorityWeight = { 'alta': 3, 'media': 2, 'baja': 1 };
            return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }).forEach(goal => {
            html += `
                <div class="goal-row ${goal.completed ? 'completed' : ''}" data-id="${goal.id}" data-type="${goal.type}">
                    <div class="goal-check">
                        <input type="checkbox" ${goal.completed ? 'checked' : ''} 
                               onchange="window.goalsManager?.toggleGoal(${goal.id})">
                    </div>
                    <div class="goal-title">
                        <span class="goal-name">${goal.title}</span>
                        ${goal.description ? `<small>${goal.description.substring(0, 30)}...</small>` : ''}
                    </div>
                    <div class="goal-type">
                        <span class="type-badge ${goal.type}">${this.getTypeLabel(goal.type)}</span>
                    </div>
                    <div class="goal-date">
                        <span class="deadline ${this.isDeadlineNear(goal.deadline) ? 'urgent' : ''}">
                            ${this.formatDate(goal.deadline)}
                        </span>
                    </div>
                    <div class="goal-category">
                        <span class="category-badge">
                            ${this.getCategoryIcon(goal.category)} ${goal.category}
                        </span>
                    </div>
                    <div class="goal-priority">
                        <span class="priority-indicator priority-${goal.priority}">
                            ${goal.priority}
                        </span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-icon" onclick="window.goalsManager?.editGoal(${goal.id})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="window.goalsManager?.deleteGoal(${goal.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getFilteredGoals() {
        const goals = this.data.goals || [];
        if (this.currentType === 'all') return goals;
        return goals.filter(g => g.type === this.currentType);
    }

    toggleGoal(goalId) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            if (window.cronosMind) {
                window.cronosMind.data = this.data;
                window.cronosMind.saveData();
            }
            this.renderGoals();
            this.updateKPI();
            this.renderCharts();
            
            window.cronosMind?.showNotification(
                goal.completed ? '¡Meta completada! 🎉' : 'Meta pendiente',
                goal.completed ? 'success' : 'info'
            );
        }
    }

    deleteGoal(goalId) {
        if (confirm('¿Estás seguro de eliminar esta meta?')) {
            this.data.goals = this.data.goals.filter(g => g.id !== goalId);
            if (window.cronosMind) {
                window.cronosMind.data = this.data;
                window.cronosMind.saveData();
            }
            this.renderGoals();
            this.updateKPI();
            this.renderCharts();
            window.cronosMind?.showNotification('Meta eliminada', 'info');
        }
    }

    editGoal(goalId) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalType').value = goal.type;
            document.getElementById('goalCategory').value = goal.category;
            document.getElementById('goalPriority').value = goal.priority;
            document.getElementById('goalDeadline').value = goal.deadline;
            document.getElementById('goalDescription').value = goal.description || '';
            
            this.data.goals = this.data.goals.filter(g => g.id !== goalId);
            this.showGoalModal();
        }
    }

    updateKPI() {
        const goals = this.data.goals || [];
        const total = goals.length;
        const completed = goals.filter(g => g.completed).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalGoals').textContent = total;
        document.getElementById('completedGoals').textContent = completed;
        document.getElementById('pendingGoals').textContent = pending;
        document.getElementById('completionRate').textContent = rate + '%';
    }

    renderCharts() {
        this.renderTypeChart();
        this.renderTrendChart();
        this.renderCategoryChart();
    }

    renderTypeChart() {
        const goals = this.data.goals || [];
        const types = {
            obligatoria: goals.filter(g => g.type === 'obligatoria' && g.completed).length,
            importante: goals.filter(g => g.type === 'importante' && g.completed).length,
            opcional: goals.filter(g => g.type === 'opcional' && g.completed).length
        };

        const total = Object.values(types).reduce((a, b) => a + b, 0);
        const chartDiv = document.getElementById('typeChart');
        
        if (!chartDiv) return;
        
        if (total === 0) {
            chartDiv.innerHTML = '<p class="no-data">Completa metas para ver gráficos</p>';
            return;
        }

        const obligatoriaWidth = (types.obligatoria / total) * 100;
        const importanteWidth = (types.importante / total) * 100;
        const opcionalWidth = (types.opcional / total) * 100;

        chartDiv.innerHTML = `
            <div class="pie-chart-simple">
                ${types.obligatoria > 0 ? 
                    `<div class="pie-segment" style="width: ${obligatoriaWidth}%; background: #ef4444;" title="Obligatorias: ${types.obligatoria}">
                        ${obligatoriaWidth > 10 ? 'Obl' : ''}
                    </div>` : ''}
                ${types.importante > 0 ? 
                    `<div class="pie-segment" style="width: ${importanteWidth}%; background: #eab308;" title="Importantes: ${types.importante}">
                        ${importanteWidth > 10 ? 'Imp' : ''}
                    </div>` : ''}
                ${types.opcional > 0 ? 
                    `<div class="pie-segment" style="width: ${opcionalWidth}%; background: #22c55e;" title="Opcionales: ${types.opcional}">
                        ${opcionalWidth > 10 ? 'Opc' : ''}
                    </div>` : ''}
            </div>
            <div class="chart-legend">
                <span><span class="dot" style="background: #ef4444;"></span> Obligatorias: ${types.obligatoria}</span>
                <span><span class="dot" style="background: #eab308;"></span> Importantes: ${types.importante}</span>
                <span><span class="dot" style="background: #22c55e;"></span> Opcionales: ${types.opcional}</span>
            </div>
        `;
    }

    renderTrendChart() {
        const goals = this.data.goals || [];
        const last7Days = [];
        const chartDiv = document.getElementById('trendChart');
        
        if (!chartDiv) return;
        
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            const dayGoals = goals.filter(g => g.date === dateStr);
            const completed = dayGoals.filter(g => g.completed).length;
            const total = dayGoals.length;
            
            last7Days.push({
                day: days[date.getDay()],
                rate: total > 0 ? Math.round((completed / total) * 100) : 0,
                completed: completed,
                total: total
            });
        }

        let bars = '';
        last7Days.forEach(day => {
            bars += `
                <div class="trend-bar-container" title="${day.completed}/${day.total} completadas">
                    <div class="trend-bar" style="height: ${day.rate}px">
                        <span class="trend-value">${day.rate}%</span>
                    </div>
                    <span class="trend-label">${day.day}</span>
                </div>
            `;
        });

        chartDiv.innerHTML = `<div class="trend-bars">${bars}</div>`;
    }

    renderCategoryChart() {
        const goals = this.data.goals || [];
        const categories = {};
        const chartDiv = document.getElementById('categoryChart');
        
        if (!chartDiv) return;
        
        goals.forEach(goal => {
            if (!categories[goal.category]) {
                categories[goal.category] = { total: 0, completed: 0 };
            }
            categories[goal.category].total++;
            if (goal.completed) categories[goal.category].completed++;
        });

        if (Object.keys(categories).length === 0) {
            chartDiv.innerHTML = '<p class="no-data">Sin datos por categoría</p>';
            return;
        }

        let bars = '';
        Object.entries(categories).forEach(([category, data]) => {
            const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
            bars += `
                <div class="category-bar">
                    <span class="cat-label">
                        ${this.getCategoryIcon(category)} ${category}
                        <span style="float: right;">${data.completed}/${data.total}</span>
                    </span>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%; background: ${this.getCategoryColor(category)}">
                            <span class="bar-text">${percentage}%</span>
                        </div>
                    </div>
                </div>
            `;
        });

        chartDiv.innerHTML = bars;
    }

    getTypeLabel(type) {
        const labels = { 
            'obligatoria': 'Obligatoria', 
            'importante': 'Importante', 
            'opcional': 'Opcional' 
        };
        return labels[type] || type;
    }

    getCategoryIcon(category) {
        const icons = { 
            'salud': '💪', 
            'desarrollo': '📚', 
            'trabajo': '💼', 
            'personal': '🌟', 
            'bienestar': '🧘' 
        };
        return icons[category] || '📌';
    }

    getCategoryColor(category) {
        const colors = { 
            'salud': '#22c55e', 
            'desarrollo': '#3b82f6', 
            'trabajo': '#f97316', 
            'personal': '#ec4899', 
            'bienestar': '#a855f7' 
        };
        return colors[category] || '#94a3b8';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }

    isDeadlineNear(dateStr) {
        const deadline = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
    }
}

if (typeof window !== 'undefined') {
    window.GoalsManager = GoalsManager;
}