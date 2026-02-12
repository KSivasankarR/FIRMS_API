pipeline {
    agent any

    tools {
        nodejs "Node16"  // Make sure Node16 is configured in Jenkins global tools
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

        stage('Check Node & NPM Version') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                // Install production dependencies
                sh 'npm install --production'
            }
        }

        stage('Deploy & Run with PM2') {
            steps {
                echo "Deploying ${APP_NAME} to ${DEPLOY_PATH} using PM2"
                sh """
                    # Create deployment directory if it doesn't exist
                    mkdir -p ${DEPLOY_PATH}

                    # Copy project files
                    cp -r . ${DEPLOY_PATH}/

                    cd ${DEPLOY_PATH}

                    # Install production dependencies in the deployed directory
                    npm install --production

                    # Delete existing PM2 process if exists
                    pm2 delete '${APP_NAME}' || true

                    # Start the app with PM2 in cluster mode
                    PORT=${PORT} pm2 start npm --name '${APP_NAME}' -i max -- start

                    # Save PM2 process list
                    pm2 save

                    # Setup PM2 to start on system boot
                    pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
                """
            }
        }
    }

    post {
        success {
            echo "✅ Backend deployment successful!"
        }
        failure {
            echo "❌ Backend deployment failed."
        }
    }
}
