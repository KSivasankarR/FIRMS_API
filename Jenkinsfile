pipeline {
    agent any
    tools {
        nodejs 'Node16'  // Make sure Node16+ is installed on Jenkins
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

        stage('Install Dependencies (if needed)') {
            steps {
                script {
                    if (!fileExists("${APP_DIR}/node_modules")) {
                        echo "📦 node_modules not found. Installing dependencies..."
                        sh """
                            cd ${APP_DIR}
                            npm install
                        """
                    } else {
                        echo "✅ node_modules already exists. Skipping npm install."
                    }
                }
            }
        }

        stage('Patch colorspace') {
            steps {
                sh '''
                    FILE="${APP_DIR}/node_modules/@so-ric/colorspace/dist/index.cjs.js"
                    if grep -q "Object.hasOwn(" "$FILE"; then
                        echo "🔧 Patching Object.hasOwn in colorspace..."
                        sed -i "s/Object.hasOwn(/Object.prototype.hasOwnProperty.call(/g" "$FILE"
                    fi
                '''
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sh """
                    export PM2_HOME=${PM2_HOME} 
                    pm2 delete ${APP_NAME} || true
                    pm2 start "npm start" \
                        --name ${APP_NAME} \
                        --cwd ${APP_DIR}
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
