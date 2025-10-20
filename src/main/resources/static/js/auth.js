// Configurações da API
const API_BASE_URL = 'http://localhost:8080';

// Estado da aplicação
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Verificar status de autenticação
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
        try {
            // Verifica se o token ainda é válido
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('user', JSON.stringify(user));
                currentUser = user;
                updateUserInterface();
                console.log('✅ Usuário autenticado:', user.nome);
                return true;
            } else {
                // Token inválido ou expirado
                console.log('❌ Token inválido, fazendo logout...');
                logout();
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            // Em caso de erro de rede, mantém o usuário logado com dados locais
            currentUser = JSON.parse(userData);
            updateUserInterface();
            return true;
        }
    } else {
        showLoginInterface();
        return false;
    }
}

// Atualizar interface do usuário logado
function updateUserInterface() {
    const userMenu = document.getElementById('userMenu');
    const loginMenu = document.getElementById('loginMenu');
    const userName = document.getElementById('userName');

    if (currentUser && userMenu && loginMenu && userName) {
        userName.textContent = currentUser.nome;
        userMenu.style.display = 'block';
        loginMenu.style.display = 'none';

        // Atualizar avatar com iniciais
        const avatar = document.querySelector('.user-avatar');
        if (avatar) {
            avatar.textContent = currentUser.nome.charAt(0).toUpperCase();
        }

        // Mostrar links administrativos se for admin ou estoquista
        showAdminLinks();
    }
}

// Mostrar interface de login
function showLoginInterface() {
    const userMenu = document.getElementById('userMenu');
    const loginMenu = document.getElementById('loginMenu');

    if (userMenu && loginMenu) {
        userMenu.style.display = 'none';
        loginMenu.style.display = 'block';
    }
}

// Mostrar links administrativos
function showAdminLinks() {
    const adminLinks = document.getElementById('adminLinks');
    if (adminLinks && currentUser) {
        if (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ESTOQUISTA') {
            adminLinks.style.display = 'block';

            let linksHTML = '';

            if (currentUser.perfil === 'ADMIN') {
                linksHTML += `
                    <li class="nav-item">
                        <a class="nav-link" href="admin.html">Painel Admin</a>
                    </li>
                `;
            }

            if (currentUser.perfil === 'ESTOQUISTA' || currentUser.perfil === 'ADMIN') {
                linksHTML += `
                    <li class="nav-item">
                        <a class="nav-link" href="estoque.html">Controle de Estoque</a>
                    </li>
                `;
            }

            adminLinks.innerHTML = linksHTML;
        } else {
            adminLinks.style.display = 'none';
        }
    }
}

// Login
async function login(email, senha) {
    try {
        console.log('🔐 Tentando login para:', email);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);

            // Buscar dados completos do usuário
            const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                localStorage.setItem('user', JSON.stringify(userData));
                currentUser = userData;

                console.log('✅ Login bem-sucedido:', userData.nome, '- Perfil:', userData.perfil);

                // Atualizar interface IMEDIATAMENTE após login
                updateUserInterface();

                // Redirecionar baseado no perfil
                redirectBasedOnProfile(userData);

                return {
                    success: true,
                    user: userData
                };
            } else {
                console.log('❌ Erro ao buscar dados do usuário');
                return {
                    success: false,
                    message: 'Erro ao carregar dados do usuário'
                };
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Credenciais inválidas' }));
            console.log('❌ Erro no login:', errorData.message || errorData.msg);
            return {
                success: false,
                message: errorData.message || errorData.msg || 'Credenciais inválidas'
            };
        }

    } catch (error) {
        console.error('Erro no login:', error);
        return {
            success: false,
            message: 'Erro de conexão com o servidor'
        };
    }
}

