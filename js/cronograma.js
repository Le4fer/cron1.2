// cronograma.js - VERSIÓN CORREGIDA Y MEJORADA
class CronogramaMaestro {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth();
        this.currentView = 'year';
        this.data = window.cronosMind?.data || { journals: {}, goals: [] };
        this.init();
    }

    init() {
        this.renderYearView();
        this.setupEventListeners();
        this.checkUrlParams();
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');
        if (view) {
            const btn = document.querySelector(`.btn-view[data-view="${view}"]`);
            if (btn) btn.click();
        }
    }

    renderYearView() {
        const grid = document.getElementById('yearGrid');
        if (!grid) return;
        
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        document.getElementById('displayYear').textContent = this.currentYear;

        let html = '';
        months.forEach((month, index) => {
            const monthData = this.getMonthData(index);
            const monthPercentage = monthData.total > 0 
                ? Math.round((monthData.completed / monthData.total) * 100) 
                : 0;
            
            html += `
                <div class="month-card" data-month="${index}" data-tooltip="Ver ${month} ${this.currentYear}">
                    <h3 class="month-title">${month}</h3>
                    <div class="month-preview-grid">
                        ${this.generateMonthPreview(index)}
                    </div>
                    <div class="month-stats">
                        <span class="stat completed">${monthData.completed}</span>
                        <span class="stat total">/ ${monthData.total}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${monthPercentage}%"></div>
                    </div>
                    <div class="month-percentage">${monthPercentage}%</div>
                </div>
            `;
        });

        grid.innerHTML = html;

        document.querySelectorAll('.month-card').forEach(card => {
            card.addEventListener('click', () => {
                const month = card.dataset.month;
                this.showMonthView(parseInt(month));
            });
        });
    }

    generateMonthPreview(month) {
        const daysInMonth = new Date(this.currentYear, month + 1, 0).getDate();
        let preview = '';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, month, day);
            const dateStr = date.toDateString();
            const status = this.getDayStatus(dateStr);
            
            preview += `<div class="preview-day status-${status}" title="${day} de ${this.getMonthName(month)}"></div>`;
        }
        
        return preview;
    }

    getMonthName(monthIndex) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[monthIndex];
    }

    getScheduledGoals(dateStr) {
        const date = new Date(dateStr);
        const weekday = date.getDay();

        return this.data.goals?.filter(goal => {
            if (goal.type !== 'obligatoria' || !goal.schedule) return false;
            const type = goal.schedule.type;

            if (type === 'diario') return true;
            if (type === 'semanal') return [1,2,3,4,5].includes(weekday);
            if (type === 'fin-de-semana') return [0,6].includes(weekday);
            if (type === 'personalizado') return Array.isArray(goal.schedule.days) && goal.schedule.days.includes(weekday);

            return false;
        }) || [];
    }

    getDayStatus(dateStr) {
        const journals = this.data.journals?.[dateStr];
        const dateGoals = this.data.goals?.filter(g => g.date === dateStr) || [];
        const scheduledGoals = this.getScheduledGoals(dateStr);
        const goals = [...dateGoals];

        scheduledGoals.forEach(goal => {
            if (!goals.find(g => g.id === goal.id)) {
                goals.push(goal);
            }
        });

        if (journals && journals.length > 0) return 'has-entry';
        if (goals.length > 0) {
            const completedGoals = goals.filter(g => this.isGoalCompletedOnDate(g, dateStr)).length;
            const percentage = (completedGoals / goals.length) * 100;

            if (percentage >= 80) return 'completed';
            if (percentage >= 40) return 'progress';
            return 'pending';
        }

        return 'empty';
    }

    isGoalCompletedOnDate(goal, dateStr) {
        if (goal.type === 'obligatoria') {
            return goal.completedDates?.includes(dateStr) || false;
        } else {
            return goal.completed;
        }
    }

    getMonthData(month) {
        const daysInMonth = new Date(this.currentYear, month + 1, 0).getDate();
        let completed = 0;
        let total = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, month, day);
            const dateStr = date.toDateString();
            const dateGoals = this.data.goals?.filter(g => g.date === dateStr) || [];
            const scheduledGoals = this.getScheduledGoals(dateStr);
            const goals = [...dateGoals];

            scheduledGoals.forEach(goal => {
                if (!goals.find(g => g.id === goal.id)) goals.push(goal);
            });

            if (goals.length > 0) {
                total++;
                const completedGoals = goals.filter(g => this.isGoalCompletedOnDate(g, dateStr)).length;
                if (completedGoals === goals.length) completed++;
            }
        }

        return { completed, total };
    }

    showYearView() {
        this.currentView = 'year';
        document.getElementById('yearView').style.display = 'block';
        document.getElementById('quarterView').style.display = 'none';
        document.getElementById('monthView').style.display = 'none';
        
        // Actualizar URL sin recargar
        const url = new URL(window.location);
        url.searchParams.set('view', 'year');
        window.history.pushState({}, '', url);
    }

    showQuarterView() {
        this.currentView = 'quarter';
        document.getElementById('yearView').style.display = 'none';
        document.getElementById('monthView').style.display = 'none';
        
        const quarterView = document.getElementById('quarterView');
        quarterView.style.display = 'block';
        
        document.getElementById('quarterYear').textContent = this.currentYear;
        this.renderQuarterView();
        
        const url = new URL(window.location);
        url.searchParams.set('view', 'quarter');
        window.history.pushState({}, '', url);
    }

    showMonthView(month = this.currentMonth) {
        this.currentView = 'month';
        this.currentMonth = month;
        
        document.getElementById('yearView').style.display = 'none';
        document.getElementById('quarterView').style.display = 'none';
        
        const monthView = document.getElementById('monthView');
        monthView.style.display = 'block';
        
        this.renderMonthView(month);
        
        const url = new URL(window.location);
        url.searchParams.set('view', 'month');
        window.history.pushState({}, '', url);
    }

    renderMonthView(month) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        document.getElementById('currentMonthTitle').textContent = 
            `${monthNames[month]} ${this.currentYear}`;

        const daysInMonth = new Date(this.currentYear, month + 1, 0).getDate();
        const firstDay = new Date(this.currentYear, month, 1).getDay();

        const daysGrid = document.getElementById('daysGrid');
        let html = '';

        // Días vacíos al inicio
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="day-cell empty"></div>';
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, month, day);
            const dateStr = date.toDateString();
            const status = this.getDayStatus(dateStr);
            const dayData = this.getDayData(dateStr);
            const isToday = this.isToday(date);

            html += `
                <div class="day-cell ${status} ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    <div class="day-indicators">
                        ${dayData.hasEntry ? '<span class="indicator entry" title="Tiene reflexión"></span>' : ''}
                        ${dayData.importantGoal ? '<span class="indicator important" title="Meta importante pendiente"></span>' : ''}
                    </div>
                    ${dayData.totalGoals > 0 ? `
                        <div class="day-progress">
                            <small>${dayData.completedGoals}/${dayData.totalGoals}</small>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        daysGrid.innerHTML = html;

        // Agregar event listeners a los días
        document.querySelectorAll('.day-cell:not(.empty)').forEach(cell => {
            cell.addEventListener('click', () => {
                const dateStr = cell.dataset.date;
                this.showDayDetails(dateStr);
            });
        });

        // Renderizar resumen del mes
        this.renderMonthSummary(month);
    }

    renderMonthSummary(month) {
        const monthStats = this.getMonthData(month);
        const totalDays = new Date(this.currentYear, month + 1, 0).getDate();
        const percentage = monthStats.total > 0 
            ? Math.round((monthStats.completed / monthStats.total) * 100) 
            : 0;

        const summary = document.getElementById('monthSummary');
        summary.innerHTML = `
            <h3>Resumen de ${this.getMonthName(month)} ${this.currentYear}</h3>
            <div class="summary-stats">
                <div class="summary-item">
                    <span class="label">Días con actividad</span>
                    <span class="value">${monthStats.total}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Días completados</span>
                    <span class="value">${monthStats.completed}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Efectividad</span>
                    <span class="value">${percentage}%</span>
                </div>
            </div>
        `;
    }

    renderQuarterView() {
        const quarters = [
            { name: 'Primer Trimestre', months: [0, 1, 2], icon: '🌸' },
            { name: 'Segundo Trimestre', months: [3, 4, 5], icon: '☀️' },
            { name: 'Tercer Trimestre', months: [6, 7, 8], icon: '🍂' },
            { name: 'Cuarto Trimestre', months: [9, 10, 11], icon: '❄️' }
        ];

        const grid = document.getElementById('quartersGrid');
        let html = '';

        quarters.forEach(quarter => {
            const quarterData = this.getQuarterData(quarter.months);
            const percentage = quarterData.total > 0 
                ? Math.round((quarterData.completed / quarterData.total) * 100) 
                : 0;

            html += `
                <div class="quarter-card">
                    <h3>${quarter.icon} ${quarter.name}</h3>
                    <div class="quarter-stats">
                        <div class="big-number">${percentage}%</div>
                        <div class="quarter-details">
                            <div>✅ Completado: ${quarterData.completed}</div>
                            <div>📊 Total: ${quarterData.total}</div>
                        </div>
                    </div>
                    <div class="progress-bar large">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="quarter-breakdown">
                        ${quarter.months.map(m => `
                            <div class="month-mini">
                                <span>${this.getMonthName(m)}</span>
                                <span>${this.getMonthData(m).completed}/${this.getMonthData(m).total}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
        this.renderTrendChart();
    }

    renderTrendChart() {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthlyData = months.map((_, index) => {
            const data = this.getMonthData(index);
            return data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        });

        const maxValue = Math.max(...monthlyData, 10);
        const chart = document.getElementById('trendChart');

        let bars = '';
        months.forEach((month, i) => {
            const height = (monthlyData[i] / maxValue) * 150;
            bars += `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${height}px">
                        <span class="bar-value">${monthlyData[i]}%</span>
                    </div>
                    <span class="bar-label">${month}</span>
                </div>
            `;
        });

        chart.innerHTML = `<div class="chart-container">${bars}</div>`;
    }

    getQuarterData(months) {
        let total = 0;
        let completed = 0;

        months.forEach(month => {
            const monthData = this.getMonthData(month);
            total += monthData.total;
            completed += monthData.completed;
        });

        return { total, completed };
    }

    getDayData(dateStr) {
        const dateGoals = this.data.goals?.filter(g => g.date === dateStr) || [];
        const scheduledGoals = this.getScheduledGoals(dateStr);
        const goals = [...dateGoals];

        scheduledGoals.forEach(goal => {
            if (!goals.find(g => g.id === goal.id)) goals.push(goal);
        });

        const completedGoals = goals.filter(g => this.isGoalCompletedOnDate(g, dateStr)).length;
        const hasEntry = this.data.journals?.[dateStr]?.length > 0;
        const importantGoal = goals.some(g => g.type === 'importante' && !this.isGoalCompletedOnDate(g, dateStr));

        return {
            totalGoals: goals.length,
            completedGoals,
            hasEntry,
            importantGoal
        };
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    showDayDetails(dateStr) {
        const modal = document.getElementById('dayModal');
        const modalTitle = document.getElementById('modalDateTitle');
        const modalBody = document.getElementById('dayDetails');

        const date = new Date(dateStr);
        modalTitle.textContent = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const journals = this.data.journals?.[dateStr] || [];
        const dateGoals = this.data.goals?.filter(g => g.date === dateStr) || [];
        const scheduledGoals = this.getScheduledGoals(dateStr);
        const goals = [...dateGoals];

        scheduledGoals.forEach(goal => {
            if (!goals.find(g => g.id === goal.id)) goals.push(goal);
        });

        let html = '';

        if (journals.length > 0) {
            html += '<div class="day-section"><h4>📔 Reflexiones</h4>';
            journals.forEach(j => {
                html += `
                    <div class="entry-item">
                        <p>${j.text}</p>
                        <small>${new Date(j.timestamp).toLocaleTimeString()} · ${j.mood || 'neutral'}</small>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (goals.length > 0) {
            html += '<div class="day-section"><h4>🎯 Metas</h4>';
            goals.forEach(g => {
                const isCompleted = g.type === 'obligatoria' ? this.isGoalCompletedOnDate(g, dateStr) : g.completed;
                html += `
                    <div class="goal-item-mini ${isCompleted ? 'completed' : ''}">
                        <label class="goal-checkbox">
                            <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                                   onchange="window.cronograma?.toggleGoalOnDate(${g.id}, '${dateStr}')">
                            <span class="checkmark"></span>
                        </label>
                        <span class="goal-type ${g.type}">${g.type}</span>
                        <span>${g.title}</span>
                        <span>${isCompleted ? '✅' : '⏳'}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (!journals.length && !goals.length) {
            html = '<p class="no-data">Sin actividad registrada en este día</p>';
        }

        modalBody.innerHTML = html;
        modal.style.display = 'flex';
    }

    isGoalCompletedOnDate(goal, dateStr) {
        if (goal.type !== 'obligatoria') return goal.completed;
        return goal.completedDates?.includes(dateStr) || false;
    }

    toggleGoalOnDate(goalId, dateStr) {
        const goal = this.data.goals?.find(g => g.id === goalId);
        if (!goal) return;

        if (goal.type === 'obligatoria') {
            if (!goal.completedDates) goal.completedDates = [];
            const index = goal.completedDates.indexOf(dateStr);
            if (index > -1) {
                goal.completedDates.splice(index, 1);
            } else {
                goal.completedDates.push(dateStr);
            }
        } else {
            goal.completed = !goal.completed;
        }

        // Guardar cambios
        if (window.cronosMind) {
            window.cronosMind.data = this.data;
            window.cronosMind.saveData();
        }

        // Actualizar modal
        this.showDayDetails(dateStr);

        // Notificación
        const isCompleted = this.isGoalCompletedOnDate(goal, dateStr);
        window.cronosMind?.showNotification(
            isCompleted ? '¡Meta completada! 🎉' : 'Meta pendiente',
            isCompleted ? 'success' : 'info'
        );
    }

    setupEventListeners() {
        // Navegación de años
        document.getElementById('prevYear')?.addEventListener('click', () => {
            this.currentYear--;
            this.renderYearView();
            if (this.currentView === 'quarter') this.renderQuarterView();
            if (this.currentView === 'month') this.renderMonthView(this.currentMonth);
        });

        document.getElementById('nextYear')?.addEventListener('click', () => {
            this.currentYear++;
            this.renderYearView();
            if (this.currentView === 'quarter') this.renderQuarterView();
            if (this.currentView === 'month') this.renderMonthView(this.currentMonth);
        });

        // Cambio de vistas
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const view = e.target.dataset.view;
                if (view === 'year') this.showYearView();
                else if (view === 'quarter') this.showQuarterView();
                else if (view === 'month') this.showMonthView(this.currentMonth);
            });
        });

        // Navegación de meses
        document.querySelector('.back-to-year')?.addEventListener('click', () => {
            this.showYearView();
            document.querySelector('.btn-view[data-view="year"]')?.click();
        });

        document.getElementById('prevMonth')?.addEventListener('click', () => {
            if (this.currentMonth > 0) {
                this.currentMonth--;
                this.renderMonthView(this.currentMonth);
            }
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            if (this.currentMonth < 11) {
                this.currentMonth++;
                this.renderMonthView(this.currentMonth);
            }
        });

        // Cerrar modal
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('dayModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Inicialización segura
if (typeof window !== 'undefined') {
    window.CronogramaMaestro = CronogramaMaestro;
}