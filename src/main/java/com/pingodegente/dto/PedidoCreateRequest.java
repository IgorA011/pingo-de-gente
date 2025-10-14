package com.pingodegente.dto;

import java.util.List;

public class PedidoCreateRequest {
    private List<ItemPedidoRequest> itens;
    private EnderecoRequest enderecoEntrega;
    private String metodoPagamento;
    private Double valorFrete;
    private Double valorDesconto;
    private Double valorTotal;

    // Construtores
    public PedidoCreateRequest() {}

    public PedidoCreateRequest(List<ItemPedidoRequest> itens, EnderecoRequest enderecoEntrega,
                               String metodoPagamento, Double valorFrete, Double valorDesconto, Double valorTotal) {
        this.itens = itens;
        this.enderecoEntrega = enderecoEntrega;
        this.metodoPagamento = metodoPagamento;
        this.valorFrete = valorFrete;
        this.valorDesconto = valorDesconto;
        this.valorTotal = valorTotal;
    }

    // Getters e Setters
    public List<ItemPedidoRequest> getItens() { return itens; }
    public void setItens(List<ItemPedidoRequest> itens) { this.itens = itens; }

    public EnderecoRequest getEnderecoEntrega() { return enderecoEntrega; }
    public void setEnderecoEntrega(EnderecoRequest enderecoEntrega) { this.enderecoEntrega = enderecoEntrega; }

    public String getMetodoPagamento() { return metodoPagamento; }
    public void setMetodoPagamento(String metodoPagamento) { this.metodoPagamento = metodoPagamento; }

    public Double getValorFrete() { return valorFrete; }
    public void setValorFrete(Double valorFrete) { this.valorFrete = valorFrete; }

    public Double getValorDesconto() { return valorDesconto; }
    public void setValorDesconto(Double valorDesconto) { this.valorDesconto = valorDesconto; }

    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }

    @Override
    public String toString() {
        return "PedidoCreateRequest{" +
                "itens=" + itens +
                ", enderecoEntrega=" + enderecoEntrega +
                ", metodoPagamento='" + metodoPagamento + '\'' +
                ", valorFrete=" + valorFrete +
                ", valorDesconto=" + valorDesconto +
                ", valorTotal=" + valorTotal +
                '}';
    }
}