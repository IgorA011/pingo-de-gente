// Gerenciamento de produtos

let allProducts = [];

// Carregar todos os produtos
async function loadAllProducts(categoria = null) {
    try {
        let url = `${API_BASE_URL}/produtos`;
        if (categoria) {
            url += `?categoria=${encodeURIComponent(categoria)}`;
        }

        const response = await fetch(url);
        if (response.ok) {
            allProducts = await response.json();
            displayAllProducts(allProducts);
        } else {
            console.error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Exibir todos os produtos
function displayAllProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    productsContainer.innerHTML = '';

    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">Nenhum produto encontrado.</p>
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
                    <div class="mb-2">
                        <span class="badge bg-light text-dark">${product.categoria}</span>
                        ${product.quantidade <= 5 ? '<span class="badge bg-warning ms-1">Estoque Baixo</span>' : ''}
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="price-tag">${formatPrice(product.preco)}</span>
                        <div>
                            <button class="btn btn-primary-custom btn-sm" onclick="viewProduct(${product.id})">
                                Ver Detalhes
                            </button>
                            <button class="btn btn-outline-primary btn-sm ms-1" onclick="addToCart(${product.id}, 1)">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Visualizar produto
async function viewProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos/${productId}`);
        if (response.ok) {
            const product = await response.json();

            document.getElementById('modalProductName').textContent = product.nome;
            document.getElementById('modalProductDescription').textContent = product.descricao;
            document.getElementById('modalProductPrice').textContent = formatPrice(product.preco);
            document.getElementById('modalProductImage').src = `${API_BASE_URL}${product.imagemUrl || '/images/default.jpg'}`;
            document.getElementById('modalProductImage').onerror = function() {
                this.src = 'https://via.placeholder.com/400x300?text=Imagem+Indispon%C3%ADvel';
            };

            const stockElement = document.getElementById('modalProductStock');
            if (product.quantidade > 0) {
                stockElement.innerHTML = `<span class="text-success">Em estoque: ${product.quantidade} unidades</span>`;
                if (product.quantidade <= 5) {
                    stockElement.innerHTML += ` <span class="badge bg-warning">Estoque Baixo</span>`;
                }
            } else {
                stockElement.innerHTML = '<span class="text-danger">Fora de estoque</span>';
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
    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        showAlert('Erro ao carregar detalhes do produto', 'danger');
    }
}

// Filtrar produtos
function filterProducts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    let filteredProducts = allProducts;

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.nome.toLowerCase().includes(searchTerm) ||
            product.descricao.toLowerCase().includes(searchTerm) ||
            product.categoria.toLowerCase().includes(searchTerm)
        );
    }

    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product =>
            product.categoria === categoryFilter
        );
    }

    displayAllProducts(filteredProducts);
}

// Inicialização da página de produtos
if (window.location.pathname.includes('produtos.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoria = urlParams.get('categoria');

        if (categoria) {
            document.getElementById('categoryFilter').value = categoria;
        }

        loadAllProducts(categoria);

        // Event listeners para filtros
        document.getElementById('searchInput')?.addEventListener('input', filterProducts);
        document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    });
}