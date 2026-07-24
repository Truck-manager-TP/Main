# Jenkins + Docker CLI (le paquet docker-compose-plugin n'existe pas sur Debian jenkins:lts,
# on installe seulement docker.io qui fournit le CLI docker pour builder via le socket monte)
FROM jenkins/jenkins:lts
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends docker.io \
 && rm -rf /var/lib/apt/lists/*
USER jenkins
