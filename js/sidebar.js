// sidebar.js - Gestión del menú lateral
class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.highlightCurrentPage();
        this.loadUserInfo();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Manejar clics en items con submenú
        document.querySelectorAll('.nav-item.has-submenu > a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = item.closest('.nav-item');
                parent.classList.toggle('expanded');
                
                // Guardar estado en localStorage
                const menuId = parent.querySelector('a span:last-child').textContent;
                this.saveMenuState(menuId, parent.classList.contains('expanded'));
            });
        });

        // Botón para colapsar sidebar (versión desktop)
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '◀';
        toggleBtn.addEventListener('click', () => this.toggleSidebar());
        this.sidebar.appendChild(toggleBtn);

        // Detectar clics en enlaces del menú
        document.querySelectorAll('.nav-item a, .sub-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#')) {
                    // Es un enlace real, guardar estado antes de navegar
                    this.saveNavigationState();
                }
            });
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        this.mainContent.classList.toggle('expanded');
        
        const toggleBtn = document.querySelector('.sidebar-toggle');
        if (this.sidebar.classList.contains('collapsed')) {
            toggleBtn.innerHTML = '▶';
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            toggleBtn.innerHTML = '◀';
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    }

    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        
        // Remover active de todos
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Activar el item correspondiente
        document.querySelectorAll('.nav-item a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.closest('.nav-item').classList.add('active');
                
                // Si está en submenú, expandir padre
                const parentSubMenu = link.closest('.sub-menu');
                if (parentSubMenu) {
                    const parentItem = parentSubMenu.closest('.nav-item');
                    parentItem.classList.add('active', 'expanded');
                }
            }
        });
    }

    saveMenuState(menuId, expanded) {
        let menuStates = JSON.parse(localStorage.getItem('menuStates') || '{}');
        menuStates[menuId] = expanded;
        localStorage.setItem('menuStates', JSON.stringify(menuStates));
    }

    loadMenuStates() {
        const menuStates = JSON.parse(localStorage.getItem('menuStates') || '{}');
        document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
            const menuName = item.querySelector('a span:last-child').textContent;
            if (menuStates[menuName]) {
                item.classList.add('expanded');
            }
        });
    }

    saveNavigationState() {
        // Guardar estado del sidebar antes de navegar
        localStorage.setItem('sidebarWasCollapsed', this.sidebar.classList.contains('collapsed'));
    }

    loadNavigationState() {
        // Restaurar estado del sidebar después de navegar
        const wasCollapsed = localStorage.getItem('sidebarWasCollapsed') === 'true';
        if (wasCollapsed) {
            this.sidebar.classList.add('collapsed');
            this.mainContent.classList.add('expanded');
            document.querySelector('.sidebar-toggle').innerHTML = '▶';
        }
    }

    loadUserInfo() {
        const userNameSpan = document.getElementById('userNameDisplay');
        if (userNameSpan && window.cronosMind?.data?.user) {
            userNameSpan.textContent = window.cronosMind.data.user.name;
        }
    }

    setupMobileMenu() {
        // Crear botón para móvil
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-toggle';
        mobileBtn.innerHTML = '☰';
        mobileBtn.addEventListener('click', () => {
            this.sidebar.classList.toggle('mobile-visible');
        });
        document.body.appendChild(mobileBtn);

        // Cerrar menú al hacer clic fuera en móvil
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                    this.sidebar.classList.remove('mobile-visible');
                }
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.sidebar')) {
        window.sidebarManager = new SidebarManager();
    }
});