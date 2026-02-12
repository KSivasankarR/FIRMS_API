pipeline {
    agent any

    tools {
        nodejs "Node16"  // Node16 configured in Jenkins
    }

    environment {
        APP_NAME    = "FIRMS_API"
        DEPLOY_PATH = "/var/lib/jenkins/FIRMS_API"
        PORT        = "5000"
        NODE_ENV    = "production"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/KSivasankarR/FIRMS_API.git',
                    credentialsId: 'KSivasankarR'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh """
                    mkdir -p ${DEPLOY_PATH}
                    cp -r * ${DEPLOY_PATH}/
                    cd ${DEPLOY_PATH}
                    npm install --production --legacy-peer-deps
                """
            }
        }

        stage('Deploy & Start PM2') {
            steps {
                sh """
                    cd ${DEPLOY_PATH}
                    pm2 delete ${APP_NAME} || true
                    PORT=${PORT} pm2 start npm --name ${APP_NAME} -i max -- start

                    # Set PM2 to auto-start on reboot
                    pm2 save
                    pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
                """
            }
        }
    }

    post {
        success {
            echo "✅ Backend deployed and PM2 configured to start automatically on reboot"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}
