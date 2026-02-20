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
        stage('Checkout SCM') {
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

        stage('Restart Backend with PM2') {
            steps {
                sh '''
                    export PM2_HOME=${PM2_HOME}
                    cd ${APP_DIR}

                    if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
                        echo "Restarting existing process..."
                        pm2 restart ${APP_NAME} --update-env
                    else
                        echo "Starting app directly without npm..."
                        pm2 start ./server.ts --name ${APP_NAME} --interpreter ts-node --update-env
                    fi

                    pm2 save
                    pm2 status
                '''
            }
        }

    } // ← closes stages

    post {
        success {
            echo "✅ Backend deployed"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }

} // ← closes pipeline