// Registro
async function register(userData) {
    try {
        console.log('📝 Registrando novo usuário:', userData.email);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            console.log('✅ Usuário registrado com sucesso:', userData.email);
            return {
                success: true,
                message: 'Cadastro realizado com sucesso!'
            };
        } else {
            const error = await response.json();
            console.log('❌ Erro no registro:', error.message || error.msg);
            return {
                success: false,
                message: error.message || error.msg || 'Erro no cadastro'
            };
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        return {
            success: false,
            message: 'Erro de conexão'
        };
    }
}

// Logout
function logout() {
    console.log('🚪 Fazendo logout...');

    // Limpar dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;

    // Limpar carrinho (opcional)
    // localStorage.removeItem('cart');
    // cart = [];

    // Atualizar interface
    showLoginInterface();

    // Redirecionar para página inicial
    console.log('➡️ Redirecionando para página inicial...');
    window.location.href = 'index.html';
}

// Obter token para requisições autenticadas
function getAuthToken() {
    return localStorage.getItem('token');
}

// Verificar se usuário está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

// Verificar permissões
function hasRole(role) {
    if (!currentUser) {
        const userData = localStorage.getItem('user');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
    }
    return currentUser && currentUser.perfil === role;
}

// Verificar se é admin
function isAdmin() {
    return hasRole('ADMIN');
}

// Verificar se é estoquista
function isEstoquista() {
    return hasRole('ESTOQUISTA');
}

// Verificar se é usuário normal
function isUser() {
    return hasRole('USER');
}

// Obter dados do usuário atual
function getCurrentUser() {
    if (!currentUser) {
        const userData = localStorage.getItem('user');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
    }
    return currentUser;
}

// Redirecionar baseado no perfil do usuário
function redirectBasedOnProfile(user) {
    if (!user || !user.perfil) {
        console.log('❌ Usuário ou perfil não encontrado, redirecionando para início');
        window.location.href = 'index.html';
        return;
    }

    console.log('🎯 Redirecionando usuário:', user.nome, '- Perfil:', user.perfil);

    // Se já está na página correta, não redireciona
    const currentPage = window.location.pathname;

    switch(user.perfil) {
        case 'ADMIN':
            if (!currentPage.includes('admin.html')) {
                console.log('➡️ Indo para painel admin');
                window.location.href = 'admin.html';
            }
            break;
        case 'ESTOQUISTA':
            if (!currentPage.includes('estoque.html')) {
                console.log('➡️ Indo para controle de estoque');
                window.location.href = 'estoque.html';
            }
            break;
        default:
            if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
                console.log('➡️ Indo para página inicial');
                window.location.href = 'index.html';
            }
            break;
    }
}

// Função para ir para o painel admin
function goToAdminPanel() {
    if (isAdmin()) {
        window.location.href = 'admin.html';
    } else {
        showAlert('Acesso restrito para administradores', 'warning');
    }
}

// Função para ir para o controle de estoque
function goToEstoquePanel() {
    if (isEstoquista() || isAdmin()) {
        window.location.href = 'estoque.html';
    } else {
        showAlert('Acesso restrito para estoquistas e administradores', 'warning');
    }
}

// Atualizar badge do carrinho
function updateCartBadge() {
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 0), 0);

        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.classList.remove('d-none');
        } else {
            cartBadge.classList.add('d-none');
        }
    }
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

