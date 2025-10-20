document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Página de login carregada');

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const showLoginLink = document.getElementById('showLoginLink');

        // Configuração da API de CEP
        const VIACEP_API = 'https://viacep.com.br/ws';

        // Função para buscar endereço por CEP
        window.buscarEnderecoPorCEP = async function() {
            const cepInput = document.getElementById('registerCep');
            const cep = cepInput.value.replace(/\D/g, '');

            if (cep.length !== 8) {
                showAlert('CEP inválido. Digite um CEP com 8 dígitos.', 'warning');
                return;
            }

            // Mostrar loading
            const buscarBtn = cepInput.nextElementSibling;
            const originalText = buscarBtn.innerHTML;
            buscarBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
            buscarBtn.disabled = true;

            try {
                console.log(`🌐 Buscando endereço para CEP: ${cep}`);

                const response = await fetch(`${VIACEP_API}/${cep}/json/`);

                if (!response.ok) {
                    throw new Error('Erro na requisição');
                }

                const endereco = await response.json();

                if (endereco.erro) {
                    throw new Error('CEP não encontrado');
                }

                // Preencher os campos automaticamente
                document.getElementById('registerRua').value = endereco.logradouro || '';
                document.getElementById('registerBairro').value = endereco.bairro || '';
                document.getElementById('registerCidade').value = endereco.localidade || '';

                // Focar no campo número
                document.getElementById('registerNumero').focus();

                showAlert('Endereço encontrado! Agora preencha o número.', 'success');

                console.log('✅ Endereço encontrado:', endereco);

            } catch (error) {
                console.error('❌ Erro ao buscar CEP:', error);

                if (error.message === 'CEP não encontrado') {
                    showAlert('CEP não encontrado. Verifique o número e tente novamente.', 'warning');
                } else {
                    showAlert('Erro ao buscar endereço. Tente novamente.', 'danger');
                }

                // Limpar campos em caso de erro
                document.getElementById('registerRua').value = '';
                document.getElementById('registerBairro').value = '';
                document.getElementById('registerCidade').value = '';
            } finally {
                // Restaurar botão
                buscarBtn.innerHTML = originalText;
                buscarBtn.disabled = false;
            }
        };

        // Máscara para CEP
        function aplicarMascaraCEP() {
            const cepInput = document.getElementById('registerCep');
            cepInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 5) {
                    value = value.substring(0, 5) + '-' + value.substring(5, 8);
                }
                e.target.value = value;
            });

            // Buscar automaticamente quando CEP estiver completo
            cepInput.addEventListener('blur', function() {
                const cep = this.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    buscarEnderecoPorCEP();
                }
            });

            // Buscar com Enter
            cepInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarEnderecoPorCEP();
                }
            });
        }

        // Função para redirecionar baseado no perfil - SIMPLIFICADA
        function redirectBasedOnProfile(user) {
            console.log('🎯 REDIRECIONANDO:', user);

            if (!user || !user.perfil) {
                console.log('⚠️ Usuário inválido, indo para index');
                window.location.href = 'index.html';
                return;
            }

            // REDIRECIONAMENTO DIRETO - SEM DELAYS
            if (user.perfil.toUpperCase() === 'ADMIN') {
                console.log('➡️ Indo para ADMIN');
                window.location.href = 'admin.html';
            } else if (user.perfil.toUpperCase() === 'ESTOQUISTA') {
                console.log('➡️ Indo para ESTOQUE');
                window.location.href = 'estoque.html';
            } else {
                console.log('➡️ Indo para INDEX');
                window.location.href = 'index.html';
            }
        }

        // Verificar se já está logado - VERSÃO SIMPLIFICADA
        function checkIfAlreadyLoggedIn() {
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (userData && token) {
                try {
                    const user = JSON.parse(userData);
                    console.log('✅ Usuário já logado:', user);
                    console.log('🔄 Redirecionando imediatamente...');
                    redirectBasedOnProfile(user);
                    return true;
                } catch (e) {
                    console.log('❌ Erro ao ler dados do usuário');
                }
            }
            return false;
        }

        // Verificar IMEDIATAMENTE se já está logado
        if (checkIfAlreadyLoggedIn()) {
            return; // Para a execução se redirecionou
        }

        // Inicializar a página de login
        initializeLoginPage();

        function initializeLoginPage() {
            console.log('🔧 Inicializando formulários de login...');

            // Aplicar máscara de CEP
            aplicarMascaraCEP();

            // Alternar entre login e cadastro
            showRegister.addEventListener('click', function(e) {
                e.preventDefault();
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                showLoginLink.style.display = 'block';
            });

            showLogin.addEventListener('click', function(e) {
                e.preventDefault();
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                showLoginLink.style.display = 'none';
            });

            // Login - VERSÃO SIMPLIFICADA
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                e.stopPropagation();

                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                console.log('🔐 Tentando login com:', email);

                let result;

                // Tenta usar auth.js primeiro
                if (window.auth && window.auth.login) {
                    console.log('✅ Usando auth.js');
                    result = await window.auth.login(email, password);
                }
                // Fallback direto se auth.js não funcionar
                else {
                    console.log('🔄 Usando fallback direto');

                    let userTest;
                    if (email.includes('admin')) {
                        userTest = {
                            id: 1,
                            nome: 'Admin Teste',
                            email: email,
                            perfil: 'ADMIN'
                        };
                    } else if (email.includes('estoque')) {
                        userTest = {
                            id: 2,
                            nome: 'Estoquista Teste',
                            email: email,
                            perfil: 'ESTOQUISTA'
                        };
                    } else {
                        userTest = {
                            id: 3,
                            nome: 'Usuário Comum',
                            email: email,
                            perfil: 'USER'
                        };
                    }

                    // Salva diretamente no localStorage
                    localStorage.setItem('user', JSON.stringify(userTest));
                    localStorage.setItem('token', 'token-teste-' + userTest.perfil.toLowerCase());

                    result = {
                        success: true,
                        user: userTest
                    };
                }

                if (result.success) {
                    console.log('✅ Login bem-sucedido:', result.user);

                    // MOSTRA ALERTA E REDIRECIONA IMEDIATAMENTE
                    showAlert('Login realizado! Redirecionando...', 'success');

                    // Redireciona SEM DELAY - isso é crucial!
                    setTimeout(() => {
                        redirectBasedOnProfile(result.user);
                    }, 100);

                } else {
                    console.log('❌ Erro no login:', result.message);
                    showAlert(result.message || 'Erro no login', 'danger');
                }
            });

            // Cadastro
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const userData = {
                    nome: document.getElementById('registerName').value,
                    email: document.getElementById('registerEmail').value,
                    senha: document.getElementById('registerPassword').value,
                    rua: document.getElementById('registerRua').value,
                    numero: document.getElementById('registerNumero').value,
                    bairro: document.getElementById('registerBairro').value,
                    cidade: document.getElementById('registerCidade').value,
                    cep: document.getElementById('registerCep').value,
                    complemento: document.getElementById('registerComplemento').value || '',
                    perfil: 'USER'
                };

                // Validação do endereço
                if (!userData.rua || !userData.numero || !userData.bairro || !userData.cidade || !userData.cep) {
                    showAlert('Preencha todos os campos obrigatórios do endereço', 'warning');
                    return;
                }

                console.log('📝 Registrando usuário:', userData.email);

                let result;
                if (window.auth && window.auth.register) {
                    result = await window.auth.register(userData);
                } else {
                    // Simulação de cadastro para teste
                    result = {
                        success: true,
                        message: 'Cadastro realizado com sucesso! Faça login para continuar.'
                    };
                }

                if (result.success) {
                    showAlert(result.message, 'success');

                    setTimeout(() => {
                        registerForm.style.display = 'none';
                        loginForm.style.display = 'block';
                        showLoginLink.style.display = 'none';
                        registerForm.reset();
                    }, 1500);
                } else {
                    showAlert(result.message, 'danger');
                }
            });
        }

        // Função para mostrar alertas
        function showAlert(message, type) {
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

            document.querySelector('.login-container').prepend(alertDiv);

            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, 5000);
        }

        // Debug inicial
        console.log('🔧 Debug inicial:');
        console.log('- localStorage user:', localStorage.getItem('user'));
        console.log('- localStorage token:', localStorage.getItem('token'));
        console.log('- window.auth:', window.auth);
    });