package com.ptl.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entree de l'application PTL.
 *
 * Ce module sert uniquement la page Discovery statique
 * (src/main/resources/static/index.html, style.css, script.js).
 * Une fois l'application demarree, la page est accessible sur :
 *   http://localhost:8080/
 *
 * Les futurs modules produit (suivi de flotte, expeditions, tournees,
 * documents) pourront etre ajoutes ici comme des @RestController /
 * @Service Spring, sans toucher a la page Discovery elle-meme.
 */
@SpringBootApplication
public class PtlApplication {

    public static void main(String[] args) {
        SpringApplication.run(PtlApplication.class, args);
    }
}
