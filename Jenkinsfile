pipeline {
    agent any

    environment {
        PATH = "${env.PATH}" // NodeJS path will be appended dynamically
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Setup NodeJS') {
            steps {
                script {
                    try {
                        // Try to use NodeJS installed as a Jenkins tool
                        def nodeHome = tool name: 'NodeJS', type: 'NodeJSInstallation'
                        env.PATH = "${nodeHome}/bin:${env.PATH}"
                        echo "✅ Using Jenkins NodeJS tool at ${nodeHome}"
                    } catch(Exception e) {
                        echo "⚠️ Jenkins NodeJS tool not found, using system NodeJS"
                        sh 'node -v'
                        sh 'npm -v'
                    }

                    // Ensure PM2 is installed
                    sh '''
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

        stage('Start Backend with PM2 (Zero-Downtime)') {
            steps {
                script {
                    dir("${env.WORKSPACE}") {
                        sh '''
                        # Reload app if running, start if not
                        pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js --update-env
                        pm2 save
                        pm2 status
                        '''
                        echo "✅ PM2 backend deployed with zero-downtime."
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
            echo "✅ Pipeline completed successfully with zero-downtime deployment!"
        }
    }
}
