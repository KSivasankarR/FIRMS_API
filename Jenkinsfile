pipeline {
    agent any
    tools {
        nodejs 'Node18'  // Make sure Node18 is installed on Jenkins
    } 
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

        stage('Check Node & NPM Version') {
            steps {
                sh """
                    echo "📌 Node and NPM versions:"
                    node -v
                    npm -v
                """
            }
        }

        stage('Install Dependencies') {
            steps {
                sh """
                    cd ${APP_DIR}
                    echo "📦 Installing dependencies with npm ci..."
                    npm ci
                """
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sh """
                    export PM2_HOME=${PM2_HOME}

                    # Stop old process if exists
                    pm2 delete ${APP_NAME} || true

                    # Start backend directly with ts-node
                    pm2 start "npx ts-node ./server.ts" \
                        --name ${APP_NAME} \
                        --cwd ${APP_DIR}

                    # Save PM2 process list
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
            echo "❌ Pipeline failed! Check PM2 logs for details."
        }
    }
}
