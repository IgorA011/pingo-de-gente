package com.pingodegente.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    @Column(length = 2000)
    private String descricao;
    private Double preco;
    private String categoria;
    private Integer quantidade;
    private String imagemUrl;
    private LocalDateTime dataCadastro;
}
