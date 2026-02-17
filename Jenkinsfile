pipeline {
    agent any

    environment {
        NODE_HOME = tool name: 'NodeJS', type: 'NodeJSInstallation' // adjust to your NodeJS tool name
        PATH = "${NODE_HOME}/bin:${env.PATH}"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Pre-Check Tools') {
            steps {
                script {
                    dir("${env.WORKSPACE}") {
                        echo "🔍 Checking NodeJS and PM2 installation..."
                        sh '''
                        node -v
                        npm -v
                        if ! command -v pm2 >/dev/null 2>&1; then
                            echo "PM2 not found, installing globally..."
                            npm install -g pm2
                        else
                            echo "PM2 is installed"
                        fi
                        '''
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    dir("${env.WORKSPACE}") {
                        if (!fileExists('node_modules')) {
                            echo "📦 node_modules not found. Installing dependencies..."
                            sh 'npm install'
                        } else {
                            echo "✅ node_modules already exists. Skipping install."
                        }
                    }
                }
            }
        }

        stage('Prepare Directories') {
            steps {
                script {
                    dir("${env.WORKSPACE}") {
                        sh 'mkdir -p logs'
                        echo "Directories prepared."
                    }
                }
            }
        }

        stage('Start Backend with PM2') {
            steps {
                script {
                    dir("${env.WORKSPACE}") {
                        sh '''
                        pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
                        pm2 save
                        pm2 status
                        '''
                        echo "PM2 backend started successfully."
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "❌ Pipeline failed! Check PM2 logs and npm logs for details."
        }
        success {
            echo "✅ Pipeline completed successfully!"
        }
    }
}
