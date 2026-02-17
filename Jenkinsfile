pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        APP_NAME = 'FIRMS_API'
        PORT = '3004'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Start / Restart App') {
            steps {
                sh '''
                # Stop existing PM2 process if running
                pm2 delete $APP_NAME || true

                # Start the app using ts-node
                pm2 start npm --name "$APP_NAME" -- start

                # Save PM2 process list
                pm2 save
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
