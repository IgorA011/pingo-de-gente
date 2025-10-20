package com.pingodegente.dto;

public class ProdutoRequest {
    private Long id;

    // Construtores
    public ProdutoRequest() {}

    public ProdutoRequest(Long id) {
        this.id = id;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @Override
    public String toString() {
        return "ProdutoRequest{" +
                "id=" + id +
                '}';
    }
}