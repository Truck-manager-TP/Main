// TP-Truck CI/CD pipeline: Jenkins runs alongside the existing GitHub Actions
// workflow (.github/workflows/ci.yml) as a containerized orchestrator that
// also opens a ServiceNow Change before deploying to DEV.
//
// Prereqs (see docs/CI_JENKINS_SERVICENOW.md for the full manual setup):
//   - Jenkins plugins: Maven Integration, Docker Pipeline, SonarQube Scanner,
//     ServiceNow DevOps
//   - Manage Jenkins > Tools: JDK installation named 'jdk17', Maven
//     installation named 'maven3'
//   - Manage Jenkins > System: SonarQube server named 'SonarQube'
//     (http://sonarqube:9000) + a ServiceNow DevOps tool integration
//   - SonarQube webhook -> http://jenkins:8080/sonarqube-webhook/ so
//     waitForQualityGate can receive the callback
pipeline {
    agent any

    tools {
        jdk 'jdk17'
        maven 'maven3'
    }

    environment {
        IMAGE = 'tptruck/truck-fleet'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test (Maven)') {
            steps {
                dir('app') {
                    sh 'mvn -B clean verify'
                }
            }
            post {
                always {
                    junit testResults: 'app/target/surefire-reports/*.xml', allowEmptyResults: true
                }
            }
        }

        stage('SonarQube') {
            steps {
                dir('app') {
                    withSonarQubeEnv('SonarQube') {
                        sh 'mvn -B sonar:sonar -Dsonar.host.url=http://sonarqube:9000 -Dsonar.token=$SONAR_AUTH_TOKEN'
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Blocks here until SonarQube calls back the webhook above.
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                // Tag with 1.0.0 too so it matches docker-compose.yml's
                // "image: tptruck/truck-fleet:${APP_VERSION:-1.0.0}" and gets
                // picked up as-is (no rebuild) by the Deploy DEV stage below.
                sh "docker build -t ${IMAGE}:${BUILD_NUMBER} -t ${IMAGE}:1.0.0 ./app"
            }
        }

        stage('ServiceNow Change') {
            when { branch 'main' }
            steps {
                snDevOpsChange(
                    applicationName: 'TP-Truck',
                    changeRequestDetails: """{
                        "short_description": "Promote TP-Truck Fleet build #${env.BUILD_NUMBER} to DEV",
                        "description": "Automated change opened by Jenkins pipeline ${env.BUILD_URL}",
                        "cmdb_ci": "tp-truck-fleet",
                        "justification": "Passed Maven build/tests and the SonarQube quality gate."
                    }"""
                )

                /*
                 * Fallback if the "ServiceNow DevOps" plugin is not
                 * installed: open the Change Request directly via the Table
                 * API, reusing the same payload shape as
                 * itsm/servicenow/change-request.json. Requires a Jenkins
                 * 'usernamePassword' credential (id: servicenow-creds) and a
                 * SN_INSTANCE_URL value (e.g. env var or a second credential).
                 *
                 * withCredentials([usernamePassword(credentialsId: 'servicenow-creds',
                 *                                    usernameVariable: 'SN_USER',
                 *                                    passwordVariable: 'SN_PASS')]) {
                 *     sh '''
                 *         curl -fsS -X POST "$SN_INSTANCE_URL/api/now/table/change_request" \\
                 *              -u "$SN_USER:$SN_PASS" \\
                 *              -H "Content-Type: application/json" \\
                 *              -d @itsm/servicenow/change-request.json
                 *     '''
                 * }
                 */
            }
        }

        stage('Deploy DEV') {
            when { branch 'main' }
            steps {
                sh 'docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d'
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded: ${env.BUILD_URL}"
        }
        failure {
            echo "Pipeline failed: ${env.BUILD_URL}"
        }
    }
}
