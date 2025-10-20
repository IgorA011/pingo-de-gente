    const API_BASE_URL = 'http://localhost:8080';

    // Estado da aplicação
    let adminProducts = [];
    let adminOrders = [];
    let adminUsers = [];
    let currentEditingProduct = null;

    // Verificar se é admin
    function checkAdminAccess() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.perfil !== 'ADMIN') {
            document.getElementById('accessDenied').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
            return false;
        }
        document.getElementById('accessDenied').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';

        document.getElementById('userName').textContent = user.nome;
        document.querySelector('.user-avatar').textContent = user.nome.charAt(0).toUpperCase();

        return true;
    }

    // Navegação entre abas
    function showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        document.getElementById(tabName + 'Tab').style.display = 'block';

        switch(tabName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'products':
                loadAdminProducts();
                break;
            case 'orders':
                loadAdminOrders();
                break;
            case 'users':
                loadAdminUsers();
                break;
        }
    }

    // Carregar dashboard
    async function loadDashboard() {
        if (!checkAdminAccess()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + '/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                updateDashboard(data);
            } else {
                // Se não tiver dashboard, usar dados padrão
                updateDashboard({
                    totalUsuarios: adminUsers.length,
                    totalProdutos: adminProducts.length,
                    totalPedidos: adminOrders.length,
                    pedidosPendentes: adminOrders.filter(o => o.status === 'EM_PROCESSAMENTO').length,
                    estoqueBaixo: adminProducts.filter(p => p.quantidade <= 5).length,
                    totalVendas: adminOrders.reduce((sum, o) => sum + o.valorTotal, 0)
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            // Usar dados locais como fallback
            updateDashboard({
                totalUsuarios: adminUsers.length,
                totalProdutos: adminProducts.length,
                totalPedidos: adminOrders.length,
                pedidosPendentes: adminOrders.filter(o => o.status === 'EM_PROCESSAMENTO').length,
                estoqueBaixo: adminProducts.filter(p => p.quantidade <= 5).length,
                totalVendas: adminOrders.reduce((sum, o) => sum + o.valorTotal, 0)
            });
        }
    }

    // Atualizar dashboard
    function updateDashboard(data) {
        document.getElementById('totalUsers').textContent = data.totalUsuarios || 0;
        document.getElementById('totalProducts').textContent = data.totalProdutos || 0;
        document.getElementById('totalOrders').textContent = data.totalPedidos || 0;
        document.getElementById('pendingOrders').textContent = data.pedidosPendentes || 0;
        document.getElementById('lowStockCount').textContent = data.estoqueBaixo || 0;
        document.getElementById('totalRevenue').textContent = formatPrice(data.totalVendas || 0);
    }

    // Carregar produtos para admin
    async function loadAdminProducts() {
        if (!checkAdminAccess()) return;

        try {
            const response = await fetch(API_BASE_URL + '/produtos', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                adminProducts = await response.json();
                displayAdminProducts(adminProducts);
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showAlert('Erro ao carregar produtos', 'danger');
        }
    }

    // Exibir produtos para admin
    function displayAdminProducts(products) {
        const container = document.getElementById('adminProductsList');

        if (products.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h4 class="mt-3">Nenhum produto encontrado</h4>
                    <p class="text-muted">Comece adicionando seu primeiro produto!</p>
                    <button class="btn btn-primary-custom" data-bs-toggle="modal" data-bs-target="#productModal">
                        <i class="bi bi-plus-circle"></i> Adicionar Produto
                    </button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Buscar produto..." id="searchProduct">
                        <button class="btn btn-outline-secondary" type="button" onclick="searchProducts()">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <select class="form-select" onchange="filterProductsByCategory(this.value)">
                        <option value="">Todas as categorias</option>
                                <option value="Roupas">Roupas</option>
                                <option value="Acessórios">Acessórios</option>
                                <option value="Brinquedos">Brinquedos</option>
                    </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Imagem</th>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Preço</th>
                            <th>Estoque</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        products.forEach(product => {
            const stockClass = product.quantidade === 0 ? 'out-of-stock' :
                             product.quantidade <= 5 ? 'low-stock' : '';
            const stockStatus = product.quantidade === 0 ? '<span class="badge bg-danger">Fora de Estoque</span>' :
                              product.quantidade <= 5 ? '<span class="badge bg-warning">Estoque Baixo</span>' :
                              '<span class="badge bg-success">Em Estoque</span>';

            const imageUrl = product.imagemUrl ?
                `${API_BASE_URL}${product.imagemUrl}` :
                'https://via.placeholder.com/60x60?text=Sem+Imagem';

            html += `
                <tr class="${stockClass}">
                    <td>
                        <img src="${imageUrl}"
                             class="product-image-admin"
                             onerror="this.src='https://via.placeholder.com/60x60?text=Erro+Imagem'">
                    </td>
                    <td>
                        <strong>${product.nome}</strong>
                        <br>
                        <small class="text-muted">${product.descricao ? product.descricao.substring(0, 50) + '...' : ''}</small>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark">${product.categoria}</span>
                    </td>
                    <td>
                        <strong class="price-tag">${formatPrice(product.preco)}</strong>
                    </td>
                    <td>
                        <span class="${product.quantidade <= 5 ? 'stock-low' : ''}">
                            ${product.quantidade} unidades
                        </span>
                    </td>
                    <td>${stockStatus}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editProduct(${product.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteProduct(${product.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <small class="text-muted">Total: ${products.length} produtos</small>
            </div>
        `;

        container.innerHTML = html;
    }

    // Buscar produtos
    function searchProducts() {
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const filteredProducts = adminProducts.filter(product =>
            product.nome.toLowerCase().includes(searchTerm) ||
            product.descricao.toLowerCase().includes(searchTerm)
        );
        displayAdminProducts(filteredProducts);
    }

    // Filtrar produtos por categoria
    function filterProductsByCategory(category) {
        if (!category) {
            displayAdminProducts(adminProducts);
            return;
        }
        const filteredProducts = adminProducts.filter(product => product.categoria === category);
        displayAdminProducts(filteredProducts);
    }

    // Preview de imagem no formulário de criação
    document.getElementById('productImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                showAlert('Por favor, selecione uma imagem válida (JPEG, PNG ou GIF).', 'warning');
                this.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showAlert('A imagem deve ter no máximo 5MB.', 'warning');
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Preview de imagem no formulário de edição
    document.getElementById('editProductImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                showAlert('Por favor, selecione uma imagem válida (JPEG, PNG ou GIF).', 'warning');
                this.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showAlert('A imagem deve ter no máximo 5MB.', 'warning');
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('editImagePreview');
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Formulário de criação de produto com upload
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('productName').value;
        const preco = document.getElementById('productPrice').value;
        const categoria = document.getElementById('productCategory').value;
        const quantidade = document.getElementById('productQuantity').value;
        const imagem = document.getElementById('productImage').files[0];

        if (!nome || !preco || !categoria || !quantidade) {
            showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        if (!imagem) {
            showAlert('Por favor, selecione uma imagem para o produto.', 'warning');
            return;
        }

        const formData = new FormData();

        const produto = {
            nome: nome,
            descricao: document.getElementById('productDescription').value || '',
            preco: parseFloat(preco),
            categoria: categoria,
            quantidade: parseInt(quantidade)
        };

        formData.append('produto', new Blob([JSON.stringify(produto)], {
            type: 'application/json'
        }));

        formData.append('imagem', imagem);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + '/produtos/com-imagem', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const novoProduto = await response.json();
                showAlert('Produto criado com sucesso!', 'success');

                document.getElementById('productForm').reset();
                document.getElementById('imagePreview').style.display = 'none';

                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                modal.hide();

                adminProducts.push(novoProduto);
                displayAdminProducts(adminProducts);
                loadDashboard();
            } else {
                const errorText = await response.text();
                let errorMessage = 'Erro ao criar produto';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                showAlert(errorMessage, 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro de conexão com o servidor', 'danger');
        }
    });

    // Formulário de edição de produto
    document.getElementById('editProductForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const productId = document.getElementById('editProductId').value;

        const nome = document.getElementById('editProductName').value;
        const preco = document.getElementById('editProductPrice').value;
        const categoria = document.getElementById('editProductCategory').value;
        const quantidade = document.getElementById('editProductQuantity').value;

        if (!nome || !preco || !categoria || !quantidade) {
            showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        const produto = {
            nome: nome,
            descricao: document.getElementById('editProductDescription').value || '',
            preco: parseFloat(preco),
            categoria: categoria,
            quantidade: parseInt(quantidade),
            imagemUrl: currentEditingProduct.imagemUrl
        };

        const imageFile = document.getElementById('editProductImage').files[0];

        if (imageFile) {
            await updateProductWithImage(productId, produto, imageFile);
        } else {
            await updateProductWithoutImage(productId, produto);
        }
    });

    // Atualizar produto com nova imagem
    async function updateProductWithImage(productId, produto, imageFile) {
        const formData = new FormData();
        formData.append('produto', new Blob([JSON.stringify(produto)], {
            type: 'application/json'
        }));
        formData.append('imagem', imageFile);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + `/produtos/com-imagem`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await deleteProductSilent(productId);
                const produtoAtualizado = await response.json();
                showAlert('Produto atualizado com sucesso!', 'success');

                const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
                modal.hide();

                const index = adminProducts.findIndex(p => p.id == productId);
                if (index !== -1) {
                    adminProducts[index] = produtoAtualizado;
                } else {
                    adminProducts.push(produtoAtualizado);
                }
                displayAdminProducts(adminProducts);
            } else {
                const errorText = await response.text();
                let errorMessage = 'Erro ao atualizar produto';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                showAlert(errorMessage, 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro de conexão com o servidor', 'danger');
        }
    }

    // Atualizar produto sem nova imagem
    async function updateProductWithoutImage(productId, produto) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + `/produtos/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });

            if (response.ok) {
                const produtoAtualizado = await response.json();
                showAlert('Produto atualizado com sucesso!', 'success');

                const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
                modal.hide();

                const index = adminProducts.findIndex(p => p.id == productId);
                if (index !== -1) {
                    adminProducts[index] = produtoAtualizado;
                }
                displayAdminProducts(adminProducts);
            } else {
                const errorText = await response.text();
                let errorMessage = 'Erro ao atualizar produto';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                showAlert(errorMessage, 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro de conexão com o servidor', 'danger');
        }
    }

    // Deletar produto silenciosamente
    async function deleteProductSilent(productId) {
        try {
            const token = localStorage.getItem('token');
            await fetch(API_BASE_URL + `/produtos/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Erro ao deletar produto antigo:', error);
        }
    }

    // Editar produto - carregar dados no formulário
    async function editProduct(productId) {
        try {
            const response = await fetch(API_BASE_URL + `/produtos/${productId}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const product = await response.json();
                currentEditingProduct = product;

                document.getElementById('editProductId').value = product.id;
                document.getElementById('editProductName').value = product.nome;
                document.getElementById('editProductDescription').value = product.descricao || '';
                document.getElementById('editProductPrice').value = product.preco;
                document.getElementById('editProductCategory').value = product.categoria;
                document.getElementById('editProductQuantity').value = product.quantidade;

                if (product.imagemUrl) {
                    const preview = document.getElementById('currentImagePreview');
                    preview.src = `${API_BASE_URL}${product.imagemUrl}`;
                    preview.style.display = 'block';
                    document.getElementById('currentImageContainer').style.display = 'block';
                } else {
                    document.getElementById('currentImageContainer').style.display = 'none';
                }

                document.getElementById('editImagePreview').style.display = 'none';
                document.getElementById('editProductImage').value = '';

                const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            showAlert('Erro ao carregar produto', 'danger');
        }
    }

    // Deletar produto - CORRIGIDO
    async function deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + `/produtos/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showAlert('Produto excluído com sucesso!', 'success');

                // Atualizar a lista de produtos
                adminProducts = adminProducts.filter(p => p.id != productId);
                displayAdminProducts(adminProducts);
                loadDashboard();
            } else {
                const errorText = await response.text();
                let errorMessage = 'Erro ao excluir produto';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                showAlert(errorMessage, 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro de conexão: ' + error.message, 'danger');
        }
    }

    // GESTÃO DE PEDIDOS - CORRIGIDO

    // Carregar pedidos para admin
    async function loadAdminOrders() {
        if (!checkAdminAccess()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + '/pedidos', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                adminOrders = await response.json();
                displayAdminOrders(adminOrders);
            } else {
                throw new Error('Erro ao carregar pedidos');
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            document.getElementById('adminOrdersList').innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-receipt display-1 text-muted"></i>
                    <h4 class="mt-3">Erro ao carregar pedidos</h4>
                    <p class="text-muted">${error.message}</p>
                    <button class="btn btn-primary-custom" onclick="loadAdminOrders()">
                        <i class="bi bi-arrow-clockwise"></i> Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    // Exibir pedidos para admin
    function displayAdminOrders(orders) {
        const container = document.getElementById('adminOrdersList');

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-receipt display-1 text-muted"></i>
                    <h4 class="mt-3">Nenhum pedido encontrado</h4>
                    <p class="text-muted">Ainda não há pedidos no sistema.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Buscar pedido..." id="searchOrder">
                        <button class="btn btn-outline-secondary" type="button" onclick="searchOrders()">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <select class="form-select" onchange="filterOrdersByStatus(this.value)">
                        <option value="">Todos os status</option>
                        <option value="EM_PROCESSAMENTO">Em Processamento</option>
                        <option value="PEDIDO_ENVIADO">Pedido Enviado</option>
                        <option value="PEDIDO_FINALIZADO">Pedido Finalizado</option>
                        <option value="PEDIDO_CANCELADO">Cancelado</option>
                    </select>
                </div>
            </div>
        `;

        orders.forEach(order => {
            const statusClass = getOrderStatusClass(order.status);
            const statusText = getOrderStatusText(order.status);
            const itemCount = order.itens ? order.itens.length : 0;
            const usuarioNome = order.usuario ? order.usuario.nome : 'N/A';
            const usuarioEmail = order.usuario ? order.usuario.email : 'N/A';

            html += `
                <div class="card mb-3 order-card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <strong>#${order.id}</strong>
                                <br>
                                <small class="text-muted">${new Date(order.dataPedido).toLocaleDateString('pt-BR')}</small>
                            </div>
                            <div class="col-md-2">
                                <div>
                                    <strong>${usuarioNome}</strong>
                                    <br>
                                    <small class="text-muted">${usuarioEmail}</small>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <span class="badge bg-secondary">${itemCount} itens</span>
                            </div>
                            <div class="col-md-2">
                                <strong class="price-tag">${formatPrice(order.valorTotal)}</strong>
                            </div>
                            <div class="col-md-2">
                                <span class="order-status ${statusClass}">${statusText}</span>
                            </div>
                            <div class="col-md-2">
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="viewOrderDetails(${order.id})" title="Ver detalhes">
                                        <i class="bi bi-eye"></i> Detalhes
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="editOrderStatus(${order.id})" title="Alterar status">
                                        <i class="bi bi-pencil"></i> Status
                                    </button>
                                    ${order.status !== 'PEDIDO_CANCELADO' && order.status !== 'PEDIDO_FINALIZADO' ? `
                                        <button class="btn btn-outline-danger" onclick="cancelOrder(${order.id})" title="Cancelar pedido">
                                            <i class="bi bi-x-circle"></i> Cancelar
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
            <div class="mt-3">
                <small class="text-muted">Total: ${orders.length} pedidos</small>
            </div>
        `;

        container.innerHTML = html;
    }

    // Ver detalhes do pedido - CORREÇÃO: usar a lista já carregada
    async function viewOrderDetails(orderId) {
        try {
            // Buscar o pedido da lista já carregada
            const order = adminOrders.find(o => o.id === orderId);
            if (order) {
                showOrderDetailsModal(order);
            } else {
                // Se não encontrou na lista, tentar buscar individualmente
                const token = localStorage.getItem('token');
                const response = await fetch(API_BASE_URL + `/pedidos`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const allOrders = await response.json();
                    const foundOrder = allOrders.find(o => o.id === orderId);
                    if (foundOrder) {
                        showOrderDetailsModal(foundOrder);
                    } else {
                        showAlert('Pedido não encontrado', 'danger');
                    }
                } else {
                    showAlert('Erro ao buscar pedido', 'danger');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do pedido:', error);
            showAlert('Erro ao carregar detalhes do pedido: ' + error.message, 'danger');
        }
    }

    // Modal de detalhes do pedido
    function showOrderDetailsModal(order) {
        const existingModal = document.getElementById('orderDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="orderDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalhes do Pedido #${order.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Informações do Cliente</h6>
                                    <p>
                                        <strong>Nome:</strong> ${order.usuario ? order.usuario.nome : 'N/A'}<br>
                                        <strong>Email:</strong> ${order.usuario ? order.usuario.email : 'N/A'}<br>
                                        <strong>Telefone:</strong> ${order.usuario && order.usuario.telefone ? order.usuario.telefone : 'N/A'}
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Informações do Pedido</h6>
                                    <p>
                                        <strong>Data:</strong> ${new Date(order.dataPedido).toLocaleString('pt-BR')}<br>
                                        <strong>Status:</strong> <span class="order-status ${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span><br>
                                        <strong>Total:</strong> ${formatPrice(order.valorTotal)}
                                    </p>
                                </div>
                            </div>

                            <h6 class="mt-4">Itens do Pedido</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Quantidade</th>
                                            <th>Preço Unit.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${order.itens ? order.itens.map(item => `
                                            <tr>
                                                <td>${item.produto ? item.produto.nome : 'Produto não encontrado'}</td>
                                                <td>${item.quantidade}</td>
                                                <td>${formatPrice(item.valorUnitario)}</td>
                                                <td>${formatPrice(item.valorUnitario * item.quantidade)}</td>
                                            </tr>
                                        `).join('') : '<tr><td colspan="4">Nenhum item encontrado</td></tr>'}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="3" class="text-end"><strong>Total:</strong></td>
                                            <td><strong>${formatPrice(order.valorTotal)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            ${order.status !== 'PEDIDO_CANCELADO' && order.status !== 'PEDIDO_FINALIZADO' ? `
                                <button type="button" class="btn btn-primary" onclick="editOrderStatus(${order.id})">Alterar Status</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById('orderDetailsModal');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', function () {
            setTimeout(() => {
                if (modalElement.parentElement) {
                    modalElement.remove();
                }
            }, 300);
        });

        modal.show();
    }

    // Editar status do pedido - CORREÇÃO: usar dados da lista
    async function editOrderStatus(orderId) {
        try {
            // Buscar o pedido da lista já carregada
            const order = adminOrders.find(o => o.id === orderId);
            if (order) {
                showEditOrderStatusModal(order);
            } else {
                showAlert('Pedido não encontrado', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar pedido:', error);
            showAlert('Erro ao carregar pedido: ' + error.message, 'danger');
        }
    }

    // Modal para editar status do pedido - CORRIGIDO
    function showEditOrderStatusModal(order) {
        const existingModal = document.getElementById('editOrderStatusModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="editOrderStatusModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Alterar Status do Pedido #${order.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Status Atual:</label>
                                <div>
                                    <span class="order-status ${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="newOrderStatus" class="form-label">Novo Status:</label>
                                <select class="form-select" id="newOrderStatus">
                                    <option value="EM_PROCESSAMENTO" ${order.status === 'EM_PROCESSAMENTO' ? 'selected' : ''}>Em Processamento</option>
                                    <option value="PEDIDO_ENVIADO" ${order.status === 'PEDIDO_ENVIADO' ? 'selected' : ''}>Pedido Enviado</option>
                                    <option value="PEDIDO_FINALIZADO" ${order.status === 'PEDIDO_FINALIZADO' ? 'selected' : ''}>Pedido Finalizado</option>
                                    <option value="PEDIDO_CANCELADO" ${order.status === 'PEDIDO_CANCELADO' ? 'selected' : ''}>Cancelado</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="updateOrderStatus(${order.id})">Salvar Alteração</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById('editOrderStatusModal');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', function () {
            setTimeout(() => {
                if (modalElement.parentElement) {
                    modalElement.remove();
                }
            }, 300);
        });

        modal.show();
    }

    // Atualizar status do pedido - CORRIGIDO
    async function updateOrderStatus(orderId) {
        const newStatus = document.getElementById('newOrderStatus').value;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + `/pedidos/${orderId}/status?status=${newStatus}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showAlert('Status do pedido atualizado com sucesso!', 'success');

                // Fechar o modal de forma segura
                const modalElement = document.getElementById('editOrderStatusModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    }
                    // Remover o modal do DOM após fechar
                    setTimeout(() => {
                        if (modalElement.parentElement) {
                            modalElement.remove();
                        }
                    }, 300);
                }

                // Recarregar os dados
                await loadAdminOrders();
                await loadDashboard();
            } else {
                const errorText = await response.text();
                showAlert('Erro ao atualizar status: ' + errorText, 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao atualizar status: ' + error.message, 'danger');
        }
    }

    // Cancelar pedido - CORRIGIDO
    async function cancelOrder(orderId) {
        if (!confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE_URL + `/pedidos/${orderId}/status?status=PEDIDO_CANCELADO`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showAlert('Pedido cancelado com sucesso!', 'success');
                await loadAdminOrders();
                await loadDashboard();
            } else {
                const errorText = await response.text();
                showAlert('Erro ao cancelar pedido: ' + errorText, 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao cancelar pedido: ' + error.message, 'danger');
        }
    }

    // GESTÃO DE USUÁRIOS - CORRIGIDO

    // Carregar usuários para admin
    async function loadAdminUsers() {
        if (!checkAdminAccess()) return;

        try {
            // Como não tem controller de usuários, vamos simular dados
            const token = localStorage.getItem('token');

            // Tentar buscar usuários se existir o endpoint
            try {
                const response = await fetch(API_BASE_URL + '/admin/usuarios', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    adminUsers = await response.json();
                } else {
                    // Se não existir, usar dados simulados
                    adminUsers = await getSimulatedUsers();
                }
            } catch (error) {
                // Se der erro, usar dados simulados
                adminUsers = await getSimulatedUsers();
            }

            displayAdminUsers(adminUsers);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            document.getElementById('adminUsersList').innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-people display-1 text-muted"></i>
                    <h4 class="mt-3">Funcionalidade em Desenvolvimento</h4>
                    <p class="text-muted">Gestão de usuários estará disponível em breve.</p>
                </div>
            `;
        }
    }

    // Dados simulados de usuários
    async function getSimulatedUsers() {
        // Buscar usuário atual do localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        return [
            {
                id: 1,
                nome: currentUser.nome || 'Administrador',
                email: currentUser.email || 'admin@loja.com',
                telefone: '(11) 99999-9999',
                perfil: 'ADMIN',
                ativo: true,
                dataCadastro: new Date().toISOString(),
                cpf: '123.456.789-00'
            },
            {
                id: 2,
                nome: 'João Silva',
                email: 'joao@email.com',
                telefone: '(11) 88888-8888',
                perfil: 'USER',
                ativo: true,
                dataCadastro: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                cpf: '987.654.321-00'
            },
            {
                id: 3,
                nome: 'Maria Santos',
                email: 'maria@email.com',
                telefone: '(11) 77777-7777',
                perfil: 'USER',
                ativo: false,
                dataCadastro: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                cpf: '456.789.123-00'
            }
        ];
    }

    // Exibir usuários para admin
    function displayAdminUsers(users) {
        const container = document.getElementById('adminUsersList');

        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-people display-1 text-muted"></i>
                    <h4 class="mt-3">Nenhum usuário encontrado</h4>
                    <p class="text-muted">Não há usuários cadastrados no sistema.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Buscar usuário..." id="searchUser">
                        <button class="btn btn-outline-secondary" type="button" onclick="searchUsers()">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <select class="form-select" onchange="filterUsersByProfile(this.value)">
                        <option value="">Todos os perfis</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="ESTOQUISTA">Estoquista</option>
                        <option value="USER">Usuário</option>
                    </select>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Perfil</th>
                            <th>Status</th>
                            <th>Data Cadastro</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            const badgeClass = getProfileBadgeClass(user.perfil);
            const statusBadge = user.ativo ?
                '<span class="badge bg-success">Ativo</span>' :
                '<span class="badge bg-danger">Inativo</span>';

            const dataCadastro = user.dataCadastro ?
                new Date(user.dataCadastro).toLocaleDateString('pt-BR') :
                'N/A';

            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-sm me-2">
                                ${user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <strong>${user.nome || 'N/A'}</strong>
                            </div>
                        </div>
                    </td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.telefone || 'N/A'}</td>
                    <td>
                        <span class="user-badge ${badgeClass}">${user.perfil || 'USER'}</span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <small class="text-muted">${dataCadastro}</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="viewUserDetails(${user.id})" title="Ver detalhes">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="editUserProfile(${user.id})" title="Editar perfil">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-${user.ativo ? 'warning' : 'success'}" onclick="toggleUserStatus(${user.id}, ${!user.ativo})" title="${user.ativo ? 'Desativar' : 'Ativar'} usuário">
                                <i class="bi bi-${user.ativo ? 'pause' : 'play'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <small class="text-muted">Total: ${users.length} usuários</small>
            </div>
        `;

        container.innerHTML = html;
    }

    // Ver detalhes do usuário - DADOS SIMULADOS
    async function viewUserDetails(userId) {
        try {
            const user = adminUsers.find(u => u.id === userId);
            if (user) {
                showUserDetailsModal(user);
            } else {
                showAlert('Usuário não encontrado', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do usuário:', error);
            showAlert('Erro ao carregar detalhes do usuário', 'danger');
        }
    }

    // Modal de detalhes do usuário
    function showUserDetailsModal(user) {
        const existingModal = document.getElementById('userDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="userDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalhes do Usuário</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Informações Pessoais</h6>
                                    <p>
                                        <strong>Nome:</strong> ${user.nome}<br>
                                        <strong>Email:</strong> ${user.email}<br>
                                        <strong>Telefone:</strong> ${user.telefone || 'N/A'}<br>
                                        <strong>CPF:</strong> ${user.cpf || 'N/A'}
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Informações da Conta</h6>
                                    <p>
                                        <strong>Perfil:</strong> <span class="user-badge ${getProfileBadgeClass(user.perfil)}">${user.perfil}</span><br>
                                        <strong>Status:</strong> ${user.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>'}<br>
                                        <strong>Data de Cadastro:</strong> ${user.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString('pt-BR') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-primary" onclick="editUserProfile(${user.id})">Editar Perfil</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById('userDetailsModal');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', function () {
            setTimeout(() => {
                if (modalElement.parentElement) {
                    modalElement.remove();
                }
            }, 300);
        });

        modal.show();
    }

    // Editar perfil do usuário - DADOS SIMULADOS
    async function editUserProfile(userId) {
        try {
            const user = adminUsers.find(u => u.id === userId);
            if (user) {
                showEditUserProfileModal(user);
            } else {
                showAlert('Usuário não encontrado', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            showAlert('Erro ao carregar usuário', 'danger');
        }
    }

    // Modal para editar perfil do usuário
    function showEditUserProfileModal(user) {
        const existingModal = document.getElementById('editUserProfileModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="editUserProfileModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Perfil - ${user.nome}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="editUserProfile" class="form-label">Perfil:</label>
                                <select class="form-select" id="editUserProfile">
                                    <option value="USER" ${user.perfil === 'USER' ? 'selected' : ''}>Usuário</option>
                                    <option value="ESTOQUISTA" ${user.perfil === 'ESTOQUISTA' ? 'selected' : ''}>Estoquista</option>
                                    <option value="ADMIN" ${user.perfil === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="editUserStatus" class="form-label">Status:</label>
                                <select class="form-select" id="editUserStatus">
                                    <option value="true" ${user.ativo ? 'selected' : ''}>Ativo</option>
                                    <option value="false" ${!user.ativo ? 'selected' : ''}>Inativo</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="updateUserProfile(${user.id})">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById('editUserProfileModal');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', function () {
            setTimeout(() => {
                if (modalElement.parentElement) {
                    modalElement.remove();
                }
            }, 300);
        });

        modal.show();
    }

    // Atualizar perfil do usuário - DADOS SIMULADOS
    async function updateUserProfile(userId) {
        const newProfile = document.getElementById('editUserProfile').value;
        const newStatus = document.getElementById('editUserStatus').value === 'true';

        try {
            // Em uma implementação real, aqui faria a requisição para o backend
            // Por enquanto, apenas atualizamos localmente

            const userIndex = adminUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                adminUsers[userIndex].perfil = newProfile;
                adminUsers[userIndex].ativo = newStatus;

                showAlert('Perfil do usuário atualizado com sucesso! (dados locais)', 'success');

                const modalElement = document.getElementById('editUserProfileModal');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }

                await loadAdminUsers();
            } else {
                showAlert('Usuário não encontrado', 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao atualizar perfil: ' + error.message, 'danger');
        }
    }

    // Alternar status do usuário - CORRIGIDO
    async function toggleUserStatus(userId, newStatus) {
        const actionText = newStatus ? 'ativar' : 'desativar';

        if (!confirm(`Tem certeza que deseja ${actionText} este usuário?`)) {
            return;
        }

        try {
            // Em uma implementação real, aqui faria a requisição para o backend
            const userIndex = adminUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                adminUsers[userIndex].ativo = newStatus;

                showAlert(`Usuário ${actionText === 'ativar' ? 'ativado' : 'desativado'} com sucesso! (dados locais)`, 'success');

                // Recarregar a lista de usuários
                displayAdminUsers(adminUsers);
            } else {
                showAlert('Usuário não encontrado', 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao alterar status do usuário: ' + error.message, 'danger');
        }
    }

    // FUNÇÕES AUXILIARES

    function getOrderStatusClass(status) {
        const statusClasses = {
            'EM_PROCESSAMENTO': 'status-em-processamento',
            'PEDIDO_ENVIADO': 'status-enviado',
            'PEDIDO_FINALIZADO': 'status-finalizado',
            'PEDIDO_CANCELADO': 'status-cancelado'
        };
        return statusClasses[status] || 'status-em-processamento';
    }

    function getOrderStatusText(status) {
        const statusTexts = {
            'EM_PROCESSAMENTO': 'Em Processamento',
            'PEDIDO_ENVIADO': 'Enviado',
            'PEDIDO_FINALIZADO': 'Finalizado',
            'PEDIDO_CANCELADO': 'Cancelado'
        };
        return statusTexts[status] || status;
    }

    function getProfileBadgeClass(perfil) {
        const badgeClasses = {
            'ADMIN': 'badge-admin',
            'ESTOQUISTA': 'badge-estoquista',
            'USER': 'badge-user'
        };
        return badgeClasses[perfil] || 'badge-user';
    }

    // Buscar pedidos
    function searchOrders() {
        const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
        const filteredOrders = adminOrders.filter(order =>
            order.id.toString().includes(searchTerm) ||
            (order.usuario && order.usuario.nome.toLowerCase().includes(searchTerm)) ||
            (order.usuario && order.usuario.email.toLowerCase().includes(searchTerm))
        );
        displayAdminOrders(filteredOrders);
    }

    // Filtrar pedidos por status
    function filterOrdersByStatus(status) {
        if (!status) {
            displayAdminOrders(adminOrders);
            return;
        }
        const filteredOrders = adminOrders.filter(order => order.status === status);
        displayAdminOrders(filteredOrders);
    }

    // Buscar usuários
    function searchUsers() {
        const searchTerm = document.getElementById('searchUser').value.toLowerCase();
        const filteredUsers = adminUsers.filter(user =>
            user.nome.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.telefone && user.telefone.includes(searchTerm)) ||
            (user.cpf && user.cpf.includes(searchTerm))
        );
        displayAdminUsers(filteredUsers);
    }

    // Filtrar usuários por perfil
    function filterUsersByProfile(profile) {
        if (!profile) {
            displayAdminUsers(adminUsers);
            return;
        }
        const filteredUsers = adminUsers.filter(user => user.perfil === profile);
        displayAdminUsers(filteredUsers);
    }

    // Carregar estoque baixo
    async function loadLowStock() {
        showTab('products');
        const lowStockProducts = adminProducts.filter(p => p.quantidade <= 5);
        displayAdminProducts(lowStockProducts);
    }

    // Função auxiliar para mostrar alertas - CORRIGIDA
    function showAlert(message, type) {
        // Remover alertas existentes
        const existingAlerts = document.querySelectorAll('.alert-dismissible');
        existingAlerts.forEach(alert => {
            if (alert.parentElement) {
                alert.remove();
            }
        });

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';

        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                // Adicionar fade out
                alertDiv.classList.remove('show');
                alertDiv.classList.add('fade');
                setTimeout(() => {
                    if (alertDiv.parentElement) {
                        alertDiv.remove();
                    }
                }, 150);
            }
        }, 5000);
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', function() {
        if (checkAdminAccess()) {
            loadDashboard();
        }

        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });