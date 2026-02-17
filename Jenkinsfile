pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        APP_NAME = 'FIRMS_API'
        PORT = '3004'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build TypeScript') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Start / Restart PM2') {
            steps {
                sh '''
                pm2 delete $APP_NAME || true
                pm2 start ecosystem.config.js
                pm2 save
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
