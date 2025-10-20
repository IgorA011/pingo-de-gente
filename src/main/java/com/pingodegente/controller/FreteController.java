package com.pingodegente.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/frete")
public class FreteController {

    @PostMapping("/calcular")
    public ResponseEntity<?> calcularFrete(@RequestBody FreteRequest freteRequest) {
        System.out.println("🚚 Calculando frete para CEP: " + freteRequest.getCep());

        try {
            double valorFrete = calcularFreteSimulado(freteRequest.getCep(), freteRequest.getItens());

            Map<String, Object> response = new HashMap<>();
            response.put("valor", valorFrete);
            response.put("prazo", 5);
            response.put("transportadora", "Correios");

            System.out.println("Frete calculado: R$ " + valorFrete);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Erro ao calcular frete: " + e.getMessage());
            return ResponseEntity.badRequest().body("Erro ao calcular frete");
        }
    }

    private double calcularFreteSimulado(String cep, List<FreteItem> itens) {
        double pesoTotal = itens.stream()
                .mapToDouble(item -> item.getQuantidade() * 0.5)
                .sum();

        double valorBase = 10.0;
        double valorPeso = pesoTotal * 2.0;

        char primeiraLetraCep = cep.charAt(0);
        double acrescimoRegiao = switch (primeiraLetraCep) {
            case '0', '1', '2' -> 5.0;
            case '3', '4' -> 15.0;
            default -> 25.0;
        };

        return valorBase + valorPeso + acrescimoRegiao;
    }
}

class FreteRequest {
    private String cep;
    private List<FreteItem> itens;

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public List<FreteItem> getItens() { return itens; }
    public void setItens(List<FreteItem> itens) { this.itens = itens; }
}

class FreteItem {
    private Long produtoId;
    private Integer quantidade;

    public Long getProdutoId() { return produtoId; }
    public void setProdutoId(Long produtoId) { this.produtoId = produtoId; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
}