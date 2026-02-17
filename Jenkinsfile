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
                echo 'Installing npm dependencies'
                sh 'npm install'
            }
        }

        stage('Build TypeScript') {
            steps {
                echo 'Compiling TypeScript to JavaScript'
                sh 'npm run build'
            }
        }

        stage('Start / Restart PM2') {
            steps {
                echo 'Starting / Restarting PM2'
                sh """
                pm2 delete $APP_NAME || true
                pm2 start dist/server.js --name $APP_NAME -- --port $PORT
                pm2 save
                """
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        failure {
            echo 'Build failed! Check the logs.'
        }
    }
}
