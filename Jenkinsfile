pipeline {
    agent any

    environment {
        NODE_VERSION = "18"
        APP_NAME = "FIRMS_API"
        APP_DIR = "/var/lib/jenkins/FIRMS_API"
    }

    stages {

        stage('Install Node 18') {
            steps {
                sh '''
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
                node -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                cd $APP_DIR
                rm -rf node_modules package-lock.json
                npm install
                '''
            }
        }

        stage('Restart PM2') {
            steps {
                sh '''
                pm2 delete $APP_NAME || true
                pm2 start $APP_DIR/server.ts --name $APP_NAME --interpreter ./node_modules/.bin/ts-node
                pm2 save
                '''
            }
        }
    }
}
