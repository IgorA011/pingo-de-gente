package com.pingodegente.controller;

import com.pingodegente.model.*;
import com.pingodegente.dto.EnderecoRequest;
import com.pingodegente.dto.ItemPedidoRequest;
import com.pingodegente.dto.PedidoCreateRequest;
import com.pingodegente.model.*;
import com.pingodegente.repository.PedidoRepository;
import com.pingodegente.repository.ProdutoRepository;
import com.pingodegente.repository.UsuarioRepository;
import com.pingodegente.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/pedidos")
public class PedidoController {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;

    public PedidoController(PedidoRepository pedidoRepository, UsuarioRepository usuarioRepository, ProdutoRepository produtoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
    }

    @PostMapping
    public ResponseEntity<?> criarPedido(@RequestBody PedidoCreateRequest pedidoRequest, Authentication auth) {
        System.out.println("=== TENTATIVA DE CRIAR PEDIDO ===");
        System.out.println("Dados recebidos: " + pedidoRequest);

        if (auth == null) {
            System.out.println("ERRO: Usuário não autenticado");
            return ResponseEntity.status(401).body("Login necessário");
        }

        String email = auth.getName();
        System.out.println("👤 Usuário autenticado: " + email);

        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            System.out.println("ERRO: Usuário não encontrado no banco: " + email);
            return ResponseEntity.status(404).body("Usuário não encontrado");
        }
        Usuario user = userOpt.get();
        System.out.println("Usuário encontrado: " + user.getNome());

        // Validar dados básicos
        if (pedidoRequest.getItens() == null || pedidoRequest.getItens().isEmpty()) {
            System.out.println("ERRO: Lista de itens vazia");
            return ResponseEntity.badRequest().body("Carrinho vazio");
        }

        System.out.println("Itens recebidos: " + pedidoRequest.getItens().size());

        List<ItemPedido> itensPersist = new ArrayList<>();
        double subtotal = 0;

        // Processar cada item
        for (ItemPedidoRequest ip : pedidoRequest.getItens()) {
            Long produtoId = ip.getProduto().getId();
            System.out.println("Processando produto ID: " + produtoId);

            Optional<Produto> pOpt = produtoRepository.findById(produtoId);
            if (pOpt.isEmpty()) {
                System.out.println("ERRO: Produto não encontrado: " + produtoId);
                return ResponseEntity.badRequest().body("Produto não encontrado: " + produtoId);
            }

            Produto p = pOpt.get();
            System.out.println("Produto encontrado: " + p.getNome() + ", Estoque: " + p.getQuantidade());

            if (p.getQuantidade() < ip.getQuantidade()) {
                System.out.println("ERRO: Estoque insuficiente. Disponível: " + p.getQuantidade() + ", Solicitado: " + ip.getQuantidade());
                return ResponseEntity.badRequest().body("Estoque insuficiente para: " + p.getNome() + ". Disponível: " + p.getQuantidade() + ", Solicitado: " + ip.getQuantidade());
            }

            // Atualizar estoque
            p.setQuantidade(p.getQuantidade() - ip.getQuantidade());
            produtoRepository.save(p);
            System.out.println("Estoque atualizado: " + p.getNome() + " -> " + p.getQuantidade());

            ItemPedido item = ItemPedido.builder()
                    .produto(p)
                    .quantidade(ip.getQuantidade())
                    .valorUnitario(p.getPreco())
                    .build();
            itensPersist.add(item);
            subtotal += p.getPreco() * ip.getQuantidade();
        }

        System.out.println("Subtotal calculado: " + subtotal);
        System.out.println("Frete recebido: " + pedidoRequest.getValorFrete());
        System.out.println("Desconto recebido: " + pedidoRequest.getValorDesconto());
        System.out.println("Método pagamento: " + pedidoRequest.getMetodoPagamento());

        // Validar totais
        if (pedidoRequest.getValorTotal() == null) {
            System.out.println("ERRO: Valor total não informado");
            return ResponseEntity.badRequest().body("Valor total é obrigatório");
        }

        // Criar pedido
        Pedido pedido = Pedido.builder()
                .usuario(user)
                .dataPedido(LocalDateTime.now())
                .valorTotal(pedidoRequest.getValorTotal())
                .valorFrete(pedidoRequest.getValorFrete() != null ? pedidoRequest.getValorFrete() : 0.0)
                .valorDesconto(pedidoRequest.getValorDesconto() != null ? pedidoRequest.getValorDesconto() : 0.0)
                .metodoPagamento(pedidoRequest.getMetodoPagamento() != null ? pedidoRequest.getMetodoPagamento() : "PIX")
                .enderecoEntrega(convertToEnderecoString(pedidoRequest.getEnderecoEntrega()))
                .status(PedidoStatus.EM_PROCESSAMENTO)
                .itens(itensPersist)
                .build();

        try {
            Pedido savedPedido = pedidoRepository.save(pedido);
            System.out.println("PEDIDO CRIADO COM SUCESSO: " + savedPedido.getId());
            System.out.println("VALOR TOTAL: " + savedPedido.getValorTotal());
            System.out.println("ITENS: " + savedPedido.getItens().size());

            return ResponseEntity.ok(savedPedido);
        } catch (Exception e) {
            System.out.println("ERRO AO SALVAR PEDIDO: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro interno ao salvar pedido: " + e.getMessage());
        }
    }

    private String convertToEnderecoString(EnderecoRequest endereco) {
        if (endereco == null) {
            System.out.println("⚠️  Endereço não informado");
            return "Endereço não informado";
        }

        String enderecoStr = String.format("%s, %s - %s, %s - CEP: %s%s",
                endereco.getRua() != null ? endereco.getRua() : "",
                endereco.getNumero() != null ? endereco.getNumero() : "",
                endereco.getBairro() != null ? endereco.getBairro() : "",
                endereco.getCidade() != null ? endereco.getCidade() : "",
                endereco.getCep() != null ? endereco.getCep() : "",
                endereco.getComplemento() != null ? " - " + endereco.getComplemento() : "");

        System.out.println("Endereço formatado: " + enderecoStr);
        return enderecoStr;
    }

    @GetMapping
    public List<Pedido> listar(Authentication auth) {
        if (auth == null) return List.of();

        String email = auth.getName();
        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email);
        if (userOpt.isEmpty()) return List.of();

        Usuario user = userOpt.get();

        if (user.getPerfil() == Perfil.ADMIN) {
            return pedidoRepository.findAll();
        }
        return pedidoRepository.findByUsuario(user);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id, @RequestParam PedidoStatus status, Authentication auth) {
        return pedidoRepository.findById(id).map(p -> {
            p.setStatus(status);
            pedidoRepository.save(p);
            return ResponseEntity.ok(p);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}