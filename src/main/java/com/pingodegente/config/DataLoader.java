package com.pingodegente.config;

import com.pingodegente.model.Perfil;
import com.pingodegente.model.Produto;
import com.pingodegente.model.Usuario;
import com.pingodegente.repository.ProdutoRepository;
import com.pingodegente.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UsuarioRepository usuarioRepository, ProdutoRepository produtoRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("");

        // TESTE DO PASSWORD ENCODER
        String testeSenha = "admin123";
        String hash = passwordEncoder.encode(testeSenha);
        System.out.println("🔐 TESTE PASSWORD ENCODER:");
        System.out.println("Senha: " + testeSenha);
        System.out.println("Hash: " + hash);
        System.out.println("Matches: " + passwordEncoder.matches(testeSenha, hash));

        // Limpa e recria
        usuarioRepository.deleteAll();
        produtoRepository.deleteAll();

        // Admin
        Usuario admin = Usuario.builder()
                .nome("Admin")
                .email("admin@pingodegente.com")
                .senha(passwordEncoder.encode("admin123"))
                .perfil(Perfil.ADMIN)
                .rua("Rua A")
                .numero("001")
                .bairro("Centro")
                .cidade("São Paulo")
                .cep("04913-080")
                .build();
        usuarioRepository.save(admin);
        System.out.println("Admin criado: admin@pingodegente.com / admin123");
        System.out.println("Hash do admin: " + admin.getSenha());

        // Estoquista
        Usuario estoquista = Usuario.builder()
                .nome("Estoquista")
                .email("estoquista@pingodegente.com")
                .senha(passwordEncoder.encode("estoquista123"))
                .perfil(Perfil.ESTOQUISTA)
                .rua("Rua A")
                .numero("2")
                .bairro("Bairro")
                .cidade("São Paulo")
                .cep("04913-080")
                .build();
        usuarioRepository.save(estoquista);
        System.out.println("Estoquista criado: estoquista@pingodegente.com / estoquista123");

        criarProdutos();

        System.out.println("");
    }

    private void criarProdutos() {

        List<Produto> produtos = Arrays.asList(
                // ROUPAS
                Produto.builder()
                        .nome("Jaqueta Jeans Infantil")
                        .descricao("Jaqueta Jeans, macio e confortável.")
                        .preco(29.90)
                        .categoria("Roupas")
                        .quantidade(50)
                        .imagemUrl("/img/Jaqueta-Jeans-Infantil.jpg")
                        .dataCadastro(LocalDateTime.now())
                        .build(),

                Produto.builder()
                        .nome("Vestido Infantil Florido")
                        .descricao("Vestido leve e delicado com estampa floral, perfeito para festas.")
                        .preco(89.90)
                        .categoria("Roupas")
                        .quantidade(25)
                        .imagemUrl("/img/Vestido-Infantil-Florido.jpg")
                        .dataCadastro(LocalDateTime.now())
                        .build(),

                // ACESSÓRIOS
                Produto.builder()
                        .nome("Tênis Infantil LED")
                        .descricao("Tênis com luzes LED que piscam, super divertido para as crianças.")
                        .preco(129.90)
                        .categoria("Acessórios")
                        .quantidade(15)
                        .imagemUrl("/img/tenis-infaltil.jpg")
                        .dataCadastro(LocalDateTime.now())
                        .build(),

                Produto.builder()
                        .nome("Mochila Infantil Personagem")
                        .descricao("Mochila escolar com personagens famosos, espaçosa e durável.")
                        .preco(79.90)
                        .categoria("Acessórios")
                        .quantidade(22)
                        .imagemUrl("/img/mochila.jpg")
                        .dataCadastro(LocalDateTime.now())
                        .build(),

                // BRINQUEDOS
                Produto.builder()
                        .nome("Boneca Bebê Chorão")
                        .descricao("Boneca bebê que chora e faz sons, vem com mamadeira e fralda.")
                        .preco(89.90)
                        .categoria("Brinquedos")
                        .quantidade(12)
                        .imagemUrl("/img/bebe---chorãona.jpg")
                        .dataCadastro(LocalDateTime.now())
                        .build(),

                Produto.builder()
                        .nome("Bola de Futebol Infantil - Homem Aranha")
                        .descricao("Bola de futebol oficial tamanho infantil, material resistente.")
                        .preco(49.90)
                        .categoria("Brinquedos")
                        .quantidade(18)
                        .imagemUrl("/img/bola-homem-aranha.jpg")
                        .dataCadastro(LocalDateTime.now())
                        .build()
        );

        // Salvar todos os produtos
        produtoRepository.saveAll(produtos);
    }
    }
