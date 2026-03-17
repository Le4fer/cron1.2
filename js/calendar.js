class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.init();
    }
    
    init() {
        this.renderCalendar();
        this.setupEventListeners();
    }
    
    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Días de la semana
        const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let html = '';
        
        weekDays.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Primer día del mes
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        // Días vacíos al inicio
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateStr = date.toDateString();
            const isToday = this.isToday(date);
            const hasEntry = this.checkEntry(dateStr);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${hasEntry ? 'has-entry' : ''}" 
                     data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    ${hasEntry ? '<span class="day-indicator"></span>' : ''}
                </div>
            `;
        }
        
        calendarGrid.innerHTML = html;
        
        // Añadir event listeners a los días
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                this.showDayDetails(day.dataset.date);
            });
        });
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    checkEntry(dateStr) {
        return window.cronosMind?.data?.journals?.[dateStr]?.length > 0;
    }
    
    showDayDetails(dateStr) {
        const entries = window.cronosMind?.data?.journals?.[dateStr] || [];
        const goals = window.cronosMind?.data?.goals?.filter(g => g.date === dateStr) || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal day-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Detalles del Día</h2>
                <p class="modal-date">${dateStr}</p>
                
                <div class="day-entries">
                    <h3>Registros</h3>
                    ${entries.length ? entries.map(e => `
                        <div class="entry-item">
                            <p>${e.text}</p>
                            <small>${new Date(e.timestamp).toLocaleTimeString()}</small>
                        </div>
                    `).join('') : '<p class="no-data">Sin registros</p>'}
                </div>
                
                <div class="day-goals">
                    <h3>Metas</h3>
                    ${goals.length ? goals.map(g => `
                        <div class="goal-item">
                            <span class="goal-type ${g.type}">${g.type}</span>
                            <span>${g.title}</span>
                            <span>${g.completed ? '✅' : '⏳'}</span>
                        </div>
                    `).join('') : '<p class="no-data">Sin metas</p>'}
                </div>
                
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                    Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });
    }
}

// Inicializar calendario
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});