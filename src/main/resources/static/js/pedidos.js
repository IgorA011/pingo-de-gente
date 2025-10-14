async function loadOrders() {
        const loginRequired = document.getElementById('loginRequired');
        const ordersContent = document.getElementById('ordersContent');
        const emptyOrders = document.getElementById('emptyOrders');
        const ordersList = document.getElementById('ordersList');

        if (!isAuthenticated()) {
            loginRequired.style.display = 'block';
            ordersContent.style.display = 'none';
            return;
        }

        loginRequired.style.display = 'none';
        ordersContent.style.display = 'block';

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/pedidos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const pedidos = await response.json();

                if (pedidos.length === 0) {
                    emptyOrders.style.display = 'block';
                    ordersList.style.display = 'none';
                } else {
                    emptyOrders.style.display = 'none';
                    ordersList.style.display = 'block';
                    displayOrders(pedidos);
                }
            } else {
                showAlert('Erro ao carregar pedidos', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            showAlert('Erro de conexão', 'danger');
        }
    }

    function displayOrders(pedidos) {
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';

        pedidos.forEach(pedido => {
            const orderCard = document.createElement('div');
            orderCard.className = 'card mb-3';
            orderCard.innerHTML = `
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h6>Pedido #${pedido.id}</h6>
                            <small class="text-muted">
                                Data: ${new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                            </small>
                        </div>
                        <div class="col-md-3">
                            <span class="order-status status-${pedido.status.toLowerCase().replace('_', '-')}">
                                ${pedido.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div class="col-md-3 text-end">
                            <strong>${formatPrice(pedido.valorTotal)}</strong>
                        </div>
                    </div>

                    <div class="mt-3">
                        <h6>Itens do Pedido:</h6>
                        ${pedido.itens.map(item => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span>${item.produto.nome} x ${item.quantidade}</span>
                                <span>${formatPrice(item.valorUnitario * item.quantidade)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
    }

    // Carregar pedidos quando a página for acessada
    if (window.location.pathname.includes('pedidos.html')) {
        document.addEventListener('DOMContentLoaded', loadOrders);
    }