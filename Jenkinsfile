pipeline {
    agent any

    tools {
        nodejs "Node16"  // Use Node16 configured in Jenkins tools
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
                // Install dependencies for the project
                sh 'npm install --legacy-peer-deps'
            }
        }

        stage('Deploy & Start PM2') {
            steps {
                sh '''
                    # Create deploy directory if not exists
                    mkdir -p $DEPLOY_PATH

                    # Copy project to deploy directory
                    cp -r . $DEPLOY_PATH/

                    cd $DEPLOY_PATH

                    # Install only production dependencies
                    npm install --production --legacy-peer-deps

                    # Stop old PM2 process if exists
                    pm2 delete "$APP_NAME" || true

                    # Start application with PM2 in cluster mode
                    PORT=$PORT pm2 start npm --name "$APP_NAME" -i max -- start

                    # Save PM2 process list to restart on reboot
                    pm2 save
                '''
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
