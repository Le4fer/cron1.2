// lazy-loading.js - Carga diferida de módulos
class LazyLoader {
    constructor() {
        this.loadedModules = new Set();
        this.init();
    }
    
    init() {
        // Observador de intersección para cargar módulos cuando sean visibles
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const module = entry.target.dataset.module;
                    this.loadModule(module);
                }
            });
        }, { threshold: 0.1 });
        
        // Observar elementos con data-module
        document.querySelectorAll('[data-module]').forEach(el => {
            observer.observe(el);
        });
    }
    
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) return;
        
        try {
            switch(moduleName) {
                case 'calendar':
                    await import('./calendar.js');
                    break;
                case 'journal':
                    await import('./journal.js');
                    break;
                case 'goals':
                    await import('./goals.js');
                    break;
                case 'ai':
                    await import('./ai-assistant.js');
                    break;
            }
            this.loadedModules.add(moduleName);
            console.log(`Módulo ${moduleName} cargado`);
        } catch (error) {
            console.error(`Error cargando módulo ${moduleName}:`, error);
        }
    }
}

// Inicializar lazy loading
document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoader();
});