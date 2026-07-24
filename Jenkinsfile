// =============================================================================
// TP-Truck — Jenkins CD Pipeline (Continuous Delivery / Deployment)
// Triggered by GitHub Actions after CI passes on main.
// Scope: Docker build/push, ServiceNow change governance, Argo CD GitOps sync.
// =============================================================================

pipeline {
    agent any

    parameters {
        string(name: 'GIT_SHA',       defaultValue: 'main', description: 'Git commit SHA from CI')
        string(name: 'GIT_BRANCH',   defaultValue: 'main', description: 'Source branch')
        string(name: 'IMAGE_TAG',     defaultValue: '1.0.0', description: 'Docker image tag')
        string(name: 'VERSION',        defaultValue: '1.0.0', description: 'Release version')
        choice(name: 'TARGET_ENV',     choices: ['dev', 'uat', 'prod'], description: 'Promotion target')
    }

    environment {
        IMAGE_REPO     = 'ghcr.io/truck-manager-tp/truck-fleet'
        SONAR_PROJECT  = 'tptruck-fleet'
        JIRA_PROJECT   = 'KAN'
        ARGOCD_SERVER  = credentials('argocd-server-url')
        ARGOCD_TOKEN   = credentials('argocd-auth-token')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh "git checkout ${params.GIT_SHA} || git checkout ${params.GIT_BRANCH}"
            }
        }

        stage('Build & Quality (safety net)') {
            steps {
                dir('app') {
                    sh 'mvn -B clean verify'
                    withCredentials([
                        string(credentialsId: 'sonar-token',     variable: 'SONAR_TOKEN'),
                        string(credentialsId: 'sonar-host-url', variable: 'SONAR_HOST_URL')
                    ]) {
                        sh '''
                          mvn -B sonar:sonar \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.token=$SONAR_TOKEN \
                            -Dsonar.qualitygate.wait=true
                        '''
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([string(credentialsId: 'ghcr-token', variable: 'GHCR_TOKEN')]) {
                    sh '''
                      echo "$GHCR_TOKEN" | docker login ghcr.io -u $BUILD_USER_ID --password-stdin
                      docker build -t $IMAGE_REPO:$IMAGE_TAG -t $IMAGE_REPO:$VERSION ./app
                      docker push $IMAGE_REPO:$IMAGE_TAG
                      docker push $IMAGE_REPO:$VERSION
                    '''
                }
            }
        }

        stage('Deploy DEV') {
            when { expression { params.TARGET_ENV == 'dev' } }
            steps {
                sh """
                  bash jenkins/scripts/promote-overlay.sh dev ${params.IMAGE_TAG}
                  bash jenkins/scripts/argocd-sync.sh truck-fleet-dev
                """
            }
        }

        stage('Deploy UAT') {
            when { expression { params.TARGET_ENV == 'uat' } }
            steps {
                script {
                    def cr = sh(
                        script: "bash jenkins/scripts/create-servicenow-change.sh uat ${params.VERSION} ${params.IMAGE_TAG}",
                        returnStdout: true
                    ).trim()
                    echo "ServiceNow Change: ${cr}"
                }
                sh """
                  bash jenkins/scripts/promote-overlay.sh uat ${params.IMAGE_TAG}
                  bash jenkins/scripts/argocd-sync.sh truck-fleet-uat
                """
                input message: 'UAT sign-off — promote to PROD?', ok: 'Approved'
            }
        }

        stage('Deploy PROD') {
            when { expression { params.TARGET_ENV == 'prod' } }
            steps {
                script {
                    def cr = sh(
                        script: "bash jenkins/scripts/create-servicenow-change.sh prod ${params.VERSION} ${params.IMAGE_TAG}",
                        returnStdout: true
                    ).trim()
                    input message: "CAB approval required for Change ${cr}", ok: 'CAB Approved'
                }
                sh """
                  bash jenkins/scripts/promote-overlay.sh prod ${params.IMAGE_TAG}
                  bash jenkins/scripts/argocd-sync.sh truck-fleet-prod
                """
                sh 'curl -fsS http://truck-fleet.prod/actuator/health || true'
            }
        }
    }

    post {
        failure {
            sh """
              bash jenkins/scripts/create-jira-bug.sh jenkins-build ${params.GIT_BRANCH} ${params.GIT_SHA} || true
              bash jenkins/scripts/create-servicenow-incident.sh jenkins-build ${params.TARGET_ENV} || true
            """
        }
        success {
            echo "TP-Truck ${params.VERSION} promoted to ${params.TARGET_ENV}"
        }
    }
}
