pipeline {
    agent any

    tools {
        nodejs "Node16"  // Node16 configured in Jenkins global tools
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

        stage('Deploy & Start via PM2') {
            steps {
                sh """
                    # Create deploy directory if needed
                    mkdir -p \$DEPLOY_PATH

                    # Sync everything except .git and node_modules
                    rsync -av --exclude='.git' --exclude='node_modules' ./ \$DEPLOY_PATH/

                    cd \$DEPLOY_PATH

                    # Install only production dependencies
                    npm install --production --legacy-peer-deps

                    # Delete old PM2 process if exists
                    pm2 delete "\$APP_NAME" || true

                    # Start app with PM2 in “single instance” mode
                    PORT=\$PORT pm2 start npm --name "\$APP_NAME" -i 1 -- start

                    # Save PM2 list for auto-restart
                    pm2 save
                """
            }
        }
    }

    post {
        success {
            echo '✅ Backend deployed and running with PM2'
        }
        failure {
            echo '❌ Deployment failed'
        }
    }
}
