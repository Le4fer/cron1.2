// journal.js - VERSIÓN CORREGIDA
class JournalManager {
    constructor() {
        this.data = window.cronosMind?.data || { journals: {} };
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderTimeline();
        this.renderHeatCalendar();
        this.updateStats();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('newJournalBtn')?.addEventListener('click', () => {
            this.showEditor();
        });

        document.getElementById('saveJournalBtn')?.addEventListener('click', () => {
            this.saveEntry();
        });

        document.getElementById('cancelJournalBtn')?.addEventListener('click', () => {
            this.hideEditor();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTimeline();
            });
        });
    }

    showEditor() {
        const editor = document.getElementById('journalEditor');
        const textarea = document.getElementById('journalText');
        if (editor && textarea) {
            editor.style.display = 'block';
            textarea.focus();
        }
    }

    hideEditor() {
        const editor = document.getElementById('journalEditor');
        const textarea = document.getElementById('journalText');
        if (editor) editor.style.display = 'none';
        if (textarea) textarea.value = '';
    }

    saveEntry() {
        const text = document.getElementById('journalText')?.value.trim();
        const mood = document.getElementById('moodSelector')?.value || 'neutral';
        
        if (!text) {
            window.cronosMind?.showNotification('Escribe algo antes de guardar', 'warning');
            return;
        }

        const today = new Date().toDateString();
        
        if (!this.data.journals) this.data.journals = {};
        if (!this.data.journals[today]) this.data.journals[today] = [];

        this.data.journals[today].push({
            id: Date.now(),
            text: text,
            mood: mood,
            timestamp: new Date().toISOString(),
            wordCount: text.split(/\s+/).length
        });

        if (window.cronosMind) {
            window.cronosMind.data = this.data;
            window.cronosMind.saveData();
        }
        
        this.hideEditor();
        this.renderTimeline();
        this.updateStats();
        this.renderHeatCalendar();
        
        window.cronosMind?.showNotification('Reflexión guardada', 'success');
    }

    renderTimeline() {
        const container = document.getElementById('timelineEntries');
        if (!container) return;

        const entries = this.getFilteredEntries();
        
        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-timeline">
                    <span class="empty-icon">📔</span>
                    <p>No hay reflexiones aún</p>
                    <small>Comienza a escribir tu primera entrada</small>
                </div>
            `;
            return;
        }

        let html = '';
        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            html += `
                <div class="timeline-entry" data-id="${entry.id}">
                    <div class="entry-header">
                        <div class="entry-date">
                            <span class="day">${date.getDate()}</span>
                            <span class="month">${this.getMonthAbbr(date.getMonth())}</span>
                        </div>
                        <div class="entry-meta">
                            <span class="entry-mood">${this.getMoodEmoji(entry.mood)}</span>
                            <span class="entry-time">${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div class="entry-content">
                        <p>${entry.text}</p>
                    </div>
                    <div class="entry-footer">
                        <span class="word-count">${entry.wordCount} palabras</span>
                        <div class="entry-actions">
                            <button class="edit-entry" onclick="window.journalManager?.editEntry(${entry.id})">✏️</button>
                            <button class="delete-entry" onclick="window.journalManager?.deleteEntry(${entry.id})">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getFilteredEntries() {
        let allEntries = [];
        
        Object.keys(this.data.journals || {}).forEach(date => {
            (this.data.journals[date] || []).forEach(entry => {
                allEntries.push({
                    ...entry,
                    displayDate: date
                });
            });
        });

        allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const now = new Date();
        switch(this.currentFilter) {
            case 'week':
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                return allEntries.filter(e => new Date(e.timestamp) > weekAgo);
            case 'month':
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                return allEntries.filter(e => new Date(e.timestamp) > monthAgo);
            default:
                return allEntries;
        }
    }

    renderHeatCalendar() {
        const grid = document.getElementById('heatGrid');
        if (!grid) return;
        
        const today = new Date();
        let html = '';
        
        for (let i = 34; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            const hasEntry = this.data.journals?.[dateStr]?.length > 0;
            const intensity = hasEntry ? Math.min(this.data.journals[dateStr].length, 3) : 0;
            
            html += `
                <div class="heat-cell level-${intensity}" 
                     title="${date.toLocaleDateString()}${hasEntry ? ': Con reflexión' : ''}">
                </div>
            `;
        }
        
        grid.innerHTML = html;
    }

    updateStats() {
        const entries = this.getFilteredEntries();
        const totalEntries = Object.values(this.data.journals || {}).reduce(
            (sum, day) => sum + (day?.length || 0), 0
        );
        
        const totalWords = entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
        const avgWords = entries.length ? Math.round(totalWords / entries.length) : 0;
        
        document.getElementById('totalEntries').textContent = totalEntries;
        document.getElementById('currentStreak').textContent = 
            window.cronosMind?.calculateStreak?.() || 0;
        document.getElementById('avgWords').textContent = avgWords;
    }

    getMoodEmoji(mood) {
        const emojis = {
            'motivado': '🔥', 'feliz': '😊', 'neutral': '😐',
            'cansado': '😴', 'estresado': '😫'
        };
        return emojis[mood] || '📝';
    }

    getMonthAbbr(month) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[month];
    }

    editEntry(entryId) {
        for (const date in this.data.journals) {
            const entry = this.data.journals[date]?.find(e => e.id === entryId);
            if (entry) {
                document.getElementById('journalText').value = entry.text;
                document.getElementById('moodSelector').value = entry.mood || 'neutral';
                this.showEditor();
                
                this.data.journals[date] = this.data.journals[date].filter(e => e.id !== entryId);
                return;
            }
        }
    }

    deleteEntry(entryId) {
        if (confirm('¿Estás seguro de eliminar esta reflexión?')) {
            for (const date in this.data.journals) {
                const initialLength = this.data.journals[date]?.length || 0;
                this.data.journals[date] = (this.data.journals[date] || []).filter(e => e.id !== entryId);
                
                if (this.data.journals[date]?.length !== initialLength) {
                    if (this.data.journals[date]?.length === 0) {
                        delete this.data.journals[date];
                    }
                    
                    if (window.cronosMind) {
                        window.cronosMind.data = this.data;
                        window.cronosMind.saveData();
                    }
                    
                    this.renderTimeline();
                    this.updateStats();
                    this.renderHeatCalendar();
                    window.cronosMind?.showNotification('Reflexión eliminada', 'info');
                    return;
                }
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.JournalManager = JournalManager;
}