// Verificar autenticação
    document.addEventListener('DOMContentLoaded', function() {
        if (!auth.isAuthenticated()) {
            auth.showAlert('Você precisa estar logado para acessar esta página', 'warning');
            window.location.href = 'login.html';
            return;
        }

        // Carregar dados do usuário
        carregarDadosUsuario();

        // Configurar formulários
        document.getElementById('personalForm').addEventListener('submit', salvarDadosPessoais);
        document.getElementById('addressForm').addEventListener('submit', salvarEndereco);
        document.getElementById('passwordForm').addEventListener('submit', alterarSenha);

        // Configurar máscaras
        configurarMascaras();

        // Verificar hash da URL para abrir aba específica
        verificarHashURL();
    });

    // Carregar dados do usuário
    function carregarDadosUsuario() {
        const user = auth.getCurrentUser();
        if (!user) {
            auth.showAlert('Erro ao carregar dados do usuário', 'danger');
            return;
        }

        // Preencher dados pessoais
        document.getElementById('nome').value = user.nome || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('telefone').value = user.telefone || '';
        document.getElementById('perfil').value = user.perfil || 'USER';

        // Preencher endereço
        document.getElementById('rua').value = user.rua || '';
        document.getElementById('numero').value = user.numero || '';
        document.getElementById('bairro').value = user.bairro || '';
        document.getElementById('cidade').value = user.cidade || '';
        document.getElementById('cep').value = user.cep || '';

        // Atualizar avatar
        document.getElementById('profileAvatar').textContent = user.nome.charAt(0).toUpperCase();
    }

    // Salvar dados pessoais
    async function salvarDadosPessoais(event) {
        event.preventDefault();

        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value
        };

        try {
            const token = auth.getAuthToken();
            const response = await fetch(`${API_BASE_URL}/auth/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem('user', JSON.stringify(updatedUser));
                auth.showAlert('Dados pessoais atualizados com sucesso!', 'success');

                // Atualizar interface
                document.getElementById('profileAvatar').textContent = updatedUser.nome.charAt(0).toUpperCase();

            } else {
                const error = await response.json();
                auth.showAlert(error.message || 'Erro ao atualizar dados', 'danger');
            }
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            auth.showAlert('Erro de conexão ao atualizar dados', 'danger');
        }
    }

    // Salvar endereço
    async function salvarEndereco(event) {
        event.preventDefault();

        const formData = {
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            cep: document.getElementById('cep').value
        };

        try {
            const token = auth.getAuthToken();
            const response = await fetch(`${API_BASE_URL}/auth/perfil/endereco`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem('user', JSON.stringify(updatedUser));
                auth.showAlert('Endereço atualizado com sucesso!', 'success');
            } else {
                const error = await response.json();
                auth.showAlert(error.message || 'Erro ao atualizar endereço', 'danger');
            }
        } catch (error) {
            console.error('Erro ao atualizar endereço:', error);
            auth.showAlert('Erro de conexão ao atualizar endereço', 'danger');
        }
    }

    // Alterar senha
    async function alterarSenha(event) {
        event.preventDefault();

        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        // Validações
        if (novaSenha.length < 6) {
            auth.showAlert('A nova senha deve ter pelo menos 6 caracteres', 'warning');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            auth.showAlert('As senhas não coincidem', 'warning');
            return;
        }

        const formData = {
            senhaAtual: senhaAtual,
            novaSenha: novaSenha
        };

        try {
            const token = auth.getAuthToken();
            const response = await fetch(`${API_BASE_URL}/auth/perfil/senha`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                auth.showAlert('Senha alterada com sucesso!', 'success');

                // Limpar formulário
                document.getElementById('passwordForm').reset();
                document.getElementById('passwordStrength').className = 'password-strength';
                document.getElementById('passwordFeedback').textContent = '';

            } else {
                const error = await response.json();
                auth.showAlert(error.message || 'Erro ao alterar senha', 'danger');
            }
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            auth.showAlert('Erro de conexão ao alterar senha', 'danger');
        }
    }

    // Verificar força da senha
    function verificarForcaSenha(senha) {
        const strengthBar = document.getElementById('passwordStrength');
        const feedback = document.getElementById('passwordFeedback');

        let strength = 0;
        let feedbackText = '';

        if (senha.length >= 6) strength += 25;
        if (senha.match(/[a-z]/) && senha.match(/[A-Z]/)) strength += 25;
        if (senha.match(/\d/)) strength += 25;
        if (senha.match(/[^a-zA-Z\d]/)) strength += 25;

        if (strength <= 25) {
            strengthBar.className = 'password-strength strength-weak';
            feedbackText = 'Senha fraca';
        } else if (strength <= 50) {
            strengthBar.className = 'password-strength strength-medium';
            feedbackText = 'Senha média';
        } else if (strength <= 75) {
            strengthBar.className = 'password-strength strength-strong';
            feedbackText = 'Senha forte';
        } else {
            strengthBar.className = 'password-strength strength-very-strong';
            feedbackText = 'Senha muito forte';
        }

        feedback.textContent = feedbackText;
    }

    // Configurar máscaras
    function configurarMascaras() {
        // Máscara para telefone
        document.getElementById('telefone').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });

        // Máscara para CEP
        document.getElementById('cep').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });

        // Buscar endereço pelo CEP
        document.getElementById('cep').addEventListener('blur', function(e) {
            const cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarEnderecoPorCEP(cep);
            }
        });
    }

    // Buscar endereço via API CEP
    async function buscarEnderecoPorCEP(cep) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                document.getElementById('rua').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    }

    // Verificar hash da URL para abrir aba específica
    function verificarHashURL() {
        const hash = window.location.hash;
        if (hash) {
            const tab = hash.substring(1); // Remove o #
            const tabElement = document.querySelector(`[data-bs-target="#${tab}"]`);
            if (tabElement) {
                const tab = new bootstrap.Tab(tabElement);
                tab.show();
            }
        }
    }

    // Cancelar edição
    function cancelarEdicao() {
        if (confirm('Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas.')) {
            window.location.href = 'perfil.html';
        }
    }

    // Mostrar alerta
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.querySelector('.container').prepend(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }