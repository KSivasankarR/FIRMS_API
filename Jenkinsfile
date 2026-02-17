pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        APP_NAME = 'FIRMS_API'
        PORT = '4000'
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

        stage('Build TypeScript') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Start / Restart PM2') {
            steps {
                sh '''
                # Stop existing PM2 process if running
                pm2 delete $APP_NAME || true

                # Start the compiled JS server
                pm2 start dist/server.js --name "$APP_NAME"

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
