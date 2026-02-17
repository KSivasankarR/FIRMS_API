pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        APP_NAME = 'FIRMS_API'
        PORT = '3004'
        APP_DIR = "${WORKSPACE}"
        PM2_HOME = '/var/lib/jenkins/.pm2'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from Git'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies'
                sh 'npm install'
            }
        }

        stage('Build TypeScript') {
            steps {
                echo 'Compiling TypeScript to JavaScript'
                sh 'npm run build'
            }
        }

        stage('Start / Restart PM2') {
            steps {
                echo 'Restarting the application using PM2'
                sh '''
                pm2 delete $APP_NAME || true
                pm2 start dist/server.js --name $APP_NAME -- -p $PORT
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
            echo 'Build failed! Please check the logs.'
        }
    }
}
