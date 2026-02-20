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

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Node Version') {
            steps {
                sh 'node -v && npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    cd ${APP_DIR}
                    rm -rf node_modules
                    npm ci
                '''
            }
        }

        stage('Ensure Required Modules') {
            steps {
                sh '''
                    cd ${APP_DIR}

                    # Ensure pg module exists
                    if ! npm list pg >/dev/null 2>&1; then
                        echo "Installing missing pg module..."
                        npm install pg --save
                    fi

                    # Ensure TypeScript types for pg exist
                    if ! npm list @types/pg >/dev/null 2>&1; then
                        echo "Installing missing @types/pg..."
                        npm install @types/pg --save-dev
                    fi
                '''
            }
        }

        stage('Deploy with PM2') {
            steps {
                sh '''
                    export PM2_HOME=${PM2_HOME}
                    cd ${APP_DIR}

                    echo "Deleting old PM2 process (if exists)…"
                    pm2 delete ${APP_NAME} || true

                    echo "Starting app with ts-node..."
                    pm2 start "npx ts-node server.ts" --name ${APP_NAME} --update-env

                    pm2 save
                    pm2 status
                '''
            }
        }

    }

    post {
        success {
            echo "✅ FIRMS_API deployed successfully"
        }
        failure {
            echo "❌ Deployment failed — check logs above!"
        }
    }
}
