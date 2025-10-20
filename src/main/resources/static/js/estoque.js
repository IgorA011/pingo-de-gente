let allProducts = []; // Armazenar todos os produtos para filtragem
    let filteredProducts = [];

    // Verificar permissões de estoquista
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar se o usuário tem permissão
        if (!auth.isEstoquista() && !auth.isAdmin()) {
            document.getElementById('accessDenied').style.display = 'block';
            document.getElementById('estoqueContent').style.display = 'none';
        } else {
            document.getElementById('accessDenied').style.display = 'none';
            document.getElementById('estoqueContent').style.display = 'block';
            loadStockData();
            setupEventListeners();
        }
    });

    function setupEventListeners() {
        // Adicionar eventos para os filtros
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('categoryFilter').addEventListener('change', applyFilters);
        document.getElementById('stockFilter').addEventListener('change', applyFilters);
        document.getElementById('sortAsc').addEventListener('change', applyFilters);
        document.getElementById('showLowStockFirst').addEventListener('change', applyFilters);
    }

    async function loadStockData() {
        try {
            const token = auth.getAuthToken();
            const response = await fetch(`${API_BASE_URL}/produtos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const products = await response.json();
                allProducts = products;
                filteredProducts = [...products];
                displayStockData(products);
                populateCategoryFilter(products);
            } else {
                console.error('Erro ao carregar produtos:', response.status);
                auth.showAlert('Erro ao carregar dados do estoque', 'danger');
            }
        } catch (error) {
            console.error('Erro ao carregar dados do estoque:', error);
            auth.showAlert('Erro de conexão ao carregar estoque', 'danger');
        }
    }

    function populateCategoryFilter(products) {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = [...new Set(products.map(p => p.categoria).filter(Boolean))];

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;
        const sortAsc = document.getElementById('sortAsc').checked;
        const showLowStockFirst = document.getElementById('showLowStockFirst').checked;

        filteredProducts = allProducts.filter(product => {
            // Filtro de busca
            const matchesSearch = product.nome.toLowerCase().includes(searchTerm);

            // Filtro de categoria
            const matchesCategory = !categoryFilter || product.categoria === categoryFilter;

            // Filtro de estoque
            let matchesStock = true;
            switch (stockFilter) {
                case 'low':
                    matchesStock = product.quantidade <= 5 && product.quantidade > 0;
                    break;
                case 'out':
                    matchesStock = product.quantidade === 0;
                    break;
                case 'normal':
                    matchesStock = product.quantidade > 5;
                    break;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        // Ordenação
        filteredProducts.sort((a, b) => {
            if (showLowStockFirst) {
                const aIsLow = a.quantidade <= 5;
                const bIsLow = b.quantidade <= 5;
                if (aIsLow && !bIsLow) return -1;
                if (!aIsLow && bIsLow) return 1;
            }

            if (sortAsc) {
                return a.nome.localeCompare(b.nome);
            } else {
                return b.nome.localeCompare(a.nome);
            }
        });

        displayStockData(filteredProducts);
    }

    function resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = 'all';
        document.getElementById('sortAsc').checked = true;
        document.getElementById('showLowStockFirst').checked = false;

        applyFilters();
    }

    function clearSearch() {
        document.getElementById('searchInput').value = '';
        applyFilters();
    }

    function displayStockData(products) {
        const lowStockProducts = document.getElementById('lowStockProducts');
        const allStockProducts = document.getElementById('allStockProducts');
        const stockSummary = document.getElementById('stockSummary');
        const lowStockCount = document.getElementById('lowStockCount');
        const totalProductsCount = document.getElementById('totalProductsCount');

        // Atualizar contadores
        lowStockCount.textContent = products.filter(p => p.quantidade <= 5 && p.quantidade > 0).length;
        totalProductsCount.textContent = products.length;

        // Produtos com estoque baixo (apenas os que estão realmente baixos)
        const lowStock = products.filter(p => p.quantidade <= 5 && p.quantidade > 0);
        if (lowStock.length === 0) {
            lowStockProducts.innerHTML = '<p class="text-muted">Nenhum produto com estoque baixo.</p>';
        } else {
            lowStockProducts.innerHTML = lowStock.map(product => `
                <div class="alert alert-warning d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${product.nome}</strong>
                        <br>
                        <small>Categoria: ${product.categoria || 'Não informada'}</small>
                        <br>
                        <small>Estoque: ${product.quantidade} unidades</small>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="updateStock(${product.id}, ${product.quantidade})">
                        Atualizar
                    </button>
                </div>
            `).join('');
        }

        // Todos os produtos (filtrados)
        if (products.length === 0) {
            allStockProducts.innerHTML = '<div class="text-center py-4"><i class="bi bi-search display-4 text-muted"></i><p class="text-muted mt-2">Nenhum produto encontrado com os filtros aplicados.</p></div>';
        } else {
            allStockProducts.innerHTML = products.map(product => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${product.nome}</h6>
                        <small class="text-muted">${product.categoria || 'Sem categoria'}</small>
                        <br>
                        <small class="text-muted">Código: ${product.id}</small>
                    </div>
                    <div class="me-3">
                        <span class="badge ${product.quantidade <= 5 ? 'bg-warning' : product.quantidade === 0 ? 'bg-danger' : 'bg-success'}">
                            ${product.quantidade} unidades
                        </span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="updateStock(${product.id}, ${product.quantidade})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            `).join('');
        }

        // Resumo baseado nos produtos filtrados
        const totalProducts = products.length;
        const lowStockCountValue = lowStock.length;
        const outOfStock = products.filter(p => p.quantidade === 0).length;
        const inStock = totalProducts - outOfStock;

        stockSummary.innerHTML = `
            <div class="mb-3">
                <h6>Produtos Encontrados</h6>
                <h3 class="text-primary">${totalProducts}</h3>
            </div>
            <div class="mb-3">
                <h6>Em Estoque</h6>
                <h3 class="text-success">${inStock}</h3>
            </div>
            <div class="mb-3">
                <h6>Estoque Baixo</h6>
                <h3 class="text-warning">${lowStockCountValue}</h3>
            </div>
            <div class="mb-3">
                <h6>Fora de Estoque</h6>
                <h3 class="text-danger">${outOfStock}</h3>
            </div>
        `;
    }

    function updateStock(productId, currentQuantity) {
        const newQuantity = prompt(`Informe a nova quantidade para o produto:`, currentQuantity);

        if (newQuantity !== null && !isNaN(newQuantity) && newQuantity >= 0) {
            const token = auth.getAuthToken();

            fetch(`${API_BASE_URL}/estoque/atualizar/${productId}?quantidade=${parseInt(newQuantity)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    auth.showAlert('Estoque atualizado com sucesso!', 'success');
                    loadStockData(); // Recarrega os dados
                } else {
                    auth.showAlert('Erro ao atualizar estoque', 'danger');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                auth.showAlert('Erro de conexão', 'danger');
            });
        }
    }

    // Adicionar evento de tecla Enter para facilitar a atualização
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.type === 'text' && activeElement.placeholder.includes('quantidade')) {
                const productId = activeElement.dataset.productId;
                const newQuantity = activeElement.value;
                if (productId && newQuantity) {
                    updateStock(productId, newQuantity);
                }
            }
        }
    });