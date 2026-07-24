#!/usr/bin/env bash
# Bump Kustomize image tag and commit (GitOps promotion).
set -euo pipefail

ENV="${1:?env required (dev|uat|prod)}"
TAG="${2:?image tag required}"

OVERLAY="k8s/overlays/${ENV}"
cd "${OVERLAY}"

kustomize edit set image "ghcr.io/truck-manager-tp/truck-fleet=${TAG}"

git config user.email "jenkins@tptruck.local"
git config user.name "TP-Truck Jenkins"
git add kustomization.yaml
git commit -m "chore(cd): promote ${TAG} to ${ENV}" || echo "No overlay change needed"
git push origin HEAD
