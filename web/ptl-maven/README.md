# PTL — Discovery (compatible Apache Maven)

Projet Maven / Spring Boot minimal qui sert la page Discovery de **PTL**
(sections Produit, Capacités, Comment ça marche, Secteurs) en contenu
statique. Le HTML/CSS/JS ne change pas de nature — c'est la même page que
la version standalone, simplement packagée pour être buildée avec
`mvn` et lancée comme une application Java.

## Hypothèse de contenu

Comme pour la version précédente, le nom **PTL** ne précisant pas le
métier exact de l'application, le contenu (modules produit, capacités,
secteurs, chiffres) reste rédigé sur l'hypothèse d'une application de
**gestion du transport / logistique**. À remplacer facilement si le
métier réel est différent — voir plus bas.

## Prérequis

- **JDK 17** (ou supérieur)
- **Apache Maven 3.9+**
- VS Code avec l'extension **Extension Pack for Java** (Microsoft) —
  installe Maven, le débogueur et le support Spring Boot d'un coup.

## Structure du projet

```
ptl-maven/
├── pom.xml                                 → build Maven (Spring Boot 3.3.4, Java 17)
├── src/
│   ├── main/
│   │   ├── java/com/ptl/app/
│   │   │   └── PtlApplication.java         → point d'entrée Spring Boot
│   │   └── resources/
│   │       ├── application.properties      → config (port, nom appli)
│   │       └── static/
│   │           ├── index.html              → page Discovery
│   │           ├── style.css               → design tokens + styles
│   │           └── script.js               → menu mobile
│   └── test/                               → (à compléter au besoin)
└── .gitignore
```

## Lancer le projet

Depuis le dossier `ptl-maven/` :

```bash
mvn spring-boot:run
```

Puis ouvrir **http://localhost:8080** dans le navigateur.

## Construire un artefact déployable

```bash
mvn clean package
java -jar target/ptl-discovery.jar
```

Le `.jar` produit est autonome (Tomcat embarqué) — aucun serveur externe
n'est nécessaire pour le déployer.

## Dans VS Code

1. Ouvrir le dossier `ptl-maven/` (`File > Open Folder…`).
2. VS Code détecte le `pom.xml` et propose d'installer l'Extension Pack
   for Java si besoin.
3. Onglet **Maven** (icône éléphant) dans la barre latérale → `Lifecycle
   > package` ou `spring-boot:run` pour lancer directement.
4. Ou en ligne de commande, dans le terminal intégré : `mvn spring-boot:run`.

Modifier `index.html` / `style.css` puis rafraîchir le navigateur suffit
en développement — pas besoin de rebuild Maven pour voir les changements
sur les fichiers statiques (Spring Boot les sert directement depuis
`src/main/resources/static` en mode dev via `mvn spring-boot:run`).

## Personnaliser

- **Couleurs / typographie** : bloc `:root { ... }` en haut de
  `style.css`.
- **Contenu des sections** : directement dans `index.html`, chaque
  section est repérée par un commentaire `<!-- ==== NOM ==== -->`.
- **Renommer l'application** : remplacer "PTL" dans `index.html`
  (titre, brand, footer) et éventuellement le `groupId`/`artifactId`
  dans `pom.xml`.
- **Ajouter de vrais modules produit** (API, back-end) : créer des
  `@RestController` dans `com.ptl.app`, sans toucher à la page
  Discovery elle-même — elle reste un simple fichier statique servi à
  la racine.
