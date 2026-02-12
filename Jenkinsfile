pipeline {
    agent any

    tools {
        nodejs "Node18"   // Make sure Node18 is added in Jenkins tools
    }

    environment {
        APP_NAME   = "FIRMS_API"
        DEPLOY_PATH = "/var/lib/jenkins/FIRMS_API"
        PORT        = "5000"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/KSivasankarR/FIRMS_API.git',
                    credentialsId: 'KSivasankarR'
            }
        }

        stage('Check Node Version') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Deploy & Run with PM2 Cluster') {
            steps {
                sh """
                    echo "Deploying Backend..."

                    rm -rf ${DEPLOY_PATH}
                    mkdir -p ${DEPLOY_PATH}

                    cp -r * ${DEPLOY_PATH}/
                    cd ${DEPLOY_PATH}

                    npm install --production

                    pm2 delete ${APP_NAME} || true

                    PORT=${PORT} pm2 start npm --name ${APP_NAME} -i max -- start

                    pm2 save
                """
            }
        }
    }

    post {
        success {
            echo '✅ Backend Deployment Successful'
        }
        failure {
            echo '❌ Backend Deployment Failed'
        }
    }
}
