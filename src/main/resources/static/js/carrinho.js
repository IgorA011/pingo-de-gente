// Configurações da API
    const API_BASE_URL = 'http://localhost:8080';

    // Estado da aplicação
    let currentUser = null;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let shippingCost = 0;
    let discount = 0;
    let currentAddress = null;

    // Funções principais da aplicação
    function navigateTo(page) {
        window.location.href = page;
    }

    function showAlert(message, type = 'info') {
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    }

    // Verificar status de autenticação
    async function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('user', JSON.stringify(user));
                    currentUser = user;
                    return true;
                } else {
                    logout();
                    return false;
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                currentUser = JSON.parse(userData);
                return true;
            }
        } else {
            return false;
        }
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

    // Logout
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        window.location.href = 'index.html';
    }

    // Carregar página do carrinho - CORRIGIDA
    async function loadCartPage() {
        const emptyCart = document.getElementById('emptyCart');
        const cartContent = document.getElementById('cartContent');

        console.log('🛒 Iniciando carregamento do carrinho...');
        console.log('Carrinho tem', cart.length, 'itens');

        if (!emptyCart || !cartContent) {
            console.log('❌ Elementos do carrinho não encontrados');
            return;
        }

        if (cart.length === 0) {
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
            console.log('🛒 Carrinho vazio');
            return;
        }

        emptyCart.style.display = 'none';
        cartContent.style.display = 'block';

        // Verificar autenticação
        const isAuth = await checkAuthStatus();
        if (isAuth) {
            console.log('✅ Usuário autenticado');
            document.getElementById('checkoutSection').style.display = 'block';
            document.getElementById('loginRequired').style.display = 'none';

            // SEMPRE mostrar seções de endereço e pagamento para usuários logados
            console.log('🏠 Mostrando seções de endereço e pagamento');

        } else {
            console.log('❌ Usuário não autenticado');
            document.getElementById('checkoutSection').style.display = 'none';
            document.getElementById('loginRequired').style.display = 'block';
        }

        loadCartItems();
        setupPaymentListeners();

        // Carregar endereço do usuário se estiver logado
        if (isAuth) {
            loadUserAddress();
        }
    }

    function loadCartItems() {
        const cartItems = document.getElementById('cartItems');
        let cartSubtotal = 0;

        if (!cartItems) {
            console.log('❌ Elemento cartItems não encontrado');
            return;
        }

        cartItems.innerHTML = '';
        cart.forEach(item => {
            const itemTotal = item.product.preco * item.quantity;
            cartSubtotal += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item mb-3 pb-3 border-bottom';
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

        updateOrderSummary(cartSubtotal);
    }

    function updateOrderSummary(subtotal) {
        const total = subtotal - discount + shippingCost;

        console.log('💰 Atualizando resumo:', { subtotal, discount, shippingCost, total });

        if (document.getElementById('subtotal')) {
            document.getElementById('subtotal').textContent = formatPrice(subtotal);
        }

        // Mostrar/ocultar linha de desconto
        const discountRow = document.getElementById('discountRow');
        if (discountRow) {
            if (discount > 0) {
                discountRow.style.display = 'flex';
                document.getElementById('discount').textContent = `- ${formatPrice(discount)}`;
                console.log('🎁 Desconto aplicado:', discount);
            } else {
                discountRow.style.display = 'none';
            }
        }

        if (document.getElementById('frete')) {
            document.getElementById('frete').textContent = formatPrice(shippingCost);
        }
        if (document.getElementById('total')) {
            document.getElementById('total').textContent = formatPrice(total);
        }
    }

    async function loadUserAddress() {
        try {
            const user = getCurrentUser();
            console.log('👤 Carregando endereço do usuário:', user);

            if (user && user.rua && user.cep) {
                currentAddress = {
                    rua: user.rua,
                    numero: user.numero,
                    bairro: user.bairro,
                    cidade: user.cidade,
                    cep: user.cep
                };
                console.log('🏠 Endereço carregado:', currentAddress);
                showSavedAddress();
                // Calcular frete automaticamente se tiver endereço
                setTimeout(() => {
                    calculateShipping();
                }, 1000);
            } else {
                console.log('📝 Mostrando formulário de endereço');
                showAddressForm();
                showFreteMessage('Informe seu endereço para calcular o frete', 'warning');
            }
        } catch (error) {
            console.error('Erro ao carregar endereço:', error);
            showAddressForm();
        }
    }

    function showSavedAddress() {
        const savedAddress = document.getElementById('savedAddress');
        const addressForm = document.getElementById('addressForm');
        const addressRequired = document.getElementById('addressRequired');

        if (savedAddress) savedAddress.style.display = 'block';
        if (addressForm) addressForm.style.display = 'none';

        const addressDisplay = document.getElementById('addressDisplay');
        if (addressDisplay && currentAddress) {
            addressDisplay.textContent = `${currentAddress.rua}, ${currentAddress.numero}, ${currentAddress.bairro}, ${currentAddress.cidade} - CEP: ${currentAddress.cep}`;
        }

        if (addressRequired) addressRequired.style.display = 'none';
        console.log('✅ Endereço salvo mostrado');
    }

    function showAddressForm() {
        const savedAddress = document.getElementById('savedAddress');
        const addressForm = document.getElementById('addressForm');

        if (savedAddress) savedAddress.style.display = 'none';
        if (addressForm) addressForm.style.display = 'block';

        if (currentAddress) {
            if (document.getElementById('rua')) document.getElementById('rua').value = currentAddress.rua || '';
            if (document.getElementById('numero')) document.getElementById('numero').value = currentAddress.numero || '';
            if (document.getElementById('bairro')) document.getElementById('bairro').value = currentAddress.bairro || '';
            if (document.getElementById('cidade')) document.getElementById('cidade').value = currentAddress.cidade || '';
            if (document.getElementById('cep')) document.getElementById('cep').value = currentAddress.cep || '';
        }
        console.log('📝 Formulário de endereço mostrado');
    }

    function toggleAddressForm() {
        showAddressForm();
    }

    async function saveAddress() {
        const rua = document.getElementById('rua')?.value;
        const numero = document.getElementById('numero')?.value;
        const bairro = document.getElementById('bairro')?.value;
        const cidade = document.getElementById('cidade')?.value;
        const cep = document.getElementById('cep')?.value;

        if (!rua || !numero || !bairro || !cidade || !cep) {
            showAlert('Preencha todos os campos obrigatórios do endereço', 'warning');
            return;
        }

        const address = {
            rua: rua,
            numero: numero,
            bairro: bairro,
            cidade: cidade,
            cep: cep.replace(/\D/g, '')
        };

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/auth/perfil/endereco`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(address)
            });

            if (response.ok) {
                currentAddress = address;

                // Atualizar usuário local
                const user = getCurrentUser();
                Object.assign(user, address);
                localStorage.setItem('user', JSON.stringify(user));
                currentUser = user;

                showSavedAddress();
                await calculateShipping();
                showAlert('Endereço salvo com sucesso! Calculando frete...', 'success');
            } else {
                throw new Error('Erro ao salvar endereço');
            }
        } catch (error) {
            console.error('Erro ao salvar endereço:', error);
            showAlert('Erro ao salvar endereço', 'danger');
        }
    }

    async function calculateShipping() {
        console.log('Iniciando cálculo de frete...');

        // Se não tem endereço salvo, tenta pegar do formulário
        if (!currentAddress) {
            const cep = document.getElementById('cep')?.value;
            const rua = document.getElementById('rua')?.value;
            const numero = document.getElementById('numero')?.value;
            const bairro = document.getElementById('bairro')?.value;
            const cidade = document.getElementById('cidade')?.value;

            if (cep && rua && numero && bairro && cidade) {
                currentAddress = {
                    rua: rua,
                    numero: numero,
                    bairro: bairro,
                    cidade: cidade,
                    cep: cep.replace(/\D/g, '')
                };
                console.log('🏠 Endereço do formulário:', currentAddress);
            }
        }

        if (!currentAddress || !currentAddress.cep) {
            console.log('Endereço ou CEP não informado');
            showFreteMessage('Informe o endereço completo para calcular o frete', 'warning');
            shippingCost = 0;
            updateOrderSummary(calculateCartTotal());
            return;
        }

        const cep = currentAddress.cep.replace(/\D/g, '');
        console.log('CEP para cálculo:', cep);

        if (cep.length !== 8) {
            console.log('❌ CEP inválido:', cep);
            showFreteMessage('CEP inválido. Digite um CEP com 8 dígitos.', 'warning');
            shippingCost = 0;
            updateOrderSummary(calculateCartTotal());
            return;
        }

        showFreteMessage('Calculando frete...', 'info');

        try {
            console.log('Chamando API de frete...');
            const response = await fetch(`${API_BASE_URL}/frete/calcular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cep: cep,
                    itens: cart.map(item => ({
                        produtoId: item.product.id,
                        quantidade: item.quantity
                    }))
                })
            });

            if (response.ok) {
                const freteData = await response.json();
                shippingCost = freteData.valor;
                const prazo = freteData.prazo || 5;
                const transportadora = freteData.transportadora || 'Correios';

                console.log('✅ Frete calculado:', shippingCost, 'Prazo:', prazo);

                showFreteMessage(`Frete: ${formatPrice(shippingCost)} | Prazo: ${prazo} dias úteis (${transportadora})`, 'success');
                showShippingResult(shippingCost, prazo, transportadora);

            } else {
                throw new Error('Erro na API de frete');
            }
        } catch (error) {
            console.error('❌ Erro ao calcular frete:', error);
            // Fallback: frete fixo baseado no CEP
            shippingCost = calculateFallbackShipping(cep);
            showFreteMessage(`Frete estimado: ${formatPrice(shippingCost)} (cálculo simplificado)`, 'info');
        }

        updateOrderSummary(calculateCartTotal());
    }

    // Nova função para mostrar mensagens do frete
    function showFreteMessage(message, type = 'info') {
        const freteInfo = document.getElementById('freteInfo');
        const freteMessage = document.getElementById('freteMessage');

        if (freteInfo && freteMessage) {
            freteMessage.textContent = message;
            freteInfo.className = `alert alert-${type}`;
            freteInfo.style.display = 'block';
            console.log('Mensagem do frete:', message);
        }
    }

    // Nova função para mostrar resultado do frete
    function showShippingResult(valor, prazo, transportadora) {
        const shippingResult = document.getElementById('shippingResult');
        const shippingValue = document.getElementById('shippingValue');
        const shippingTime = document.getElementById('shippingTime');

        if (shippingResult && shippingValue && shippingTime) {
            shippingValue.textContent = formatPrice(valor);
            shippingTime.textContent = `| Prazo: ${prazo} dias úteis (${transportadora})`;
            shippingResult.style.display = 'block';
        }
    }

    function calculateFallbackShipping(cep) {
        const firstDigit = cep.charAt(0);
        let frete = 0;
        switch(firstDigit) {
            case '0': case '1': case '2': frete = 15.00; break;
            case '3': case '4': frete = 25.00; break;
            default: frete = 35.00;
        }
        console.log('📦 Frete fallback calculado:', frete);
        return frete;
    }

    function setupPaymentListeners() {
        console.log('Configurando listeners de pagamento...');

        // Listener para mudança no método de pagamento
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const method = this.value;

                const creditCardForm = document.getElementById('creditCardForm');
                const pixSection = document.getElementById('pixSection');

                if (creditCardForm) {
                    creditCardForm.style.display = method === 'CARTAO_CREDITO' ? 'block' : 'none';
                    console.log('Formulário cartão:', creditCardForm.style.display);
                }

                if (pixSection) {
                    pixSection.style.display = method === 'PIX' ? 'block' : 'none';
                    console.log('Seção PIX:', pixSection.style.display);
                }

                // Aplicar desconto para PIX
                const subtotal = calculateCartTotal();
                discount = method === 'PIX' ? subtotal * 0.05 : 0;

                updateOrderSummary(subtotal);
                console.log('Método de pagamento alterado para:', method, 'Desconto:', discount);
            });
        });

        // Inicializar com PIX selecionado
        const pixRadio = document.getElementById('pix');
        if (pixRadio) {
            pixRadio.checked = true;
            console.log('✅ PIX selecionado por padrão');
        }

        const subtotal = calculateCartTotal();
        discount = subtotal * 0.08; // 8% de desconto no PIX
        updateOrderSummary(subtotal);

        console.log('Pagamento configurado - PIX selecionado com desconto de:', discount);
    }

    // Finalizar compra
    async function finalizePurchase() {
        console.log('Iniciando finalização da compra...');

        if (!isAuthenticated()) {
            showAlert('Você precisa estar logado para finalizar a compra', 'warning');
            window.location.href = 'login.html';
            return;
        }

        if (!currentAddress) {
            showAlert('Informe seu endereço de entrega', 'warning');
            const addressRequired = document.getElementById('addressRequired');
            if (addressRequired) addressRequired.style.display = 'block';
            return;
        }

        const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethodElement) {
            showAlert('Selecione um método de pagamento', 'warning');
            return;
        }

        const paymentMethod = paymentMethodElement.value;
        console.log('Método de pagamento selecionado:', paymentMethod);

        // Validação adicional para cartão de crédito
        if (paymentMethod === 'CARTAO_CREDITO') {
            const cardNumber = document.getElementById('cardNumber')?.value;
            const cardExpiry = document.getElementById('cardExpiry')?.value;
            const cardCvv = document.getElementById('cardCvv')?.value;
            const cardName = document.getElementById('cardName')?.value;

            if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
                showAlert('Preencha todos os dados do cartão', 'warning');
                return;
            }
        }

        await finalizeOrder(paymentMethod);
    }

    async function finalizeOrder(paymentMethod) {
        try {
            const token = getAuthToken();
            const subtotal = calculateCartTotal();
            const total = subtotal - discount + shippingCost;

            const pedidoData = {
                itens: cart.map(item => ({
                    produto: { id: item.product.id },
                    quantidade: item.quantity
                })),
                enderecoEntrega: {
                    ...currentAddress,
                    complemento: document.getElementById('complemento')?.value || ''
                },
                metodoPagamento: paymentMethod,
                valorFrete: shippingCost,
                valorDesconto: discount,
                valorTotal: total
            };

            console.log('Enviando pedido:', pedidoData);

            const response = await fetch(`${API_BASE_URL}/pedidos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(pedidoData)
            });

            if (response.ok) {
                const pedido = await response.json();
                showAlert('Pedido realizado com sucesso!', 'success');

                // Limpar carrinho
                cart = [];
                saveCart();
                updateCartBadge();

                setTimeout(() => {
                    window.location.href = 'pedidos.html';
                }, 2000);
            } else {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                let errorMessage = 'Erro ao finalizar pedido';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.msg || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                showAlert(errorMessage, 'danger');
            }
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            showAlert('Erro de conexão: ' + error.message, 'danger');
        }
    }

    // Funções do carrinho
    function calculateCartTotal() {
        const total = cart.reduce((total, item) => total + (item.product.preco * item.quantity), 0);
        console.log('Total do carrinho calculado:', total);
        return total;
    }

    function addToCart(productId, quantity = 1) {
        fetch(`${API_BASE_URL}/produtos/${productId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Produto não encontrado');
                }
                return response.json();
            })
            .then(product => {
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

    function removeFromCart(productId) {
        cart = cart.filter(item => item.product.id !== productId);
        saveCart();

        if (window.location.pathname.includes('carrinho.html')) {
            loadCartPage();
        }

        showAlert('Produto removido do carrinho', 'info');
    }

    function updateCartQuantity(productId, newQuantity) {
        const item = cart.find(item => item.product.id === productId);
        if (item && newQuantity > 0) {
            item.quantity = parseInt(newQuantity);
            saveCart();

            if (window.location.pathname.includes('carrinho.html')) {
                loadCartPage();
            }
        } else if (item && newQuantity <= 0) {
            removeFromCart(productId);
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
    }

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

    // Inicialização da página do carrinho
    if (window.location.pathname.includes('carrinho.html')) {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🛒 DOM carregado - inicializando carrinho...');
            loadCartPage();

            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', finalizePurchase);
                console.log('✅ Botão de checkout configurado');
            }

            // Event listener para CEP com máscara
            const cepInput = document.getElementById('cep');
            if (cepInput) {
                cepInput.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 5) {
                        value = value.substring(0, 5) + '-' + value.substring(5, 8);
                    }
                    e.target.value = value;
                });

                cepInput.addEventListener('blur', function() {
                    if (this.value.length === 9) { // 00000-000
                        calculateShipping();
                    }
                });
                console.log('✅ Listener do CEP configurado');
            }

            // Máscaras para cartão
            const cardNumber = document.getElementById('cardNumber');
            if (cardNumber) {
                cardNumber.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                    e.target.value = value.substring(0, 19);
                });
            }

            const cardExpiry = document.getElementById('cardExpiry');
            if (cardExpiry) {
                cardExpiry.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    e.target.value = value;
                });
            }
        });
    }

    // Função de debug para verificar se tudo está funcionando
    function debugCart() {
        console.log('=== DEBUG DO CARRINHO ===');
        console.log('Usuário autenticado:', isAuthenticated());
        console.log('Usuário atual:', getCurrentUser());
        console.log('Carrinho:', cart);
        console.log('Itens no carrinho:', cart.length);
        console.log('Endereço:', currentAddress);
        console.log('Frete:', shippingCost);
        console.log('Desconto:', discount);
        console.log('Método pagamento:', document.querySelector('input[name="paymentMethod"]:checked')?.value);

        // Verificar elementos no DOM
        console.log('Seção endereço:', document.getElementById('addressSection') ? '✅ Encontrada' : ' Não encontrada');
        console.log('Seção pagamento:', document.getElementById('paymentSection') ? '✅ Encontrada' : ' Não encontrada');
        console.log('Linha desconto:', document.getElementById('discountRow') ? '✅ Encontrada' : ' Não encontrada');

        showAlert('Verifique o console (F12) para detalhes do debug', 'info');
    }

    // Adicionar botão de debug (remover em produção)
    document.addEventListener('DOMContentLoaded', function() {
        const debugBtn = document.createElement('button');
        debugBtn.className = 'btn btn-outline-secondary btn-sm position-fixed';
        debugBtn.style.bottom = '20px';
        debugBtn.style.right = '20px';
        debugBtn.style.zIndex = '1000';
        debugBtn.innerHTML = '<i class="bi bi-bug"></i> Debug';
        debugBtn.onclick = debugCart;
        document.body.appendChild(debugBtn);
    });