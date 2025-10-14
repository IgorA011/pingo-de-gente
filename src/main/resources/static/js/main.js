// Funções principais da aplicação

// Navegação entre páginas
function navigateTo(page) {
    window.location.href = page;
}

// Mostrar mensagem de alerta
function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Adicionar no topo da página
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Formatar preço
function formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Redirecionar baseado no perfil
function redirectBasedOnProfile(user) {
    if (!user || !user.perfil) {
        console.log('❌ Usuário ou perfil não encontrado');
        window.location.href = 'index.html';
        return;
    }

    console.log('🎯 Redirecionando usuário:', user.nome, '- Perfil:', user.perfil);

    switch(user.perfil) {
        case 'ADMIN':
            console.log('➡️ Indo para painel admin');
            window.location.href = 'admin.html';
            break;
        case 'ESTOQUISTA':
            console.log('➡️ Indo para controle de estoque');
            window.location.href = 'estoque.html';
            break;
        default:
            console.log('➡️ Indo para página inicial');
            window.location.href = 'index.html';
            break;
    }
}

// Função para ir para o painel admin
function goToAdminPanel() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.perfil === 'ADMIN') {
        window.location.href = 'admin.html';
    } else {
        showAlert('Acesso restrito para administradores', 'warning');
    }
}

// Função para ir para o controle de estoque
function goToEstoquePanel() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.perfil === 'ESTOQUISTA' || user.perfil === 'ADMIN') {
        window.location.href = 'estoque.html';
    } else {
        showAlert('Acesso restrito para estoquistas e administradores', 'warning');
    }
}

// Carregar produtos em destaque
async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (response.ok) {
            const products = await response.json();
            displayFeaturedProducts(products.slice(0, 6));
        } else {
            console.error('Erro ao carregar produtos');
            showAlert('Erro ao carregar produtos', 'danger');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        showAlert('Erro de conexão ao carregar produtos', 'danger');
    }
}

// Exibir produtos em destaque
function displayFeaturedProducts(products) {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts) return;

    featuredProducts.innerHTML = '';

    if (products.length === 0) {
        featuredProducts.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">Nenhum produto disponível no momento.</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-4 col-sm-6 mb-4';
        productCard.innerHTML = `
            <div class="card product-card h-100">
                <img src="${API_BASE_URL}${product.imagemUrl || '/images/default.jpg'}"
                     class="card-img-top product-image" alt="${product.nome}"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indispon%C3%ADvel'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.nome}</h5>
                    <p class="card-text flex-grow-1">${product.descricao}</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="price-tag">${formatPrice(product.preco)}</span>
                        <button class="btn btn-primary-custom btn-sm" onclick="viewProduct(${product.id})">
                            Ver Detalhes
                        </button>
                    </div>
                </div>
            </div>
        `;
        featuredProducts.appendChild(productCard);
    });
}

// Adicionar produto ao carrinho
function addToCart(productId, quantity = 1) {
    // Buscar produto da API
    fetch(`${API_BASE_URL}/produtos/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Produto não encontrado');
            }
            return response.json();
        })
        .then(product => {
            // Verificar se o produto já está no carrinho
            const existingItem = cart.find(item => item.product.id === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    product: product,
                    quantity: quantity
                });
            }

            saveCart();
            showAlert('Produto adicionado ao carrinho!', 'success');
        })
        .catch(error => {
            console.error('Erro ao adicionar produto:', error);
            showAlert('Erro ao adicionar produto ao carrinho', 'danger');
        });
}

// Remover produto do carrinho
function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    saveCart();

    // Recarregar a página do carrinho se estiver nela
    if (window.location.pathname.includes('carrinho.html')) {
        loadCartPage();
    }

    showAlert('Produto removido do carrinho', 'info');
}

// Atualizar quantidade no carrinho
function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.product.id === productId);
    if (item && newQuantity > 0) {
        item.quantity = newQuantity;
        saveCart();

        // Recarregar a página do carrinho se estiver nela
        if (window.location.pathname.includes('carrinho.html')) {
            loadCartPage();
        }
    } else if (item && newQuantity <= 0) {
        removeFromCart(productId);
    }
}

// Calcular total do carrinho
function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.product.preco * item.quantity), 0);
}

// Carregar página do carrinho
function loadCartPage() {
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const cartItems = document.getElementById('cartItems');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');
    const checkoutSection = document.getElementById('checkoutSection');
    const loginRequired = document.getElementById('loginRequired');

    if (!emptyCart || !cartContent) return;

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartContent.style.display = 'block';

    // Mostrar/ocultar seção de checkout baseado no login
    if (isAuthenticated()) {
        if (checkoutSection) checkoutSection.style.display = 'block';
        if (loginRequired) loginRequired.style.display = 'none';
    } else {
        if (checkoutSection) checkoutSection.style.display = 'none';
        if (loginRequired) loginRequired.style.display = 'block';
    }

    // Carregar itens do carrinho
    if (cartItems) {
        cartItems.innerHTML = '';
        let cartSubtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.product.preco * item.quantity;
            cartSubtotal += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="row align-items-center">
                    <div class="col-3">
                        <img src="${API_BASE_URL}${item.product.imagemUrl || '/images/default.jpg'}"
                             class="img-fluid rounded" alt="${item.product.nome}"
                             onerror="this.src='https://via.placeholder.com/80x80?text=Imagem'">
                    </div>
                    <div class="col-5">
                        <h6 class="mb-1">${item.product.nome}</h6>
                        <small class="text-muted">${formatPrice(item.product.preco)} cada</small>
                    </div>
                    <div class="col-2">
                        <input type="number" class="form-control form-control-sm"
                               value="${item.quantity}" min="1"
                               onchange="updateCartQuantity(${item.product.id}, this.value)">
                    </div>
                    <div class="col-2 text-end">
                        <strong>${formatPrice(itemTotal)}</strong>
                        <button class="btn btn-sm btn-outline-danger ms-2"
                                onclick="removeFromCart(${item.product.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        // Atualizar totais
        if (subtotal) subtotal.textContent = formatPrice(cartSubtotal);
        if (total) total.textContent = formatPrice(cartSubtotal);
    }
}

// Finalizar compra
async function finalizePurchase() {
    if (!isAuthenticated()) {
        showAlert('Você precisa estar logado para finalizar a compra', 'warning');
        window.location.href = 'login.html';
        return;
    }

    try {
        const token = getAuthToken();
        const pedidoItens = cart.map(item => ({
            produto: { id: item.product.id },
            quantidade: item.quantity
        }));

        const response = await fetch(`${API_BASE_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(pedidoItens)
        });

        if (response.ok) {
            const pedido = await response.json();
            showAlert('Pedido realizado com sucesso!', 'success');

            // Limpar carrinho
            cart = [];
            saveCart();

            setTimeout(() => {
                window.location.href = 'pedidos.html';
            }, 2000);
        } else {
            const error = await response.json();
            showAlert(error.message || 'Erro ao finalizar pedido', 'danger');
        }
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        showAlert('Erro de conexão', 'danger');
    }
}

// Truncar texto
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Inicialização da página principal
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', function() {
        loadFeaturedProducts();
    });
}

// Inicialização da página do carrinho
if (window.location.pathname.includes('carrinho.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        loadCartPage();

        // Event listener para finalizar compra
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', finalizePurchase);
        }
    });
}