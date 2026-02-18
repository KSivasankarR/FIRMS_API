pipeline {
    agent any

    environment {
        PM2_HOME = "${HOME}/.pm2"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                git(
                    url: 'https://github.com/KSivasankarR/FIRMS_API.git',
                    branch: 'main',
                    credentialsId: 'KSivasankarR'
                )
            }
        }

        stage('Use Node 18 with nvm') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm install 18
                nvm use 18
                node -v
                npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (!fileExists('node_modules')) {
                        echo "📦 node_modules not found. Installing dependencies..."
                        sh 'npm install'
                    } else {
                        echo "📦 node_modules already exists. Skipping install."
                    }
                }
            }
        }

        stage('Start Backend with PM2') {
            steps {
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
            echo '✅ Backend started successfully via PM2'
        }
        failure {
            echo '❌ Pipeline failed'
        }
    }
}
