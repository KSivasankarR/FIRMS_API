pipeline {
    agent any

    environment {
        PORT = '3004'
        HOST = '0.0.0.0'
        APP_NAME = 'FIRMS_API'
        APP_DIR = '/var/lib/jenkins/FIRMS_API'
        PM2_HOME = '/var/lib/jenkins/.pm2'
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Verify Node Version') {
            steps {
                sh """
                    echo "Using Node version:"
                    node -v
                    which node
                """
            }
        }

        stage('Install Dependencies') {
            steps {
                sh """
                    cd ${APP_DIR}
                    rm -rf node_modules
                    npm ci
                """
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sh """
                    export PM2_HOME=${PM2_HOME}
                    pm2 delete ${APP_NAME} || true
                    pm2 start npm --name ${APP_NAME} -- start --cwd ${APP_DIR}
                    pm2 save
                    pm2 status
                """
            }
        }
    }

    post {
        success {
            echo "✅ Backend started successfully via PM2"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
