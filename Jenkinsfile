pipeline {
    agent any

    tools {
        nodejs "Node16"
    }

    environment {
        // Use a directory Jenkins can write to
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
                // Install dependencies
                sh 'npm install --legacy-peer-deps'
            }
        }

        stage('Deploy with PM2') {
            steps {
                sh '''
                    # make sure Jenkins can write
                    mkdir -p "$DEPLOY_PATH"
                    cp -r . "$DEPLOY_PATH/"
                    cd "$DEPLOY_PATH"

                    # Install production packages
                    npm install --production --legacy-peer-deps

                    # Stop any existing PM2 process
                    pm2 delete "$APP_NAME" || true

                    # Start with PM2 cluster mode
                    PORT=$PORT pm2 start npm --name "$APP_NAME" -i max -- start

                    # Save list so PM2 auto‑reloads on reboot
                    pm2 save
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful'
        }
        failure {
            echo '❌ Deployment failed'
        }
    }
}
