package com.pingodegente.controller;

import com.pingodegente.model.Produto;
import com.pingodegente.repository.ProdutoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/estoque")
public class EstoqueController {

    private final ProdutoRepository produtoRepository;

    public EstoqueController(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @GetMapping("/baixo")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTOQUISTA')")
    public List<Produto> baixoEstoque(@RequestParam(defaultValue = "5") Integer limite) {
        List<Produto> todos = produtoRepository.findAll();
        return todos.stream()
                .filter(p -> p.getQuantidade() <= limite)
                .toList();
    }

    @PutMapping("/atualizar/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTOQUISTA')")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestParam Integer quantidade) {
        return produtoRepository.findById(id).map(p -> {
            p.setQuantidade(quantidade);
            produtoRepository.save(p);
            return ResponseEntity.ok(p);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ESTOQUISTA')")
    public List<Produto> listarEstoque() {
        return produtoRepository.findAll();
    }
}