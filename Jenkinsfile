pipeline {
    agent any

    tools {
        nodejs 'Node18' // Make sure Node18 is configured in Jenkins Global Tool Config
    }

    environment {
        PM2_HOME = "${HOME}/.pm2"
        NODE_ENV = 'production'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/KSivasankarR/FIRMS_API.git',
                    credentialsId: 'KSivasankarR'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh '''
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('Build / Compile') {
            steps {
                echo '🛠 Compiling TypeScript...'
                sh '''
                    npx tsc
                '''
            }
        }

        stage('Start Backend via PM2') {
            steps {
                echo '🚀 Starting FIRMS_API with PM2...'
                sh '''
                    pm2 delete FIRMS_API || true
                    pm2 start npm --name FIRMS_API -- start
                    pm2 save
                    pm2 status
                '''
            }
        }
    }

    post {
        success {
            echo '✅ FIRMS_API backend started successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check the logs.'
        }
    }
}
