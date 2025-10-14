package com.pingodegente.dto;

public class ItemPedidoRequest {
    private ProdutoRequest produto;
    private Integer quantidade;

    // Construtores
    public ItemPedidoRequest() {}

    public ItemPedidoRequest(ProdutoRequest produto, Integer quantidade) {
        this.produto = produto;
        this.quantidade = quantidade;
    }

    // Getters e Setters
    public ProdutoRequest getProduto() { return produto; }
    public void setProduto(ProdutoRequest produto) { this.produto = produto; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }

    @Override
    public String toString() {
        return "ItemPedidoRequest{" +
                "produto=" + produto +
                ", quantidade=" + quantidade +
                '}';
    }
}