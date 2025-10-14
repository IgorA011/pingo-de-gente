package com.pingodegente.controller;

import com.pingodegente.model.Pedido;
import com.pingodegente.model.Usuario;
import com.pingodegente.repository.PedidoRepository;
import com.pingodegente.repository.ProdutoRepository;
import com.pingodegente.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final PedidoRepository pedidoRepository;

    public AdminController(UsuarioRepository usuarioRepository, ProdutoRepository produtoRepository, PedidoRepository pedidoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.pedidoRepository = pedidoRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        long totalUsuarios = usuarioRepository.count();
        long totalProdutos = produtoRepository.count();
        long totalPedidos = pedidoRepository.count();
        long pedidosPendentes = pedidoRepository.findAll().stream()
                .filter(p -> p.getStatus().name().contains("PROCESSAMENTO"))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsuarios", totalUsuarios);
        stats.put("totalProdutos", totalProdutos);
        stats.put("totalPedidos", totalPedidos);
        stats.put("pedidosPendentes", pedidosPendentes);
        stats.put("estoqueBaixo", produtoRepository.findAll().stream()
                .filter(p -> p.getQuantidade() <= 5)
                .count());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/usuarios")
    public List<Usuario> listarUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setSenha(null));
        return usuarios;
    }

    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> estatisticas() {
        Map<String, Object> stats = new HashMap<>();

        Map<String, Double> vendasPorCategoria = new HashMap<>();
        produtoRepository.findAll().forEach(p -> {
            vendasPorCategoria.put(p.getCategoria(),
                    vendasPorCategoria.getOrDefault(p.getCategoria(), 0.0) + p.getPreco());
        });

        stats.put("vendasPorCategoria", vendasPorCategoria);
        stats.put("produtoMaisVendido", "Body bebê");
        stats.put("totalVendas", pedidoRepository.findAll().stream()
                .mapToDouble(Pedido::getValorTotal)
                .sum());

        return ResponseEntity.ok(stats);
    }
}