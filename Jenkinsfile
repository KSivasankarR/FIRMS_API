pipeline {
    agent any

    tools {
        // Make sure Node18 is configured in Jenkins Global Tool Config
        nodejs 'Node18'
    }

    environment {
        PM2_HOME = "${HOME}/.pm2"
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
                    if (!fileExists('node_modules')) {
                        echo "📦 Installing dependencies..."
                        sh 'npm install'
                    } else {
                        echo "✅ node_modules already exists, skipping npm install"
                    }
                }
            }
        }

        stage('Start Backend with PM2') {
            steps {
                script {
                    // Stop previous process if it exists
                    sh '''
                    pm2 delete FIRMS_API || true
                    pm2 start npm --name FIRMS_API -- start --cwd $WORKSPACE
                    pm2 save
                    pm2 status
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Backend started successfully via PM2'
        }
        failure {
            echo 'Pipeline failed. Check logs above for details.'
        }
    }
}
