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

            echo "Deleting old PM2 process (if exists)…"
            pm2 delete ${APP_NAME} || true

            echo "Starting app with npx ts-node…"
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
