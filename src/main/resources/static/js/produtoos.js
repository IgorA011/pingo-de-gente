// Estado da página de produtos
    let allProducts = [];
    let filteredProducts = [];
    let currentProduct = null;

    // Carregar produtos quando a página for acessada
    document.addEventListener('DOMContentLoaded', function() {
        loadAllProducts();
        setupEventListeners();

        // Verificar parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoria = urlParams.get('categoria');
        const busca = urlParams.get('busca');

        if (categoria) {
            document.getElementById('categoryFilter').value = categoria;
        }

        if (busca) {
            document.getElementById('searchInput').value = busca;
        }
    });

    // Configurar event listeners
    function setupEventListeners() {
        // Busca em tempo real
        document.getElementById('searchInput').addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                filterProducts();
                updateURL();
            }, 500);
        });

        // Filtros
        document.getElementById('categoryFilter').addEventListener('change', function() {
            filterProducts();
            updateURL();
        });

        document.getElementById('sortFilter').addEventListener('change', function() {
            sortProducts();
            displayProducts();
        });

        // Enter na busca
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterProducts();
                updateURL();
            }
        });
    }

    // Carregar todos os produtos
    async function loadAllProducts() {
        showLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/produtos`);
            if (response.ok) {
                allProducts = await response.json();
                filteredProducts = [...allProducts];

                // Aplicar filtros iniciais da URL
                applyInitialFilters();
                sortProducts();
                displayProducts();
            } else {
                showError('Erro ao carregar produtos');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            showError('Erro de conexão ao carregar produtos');
        } finally {
            showLoading(false);
        }
    }

    // Aplicar filtros iniciais da URL
    function applyInitialFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoria = urlParams.get('categoria');
        const busca = urlParams.get('busca');

        if (categoria) {
            filteredProducts = allProducts.filter(product =>
                product.categoria === categoria
            );
        }

        if (busca) {
            const searchTerm = busca.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.nome.toLowerCase().includes(searchTerm) ||
                product.descricao.toLowerCase().includes(searchTerm) ||
                product.categoria.toLowerCase().includes(searchTerm)
            );
        }
    }

    // Filtrar produtos
    function filterProducts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;

        filteredProducts = allProducts;

        // Aplicar filtro de busca
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.nome.toLowerCase().includes(searchTerm) ||
                product.descricao.toLowerCase().includes(searchTerm) ||
                product.categoria.toLowerCase().includes(searchTerm)
            );
        }

        // Aplicar filtro de categoria
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product =>
                product.categoria === categoryFilter
            );
        }

        sortProducts();
        displayProducts();
    }

    // Ordenar produtos
    function sortProducts() {
        const sortBy = document.getElementById('sortFilter').value;

        filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'preco_asc':
                    return a.preco - b.preco;
                case 'preco_desc':
                    return b.preco - a.preco;
                case 'quantidade':
                    return b.quantidade - a.quantidade;
                case 'nome':
                default:
                    return a.nome.localeCompare(b.nome);
            }
        });
    }

    // Exibir produtos
    function displayProducts() {
        const productsContainer = document.getElementById('productsContainer');
        const noProducts = document.getElementById('noProducts');
        const pagination = document.getElementById('pagination');

        // Limpar container
        productsContainer.innerHTML = '';

        if (filteredProducts.length === 0) {
            productsContainer.style.display = 'none';
            noProducts.style.display = 'block';
            pagination.style.display = 'none';
            return;
        }

        noProducts.style.display = 'none';
        productsContainer.style.display = 'flex';

        // Adicionar produtos
        filteredProducts.forEach(product => {
            const productCard = createProductCard(product);
            productsContainer.appendChild(productCard);
        });

        // Mostrar paginação se houver muitos produtos
        if (filteredProducts.length > 12) {
            pagination.style.display = 'block';
        } else {
            pagination.style.display = 'none';
        }
    }

    // Criar card de produto
    function createProductCard(product) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3 mb-4';

        col.innerHTML = `
            <div class="card product-card h-100">
                <div class="position-relative">
                    <img src="${API_BASE_URL}${product.imagemUrl || '/images/default.jpg'}"
                         class="card-img-top product-image" alt="${product.nome}"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+Indispon%C3%ADvel'">
                    ${product.quantidade <= 5 ?
                      '<span class="position-absolute top-0 start-0 badge bg-warning m-2">Estoque Baixo</span>' : ''}
                    ${product.quantidade === 0 ?
                      '<span class="position-absolute top-0 start-0 badge bg-danger m-2">Fora de Estoque</span>' : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title">${product.nome}</h6>
                    <p class="card-text flex-grow-1 small text-muted">${truncateText(product.descricao, 80)}</p>

                    <div class="mb-2">
                        <span class="badge bg-light text-dark">${product.categoria}</span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="price-tag">${formatPrice(product.preco)}</span>
                        <div class="btn-group">
                            <button class="btn btn-primary-custom btn-sm" onclick="viewProduct(${product.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-primary btn-sm"
                                    onclick="addToCart(${product.id}, 1)"
                                    ${product.quantidade === 0 ? 'disabled' : ''}>
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    // Visualizar produto
    async function viewProduct(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/produtos/${productId}`);
            if (response.ok) {
                const product = await response.json();
                currentProduct = product;
                showProductModal(product);
            } else {
                showAlert('Erro ao carregar produto', 'danger');
            }
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro de conexão', 'danger');
        }
    }

    // Mostrar modal do produto
    function showProductModal(product) {
        document.getElementById('modalProductName').textContent = product.nome;
        document.getElementById('modalProductDescription').textContent = product.descricao;
        document.getElementById('modalProductPrice').textContent = formatPrice(product.preco);
        document.getElementById('modalProductCategory').textContent = product.categoria;

        // Imagem
        const productImage = document.getElementById('modalProductImage');
        productImage.src = `${API_BASE_URL}${product.imagemUrl || '/images/default.jpg'}`;
        productImage.alt = product.nome;

        // Estoque
        const stockElement = document.getElementById('modalProductStock');
        const stockBadge = document.getElementById('modalProductStockBadge');
        const quantityInput = document.getElementById('productQuantity');

        if (product.quantidade > 0) {
            stockElement.innerHTML = `<span class="text-success">Em estoque: ${product.quantidade} unidades</span>`;
            stockBadge.textContent = 'Em Estoque';
            stockBadge.className = 'badge bg-success ms-1';
            quantityInput.max = product.quantidade;
            quantityInput.disabled = false;
            document.getElementById('addToCartModal').disabled = false;
        } else {
            stockElement.innerHTML = '<span class="text-danger">Fora de estoque</span>';
            stockBadge.textContent = 'Fora de Estoque';
            stockBadge.className = 'badge bg-danger ms-1';
            quantityInput.disabled = true;
            document.getElementById('addToCartModal').disabled = true;
        }

        // Configurar evento de adicionar ao carrinho
        document.getElementById('addToCartModal').onclick = () => {
            const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
            if (product.quantidade >= quantity) {
                addToCart(product.id, quantity);
                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                modal.hide();
            } else {
                showAlert('Quantidade indisponível em estoque', 'warning');
            }
        };

        // Abrir modal
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        productModal.show();
    }

    // Limpar filtros
    function clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('sortFilter').value = 'nome';

        filteredProducts = [...allProducts];
        sortProducts();
        displayProducts();
        updateURL();
    }

    // Atualizar URL com filtros
    function updateURL() {
        const searchTerm = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;

        const params = new URLSearchParams();

        if (searchTerm) params.set('busca', searchTerm);
        if (category) params.set('categoria', category);

        const newUrl = params.toString() ? `produtos.html?${params.toString()}` : 'produtos.html';
        window.history.replaceState({}, '', newUrl);
    }

    // Mostrar/ocultar loading
    function showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('productsContainer').style.display = show ? 'none' : 'flex';
    }

    // Mostrar erro
    function showError(message) {
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                <h4 class="mt-3">${message}</h4>
                <button class="btn btn-primary-custom mt-2" onclick="loadAllProducts()">
                    Tentar Novamente
                </button>
            </div>
        `;
        productsContainer.style.display = 'block';
    }

    // Função auxiliar para truncar texto
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Adicionar à lista de desejos (funcionalidade básica)
    function addToWishlist() {
        if (!currentProduct) return;

        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

        // Verificar se já está na lista
        if (!wishlist.find(item => item.id === currentProduct.id)) {
            wishlist.push(currentProduct);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            showAlert('Produto adicionado à lista de desejos!', 'success');
        } else {
            showAlert('Produto já está na lista de desejos', 'info');
        }
    }