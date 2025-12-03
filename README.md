#  Pingo de Gente – Loja Infantil

<div align="center">

![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen?style=for-the-badge&logo=spring)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?style=for-the-badge&logo=bootstrap)
![MIT License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Sistema completo de e-commerce para produtos infantis  
**Roupas • Acessórios • Brinquedos**

🚀 Começar • 📖 Documentação • 👥 Contribuir

</div>

## ✨ Características Principais

### 👨‍👩‍👧‍👦 Para Clientes
- Cadastro e login com JWT  
- Catálogo de produtos com filtros  
- Carrinho de compras  
- Checkout com cálculo de frete  
- Acompanhamento de pedidos  
- Edição de perfil e endereço  

### 👑 Para Administradores
- Dashboard com estatísticas  
- CRUD de produtos (com upload)  
- Gestão de pedidos e usuários  
- Relatórios de vendas  

### 📦 Para Estoquistas
- Controle de estoque  
- Alertas de baixo estoque  
- Atualização rápida  

## 🎯 Tecnologias

| Camada | Tecnologias |
|-------|-------------|
| Backend | Java 21, Spring Boot, Security, JPA, JWT |
| Frontend | HTML5, CSS3, Bootstrap 5, JS ES6 |
| Banco | H2 |
| Ferramentas | Maven, Git, REST API |

## 🚀 Começando Rápido

### Pré-requisitos
Java, Maven, Git

### Passos

```
git clone https://github.com/seu-usuario/pingo-de-gente.git
cd pingo-de-gente/backend
mvn clean install
mvn spring-boot:run
```

## 🔑 Acessos de Teste

| Perfil | Email | Senha |
|--------|--------|--------|
| Admin | admin@pingodegente.com | admin123 |
| Estoquista | estoquista@pingodegente.com | estoquista123 |
| Cliente | Cadastre-se | — |

## 📁 Estrutura

```
pingo-de-gente/
├── backend/
│   ├── src/main/java/com/pingodegente/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   ├── src/main/resources/
│   │   ├── static/
│   │   └── application.properties
│   └── pom.xml
└── README.md
```

## 🌐 API Endpoints
### 🔐 Autenticação
- POST /auth/register         - Cadastrar novo usuário
- POST /auth/login            - Fazer login (JWT)
- GET  /auth/me               - Usuário atual
- PUT  /auth/perfil           - Atualizar dados
- PUT  /auth/perfil/senha     - Alterar senha

### 🛍️ Produtos
- GET    /produtos            - Listar produtos
- GET    /produtos/{id}       - Detalhes
- POST   /produtos            - Criar (Admin)
- PUT    /produtos/{id}       - Atualizar (Admin)
- DELETE /produtos/{id}       - Excluir (Admin)

### 📦 Pedidos
- GET /pedidos                - Meus pedidos
- POST /pedidos               - Criar pedido
- PUT /pedidos/{id}/status    - Atualizar status (Admin)

### 📊 Administração
- GET /admin/dashboard
- GET /admin/usuarios
- GET /admin/estatisticas

## 🎨 Páginas do Frontend

Página	URL	Acesso
- 🏠 Loja Principal	/index.html	Público
- 🛍️ Catálogo	/produtos.html	Público
- 🛒 Carrinho	/carrinho.html	Logados
- 📋 Meus Pedidos	/pedidos.html	Logados
- 👤 Perfil	/perfil.html	Logados
- 🔐 Login/Cadastro	/login.html	Público
- 👑 Painel Admin	/admin.html	Admin
- 📦 Controle de Estoque	/estoque.html	Admin/Estoquista


## 📁 Estrutura

```
server.port=8080

# H2 database
spring.datasource.url=jdbc:h2:mem:testdb
spring.h2.console.enabled=true

# JWT
jwt.secret=sua-chave-secreta-aqui-minimo-64-caracteres
jwt.expiration=86400000

# Upload
spring.servlet.multipart.max-file-size=2MB
app.upload.dir=./uploads

```
## 🗄️ Modelo de Dados (SQL Simplificado)

### 🔐 Autenticação

-- =====================================================
-- 🧑‍💻 Tabela: Usuarios
-- =====================================================
CREATE TABLE usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL,      -- USER, ESTOQUISTA, ADMIN
  rua VARCHAR(255),
  numero VARCHAR(10),
  bairro VARCHAR(255),
  cidade VARCHAR(255),
  cep VARCHAR(10),
  data_criacao TIMESTAMP,
  ativo BOOLEAN DEFAULT true
);

-- =====================================================
-- 🎁 Tabela: Produto
-- =====================================================
CREATE TABLE produto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2),
  categoria VARCHAR(100),
  quantidade INTEGER,
  imagem_url VARCHAR(500),
  data_cadastro TIMESTAMP
);

### 👨‍💻 Desenvolvedor 

Igor Alves de Oliveira
