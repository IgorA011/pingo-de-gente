package com.pingodegente.repository;

import com.pingodegente.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    List<Produto> findByCategoriaContainingIgnoreCase(String categoria);
}