// Verificar acesso administrativo
function checkAdminAccess() {
    if (!isAdmin()) {
        showAlert('Acesso restrito para administradores', 'warning');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Verificar acesso de estoque
function checkEstoqueAccess() {
    if (!isEstoquista() && !isAdmin()) {
        showAlert('Acesso restrito para estoquistas e administradores', 'warning');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Verificar se está na página de admin e redirecionar se necessário
function checkAdminPageAccess() {
    if (window.location.pathname.includes('admin.html') && !isAdmin()) {
        showAlert('Acesso restrito para administradores', 'warning');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Verificar se está na página de estoque e redirecionar se necessário
function checkEstoquePageAccess() {
    if (window.location.pathname.includes('estoque.html') && !isEstoquista() && !isAdmin()) {
        showAlert('Acesso restrito para estoquistas e administradores', 'warning');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Verificar se precisa fazer login para acessar a página
function requireAuth() {
    if (!isAuthenticated()) {
        showAlert('Você precisa estar logado para acessar esta página', 'warning');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Verificar e redirecionar se já estiver logado (para página de login)
function checkAndRedirectIfLoggedIn() {
    if ((window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) && isAuthenticated()) {
        const user = getCurrentUser();
        console.log('🔄 Usuário já logado, redirecionando...', user);
        redirectBasedOnProfile(user);
        return true;
    }
    return false;
}

// Mostrar alerta (função auxiliar)
function showAlert(message, type = 'info') {
    // Remove alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector('.container') || document.body;
    container.prepend(alertDiv);

    // Auto-remove após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Modal de alerta mais sofisticado
function showModalAlert(title, message, type = 'info') {
    const modal = document.getElementById('alertModal');
    if (!modal) {
        // Criar modal dinamicamente se não existir
        const modalHTML = `
            <div class="modal fade" id="alertModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="alertModalTitle"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="alertModalBody"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modalTitle = document.getElementById('alertModalTitle');
    const modalBody = document.getElementById('alertModalBody');

    modalTitle.textContent = title;
    modalBody.textContent = message;

    // Adicionar classe baseada no tipo
    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.className = `modal-header bg-${type} text-white`;

    // Mostrar modal
    const bootstrapModal = new bootstrap.Modal(document.getElementById('alertModal'));
    bootstrapModal.show();
}

// Inicialização
function initializeAuth() {
    console.log('🔧 Inicializando sistema de autenticação...');

    // Verificar se está na página de login/registro e já está logado
    if (checkAndRedirectIfLoggedIn()) {
        return;
    }

    // Não fazer checkAuthStatus automaticamente na página de login/registro
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
        checkAuthStatus();
    }

    updateCartBadge();

    // Verificar acesso às páginas protegidas
    if (window.location.pathname.includes('admin.html')) {
        checkAdminPageAccess();
    }

    if (window.location.pathname.includes('estoque.html')) {
        checkEstoquePageAccess();
    }

    // Verificar páginas que requerem autenticação
    if (window.location.pathname.includes('pedidos.html') ||
        window.location.pathname.includes('carrinho.html') ||
        window.location.pathname.includes('perfil.html')) {
        requireAuth();
    }

    // Event Listeners globais
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👤 Usuário solicitou logout');
            logout();
        });
    }

    // Event listener para links administrativos dinâmicos
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-admin-only]') && !isAdmin()) {
            e.preventDefault();
            showAlert('Acesso restrito para administradores', 'warning');
        }

        if (e.target.matches('[data-estoque-only]') && !isEstoquista() && !isAdmin()) {
            e.preventDefault();
            showAlert('Acesso restrito para estoquistas e administradores', 'warning');
        }

        if (e.target.matches('[data-auth-required]') && !isAuthenticated()) {
            e.preventDefault();
            showAlert('Você precisa estar logado para acessar esta funcionalidade', 'warning');
            window.location.href = 'login.html';
        }
        // Adicione esta verificação no initializeAuth()
        if (window.location.pathname.includes('perfil.html')) {
            if (!requireAuth()) {
                return;
            }
        }
    });

    console.log('✅ Sistema de autenticação inicializado');
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Pequeno delay para garantir que tudo esteja carregado
    setTimeout(initializeAuth, 100);
});

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.auth = {
        login,
        logout,
        register,
        isAuthenticated,
        isAdmin,
        isEstoquista,
        isUser,
        getCurrentUser,
        getAuthToken,
        checkAuthStatus,
        redirectBasedOnProfile,
        goToAdminPanel,
        goToEstoquePanel,
        initializeAuth,
        showAlert,
        showModalAlert,
        requireAuth,
        checkAdminAccess,
        checkEstoqueAccess
    };
}