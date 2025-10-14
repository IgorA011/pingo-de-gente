package com.pingodegente.controller;

import com.pingodegente.model.Produto;
import com.pingodegente.repository.ProdutoRepository;
import com.pingodegente.service.UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoRepository produtoRepository;
    private final UploadService uploadService;

    public ProdutoController(ProdutoRepository produtoRepository, UploadService uploadService) {
        this.produtoRepository = produtoRepository;
        this.uploadService = uploadService;
    }

    @GetMapping
    public List<Produto> listar(@RequestParam(required = false) String categoria) {
        if (categoria == null) {
            return produtoRepository.findAll();
        }
        return produtoRepository.findByCategoriaContainingIgnoreCase(categoria);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> get(@PathVariable Long id) {
        Optional<Produto> p = produtoRepository.findById(id);
        return p.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> criar(@RequestBody Produto produto) {
        try {
            produto.setDataCadastro(LocalDateTime.now());
            Produto saved = produtoRepository.save(produto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao criar produto: " + e.getMessage());
        }
    }

    @PostMapping(value = "/com-imagem", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> criarComImagem(@RequestPart("produto") Produto produto,
                                            @RequestPart(value = "imagem", required = false) MultipartFile imagem) {
        try {
            if (imagem != null && !imagem.isEmpty()) {
                String path = uploadService.save(imagem);
                produto.setImagemUrl("/uploads/" + path);
            }
            produto.setDataCadastro(LocalDateTime.now());
            Produto saved = produtoRepository.save(produto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao criar produto: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Produto dto) {
        return produtoRepository.findById(id).map(p -> {
            p.setNome(dto.getNome());
            p.setDescricao(dto.getDescricao());
            p.setPreco(dto.getPreco());
            p.setCategoria(dto.getCategoria());
            p.setQuantidade(dto.getQuantidade());
            if (dto.getImagemUrl() != null) {
                p.setImagemUrl(dto.getImagemUrl());
            }
            produtoRepository.save(p);
            return ResponseEntity.ok(p);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return produtoRepository.findById(id).map(p -> {
            produtoRepository.delete(p);
            return ResponseEntity.ok(Map.of("msg", "Produto removido com sucesso"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}