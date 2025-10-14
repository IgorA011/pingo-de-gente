package com.pingodegente.controller;

import com.pingodegente.dto.EnderecoUpdateRequest;
import com.pingodegente.dto.SenhaUpdateRequest;
import com.pingodegente.dto.UsuarioUpdateRequest;
import com.pingodegente.model.Perfil;
import com.pingodegente.model.Usuario;
import com.pingodegente.repository.UsuarioRepository;
import com.pingodegente.security.JwtUtil;
import com.pingodegente.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/debug/users")
    public ResponseEntity<?> debugUsers() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setSenha(null));
        return ResponseEntity.ok(usuarios);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody Usuario u) {
        System.out.println("=== REGISTRO ===");
        System.out.println("Email: " + u.getEmail());
        System.out.println("Senha: " + u.getSenha());

        if (usuarioRepository.findByEmail(u.getEmail()).isPresent()) {
            System.out.println("Email já cadastrado: " + u.getEmail());
            return ResponseEntity.badRequest().body(Map.of("msg", "Email já cadastrado"));
        }

        u.setSenha(passwordEncoder.encode(u.getSenha()));
        if (u.getPerfil() == null) u.setPerfil(Perfil.USER);
        u.setDataCriacao(LocalDateTime.now());
        u.setAtivo(true);

        Usuario saved = usuarioRepository.save(u);
        System.out.println("Usuário registrado: " + saved.getEmail());
        System.out.println("Senha codificada: " + saved.getSenha());

        return ResponseEntity.ok(Map.of("msg", "Cadastro realizado"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String senha = body.get("senha");

        System.out.println("=== LOGIN ===");
        System.out.println("Tentando login para: " + email);
        System.out.println("Senha fornecida: " + senha);

        return usuarioRepository.findByEmail(email).map(u -> {
            System.out.println("Usuário encontrado no BD: " + u.getEmail());
            System.out.println("Senha armazenada (hash): " + u.getSenha());
            System.out.println("Perfil: " + u.getPerfil());

            boolean senhaCorreta = passwordEncoder.matches(senha, u.getSenha());
            System.out.println("Senha confere? " + senhaCorreta);

            if (senhaCorreta) {
                String token = jwtUtil.generateToken(u.getEmail());
                System.out.println("Login bem-sucedido! Token gerado.");

                Map<String, Object> usuarioMap = new HashMap<>();
                usuarioMap.put("id", u.getId());
                usuarioMap.put("nome", u.getNome());
                usuarioMap.put("email", u.getEmail());
                usuarioMap.put("perfil", u.getPerfil());
                usuarioMap.put("telefone", u.getTelefone());
                usuarioMap.put("rua", u.getRua());
                usuarioMap.put("numero", u.getNumero());
                usuarioMap.put("bairro", u.getBairro());
                usuarioMap.put("cidade", u.getCidade());
                usuarioMap.put("cep", u.getCep());
                usuarioMap.put("dataCriacao", u.getDataCriacao());
                usuarioMap.put("dataAtualizacao", u.getDataAtualizacao());
                usuarioMap.put("ativo", u.getAtivo());

                return ResponseEntity.ok(Map.of(
                        "token", token,
                        "usuario", usuarioMap
                ));
            } else {
                System.out.println("Senha incorreta!");
                return ResponseEntity.status(401).body(Map.of("msg", "Credenciais inválidas"));
            }
        }).orElseGet(() -> {
            System.out.println("Usuário não encontrado: " + email);
            return ResponseEntity.status(401).body(Map.of("msg", "Credenciais inválidas"));
        });
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("msg", "Usuário não autenticado"));
        }

        String email = userDetails.getUsername();
        System.out.println("=== GET /auth/me ===");
        System.out.println("Email autenticado: " + email);

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            usuario.setSenha(null);
            System.out.println("Retornando dados do usuário: " + usuario.getEmail());
            return ResponseEntity.ok(usuario);
        } else {
            System.out.println("Usuário não encontrado: " + email);
            return ResponseEntity.status(404).body(Map.of("msg", "Usuário não encontrado"));
        }
    }

    @PutMapping("/perfil")
    public ResponseEntity<?> atualizarPerfil(
            @RequestBody UsuarioUpdateRequest updateRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        System.out.println("=== ATUALIZAR PERFIL ===");
        System.out.println("Usuário: " + userDetails.getUsername());
        System.out.println("Dados recebidos: " + updateRequest);

        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(userDetails.getUsername());
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("msg", "Usuário não encontrado"));
            }

            Usuario usuario = usuarioOpt.get();

            if (!usuario.getEmail().equals(updateRequest.getEmail())) {
                if (usuarioRepository.findByEmail(updateRequest.getEmail()).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("msg", "Email já está em uso"));
                }
            }

            usuario.setNome(updateRequest.getNome());
            usuario.setEmail(updateRequest.getEmail());
            usuario.setTelefone(updateRequest.getTelefone());
            usuario.setDataAtualizacao(LocalDateTime.now());

            Usuario usuarioAtualizado = usuarioRepository.save(usuario);
            usuarioAtualizado.setSenha(null);

            System.out.println("Perfil atualizado com sucesso");
            return ResponseEntity.ok(usuarioAtualizado);

        } catch (Exception e) {
            System.out.println("Erro ao atualizar perfil: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("msg", "Erro ao atualizar perfil: " + e.getMessage()));
        }
    }

    @PutMapping("/perfil/endereco")
    public ResponseEntity<?> atualizarEndereco(
            @RequestBody EnderecoUpdateRequest enderecoRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        System.out.println("=== ATUALIZAR ENDEREÇO ===");
        System.out.println("Usuário: " + userDetails.getUsername());
        System.out.println("Endereço recebido: " + enderecoRequest);

        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(userDetails.getUsername());
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("msg", "Usuário não encontrado"));
            }

            Usuario usuario = usuarioOpt.get();

            usuario.setRua(enderecoRequest.getRua());
            usuario.setNumero(enderecoRequest.getNumero());
            usuario.setBairro(enderecoRequest.getBairro());
            usuario.setCidade(enderecoRequest.getCidade());
            usuario.setCep(enderecoRequest.getCep());
            usuario.setDataAtualizacao(LocalDateTime.now());

            Usuario usuarioAtualizado = usuarioRepository.save(usuario);
            usuarioAtualizado.setSenha(null);

            System.out.println("Endereço atualizado com sucesso");
            return ResponseEntity.ok(usuarioAtualizado);

        } catch (Exception e) {
            System.out.println("Erro ao atualizar endereço: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("msg", "Erro ao atualizar endereço: " + e.getMessage()));
        }
    }

    @PutMapping("/perfil/senha")
    public ResponseEntity<?> alterarSenha(
            @RequestBody SenhaUpdateRequest senhaRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        System.out.println("=== ALTERAR SENHA ===");
        System.out.println("Usuário: " + userDetails.getUsername());

        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(userDetails.getUsername());
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("msg", "Usuário não encontrado"));
            }

            Usuario usuario = usuarioOpt.get();

            if (!passwordEncoder.matches(senhaRequest.getSenhaAtual(), usuario.getSenha())) {
                return ResponseEntity.badRequest().body(Map.of("msg", "Senha atual incorreta"));
            }

            usuario.setSenha(passwordEncoder.encode(senhaRequest.getNovaSenha()));
            usuario.setDataAtualizacao(LocalDateTime.now());

            usuarioRepository.save(usuario);

            System.out.println("Senha alterada com sucesso");
            return ResponseEntity.ok(Map.of("msg", "Senha alterada com sucesso"));

        } catch (Exception e) {
            System.out.println("Erro ao alterar senha: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("msg", "Erro ao alterar senha: " + e.getMessage()));
        }
    }

    @GetMapping("/debug/jwt")
    public ResponseEntity<?> debugJwt() {
        try {
            String token = jwtUtil.generateToken("test@test.com");
            String subject = jwtUtil.extractSubject(token);
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "subject", subject,
                    "status", "JWT funcionando"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "status", "JWT com erro"
            ));
        }
    }
}