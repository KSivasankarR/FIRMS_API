pipeline {
    agent any

    tools {
        nodejs "Node16"
    }

    environment {
        APP_NAME    = "FIRMS_API"
        DEPLOY_PATH = "/var/lib/jenkins/FIRMS_API"
        PORT        = "5000"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/KSivasankarR/FIRMS_API.git',
                    credentialsId: 'KSivasankarR'
            }
        }

        stage('Check Node Version') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install --legacy-peer-deps'
            }
        }

        stage('Deploy & Run with PM2 Cluster') {
            steps {
                sh """
                    echo "Deploying Backend..."

                    rm -rf ${DEPLOY_PATH}
