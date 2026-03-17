// ai-assistant.js - VERSIÓN CORREGIDA
class AIAssistant {
    constructor() {
        this.context = [];
        this.suggestions = [];
        this.isMinimized = false;
        this.init();
    }
    
    init() {
        this.createAssistantUI();
        this.setupEventListeners();
        this.loadContext();
    }
    
    createAssistantUI() {
        // Verificar si ya existe
        if (document.getElementById('aiAssistant')) return;
        
        const assistantHTML = `
            <div class="ai-assistant" id="aiAssistant">
                <div class="assistant-header">
                    <span class="assistant-icon">🤖</span>
                    <h3>Asistente CronosMind</h3>
                    <button class="minimize-btn" id="minimizeAssistant">−</button>
                </div>
                <div class="assistant-body">
                    <div class="messages-container" id="assistantMessages">
                        <div class="message assistant">
                            <p>¡Hola! Soy tu asistente de disciplina. ¿En qué puedo ayudarte hoy?</p>
                        </div>
                    </div>
                    <div class="suggestions-container" id="suggestionsContainer"></div>
                    <div class="input-container">
                        <input type="text" id="assistantInput" placeholder="Escribe tu mensaje...">
                        <button id="sendMessageBtn">Enviar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', assistantHTML);
    }
    
    setupEventListeners() {
        const assistant = document.getElementById('aiAssistant');
        if (!assistant) return;
        
        const minimizeBtn = document.getElementById('minimizeAssistant');
        const sendBtn = document.getElementById('sendMessageBtn');
        const input = document.getElementById('assistantInput');
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        
        // Clic en el header para minimizar/maximizar
        const header = assistant.querySelector('.assistant-header');
        if (header) {
            header.addEventListener('click', (e) => {
                if (!e.target.classList.contains('minimize-btn')) {
                    this.toggleMinimize();
                }
            });
        }
    }
    
    toggleMinimize() {
        const assistant = document.getElementById('aiAssistant');
        const minimizeBtn = document.getElementById('minimizeAssistant');
        
        if (assistant && minimizeBtn) {
            this.isMinimized = !this.isMinimized;
            
            if (this.isMinimized) {
                assistant.classList.add('minimized');
                minimizeBtn.textContent = '+';
            } else {
                assistant.classList.remove('minimized');
                minimizeBtn.textContent = '−';
            }
        }
    }
    
    loadContext() {
        const data = window.cronosMind?.data;
        if (data) {
            this.context = {
                streak: data.stats?.currentStreak || 0,
                totalEntries: Object.keys(data.journals || {}).length,
                recentGoals: (data.goals || []).slice(-5),
                lastJournal: this.getLastJournal()
            };
        }
    }
    
    getLastJournal() {
        const journals = window.cronosMind?.data?.journals;
        if (!journals) return null;
        
        const dates = Object.keys(journals).sort();
        if (dates.length === 0) return null;
        
        const lastDate = dates[dates.length - 1];
        return {
            date: lastDate,
            entries: journals[lastDate]
        };
    }
    
    sendMessage() {
        const input = document.getElementById('assistantInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        this.addMessage('user', message);
        input.value = '';
        
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.addMessage('assistant', response);
            this.showSuggestions();
        }, 500);
    }
    
    generateResponse(message) {
        message = message.toLowerCase();
        
        if (message.includes('hola') || message.includes('buenos')) {
            return `¡Hola! Veo que llevas una racha de ${this.context.streak} días. ¡Sigue así!`;
        }
        
        if (message.includes('meta') || message.includes('objetivo')) {
            const pending = (window.cronosMind?.data?.goals || []).filter(g => !g.completed).length;
            if (pending > 0) {
                return `Tienes ${pending} metas pendientes. ¿Quieres que te ayude a planificarlas?`;
            } else {
                return '¡Felicidades! No tienes metas pendientes. ¿Quieres establecer nuevas metas?';
            }
        }
        
        if (message.includes('journal') || message.includes('registro')) {
            const lastJournal = this.getLastJournal();
            if (lastJournal) {
                return `Tu último registro fue el ${lastJournal.date}. ¿Cómo te sientes hoy?`;
            } else {
                return 'Aún no has hecho ningún registro. ¿Te gustaría escribir algo ahora?';
            }
        }
        
        return this.getMotivationalMessage();
    }
    
    getMotivationalMessage() {
        const messages = [
            "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
            "La disciplina es el puente entre metas y logros.",
            "No cuentes los días, haz que los días cuenten.",
            "El dolor de la disciplina es temporal, el arrepentimiento es para siempre.",
            "Hoy es una oportunidad para construir el mañana que deseas."
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    addMessage(type, content) {
        const container = document.getElementById('assistantMessages');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `<p>${content}</p>`;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    showSuggestions() {
        const container = document.getElementById('suggestionsContainer');
        if (!container) return;
        
        const suggestions = [
            "Establecer meta diaria",
            "Ver progreso",
            "Consejo de disciplina",
            "Analizar productividad"
        ];
        
        container.innerHTML = '';
        suggestions.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = text;
            btn.addEventListener('click', () => {
                const input = document.getElementById('assistantInput');
                if (input) {
                    input.value = text;
                    this.sendMessage();
                }
            });
            container.appendChild(btn);
        });
    }
}

// Inicialización segura
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
}