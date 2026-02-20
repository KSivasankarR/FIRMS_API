pipeline {
    agent any

    environment {
        PORT = '3004'
        HOST = '0.0.0.0'
        APP_NAME = 'FIRMS_API'
        APP_DIR = '/var/lib/jenkins/FIRMS_API'
        PM2_HOME = '/var/lib/jenkins/.pm2'

        // Add your Jenkins credential IDs here
        MONGO_URL  = credentials('mongo-url')
        JWT_SECRET = credentials('jwt-secret')
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Node Version') {
            steps {
                sh '''
                    echo "Node version:"
                    node -v
                '''
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

        stage('Deploy with PM2') {
            steps {
                sh '''
                    export PM2_HOME=${PM2_HOME}
                    cd ${APP_DIR}

                    echo "Deleting old PM2 process (if exists)..."
                    pm2 delete ${APP_NAME} || true

                    echo "Starting app via npx ts-node..."
                    pm2 start npx --name ${APP_NAME} -- run ts-node server.ts --update-env

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
