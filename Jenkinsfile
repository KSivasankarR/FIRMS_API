pipeline {
    agent any

    tools {
        nodejs "Node16"
    }

    environment {
        DEPLOY_PATH = "/var/lib/jenkins/FIRMS_API"
        APP_NAME    = "FIRMS_API"
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

        stage('Install Dependencies') {
            steps {
                sh 'npm install --legacy-peer-deps'
            }
        }

        stage('Deploy with PM2 (using rsync)') {
            steps {
                sh """
                    # ensure deploy folder exists
                    mkdir -p "${DEPLOY_PATH}"

                    # sync files to deploy folder excluding .git
                    rsync -av --exclude='.git' --exclude='node_modules' ./ "${DEPLOY_PATH}/"

                    cd "${DEPLOY_PATH}"

                    # install production dependencies
                    npm install --production --legacy-peer-deps

                    # restart PM2 cluster
                    pm2 delete "${APP_NAME}" || true
                    PORT=${PORT} pm2 start npm --name "${APP_NAME}" -i max -- start

                    pm2 save
                """
            }
        }
    }

    post {
        success {
            echo '✅ Backend deployed successfully!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
