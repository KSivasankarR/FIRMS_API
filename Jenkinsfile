pipeline {
    agent any

    tools {
        nodejs 'Node18' // Node 18+ installed in Jenkins tools
    }

    environment {
        PM2_HOME = "${env.HOME}/.pm2"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo "📦 Installing dependencies with Node ${tool 'Node18'}..."
                    sh '''
                        node -v
                        npm -v
                        rm -rf node_modules package-lock.json
                        npm install
                    '''
                }
            }
        }

        stage('Start Backend with PM2') {
            steps {
                script {
                    echo "🚀 Starting FIRMS_API via PM2..."
                    sh '''
                        pm2 delete FIRMS_API || true
                        pm2 start npm --name FIRMS_API -- start
                        pm2 save
                        pm2 status
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Backend started successfully via PM2"
        }
        failure {
            echo "❌ Build or start failed"
        }
    }
}
