pipeline {
    agent any

    environment {
        APP_NAME = "FIRMS_API"
        APP_DIR = "${WORKSPACE}"
        NVM_DIR = "${HOME}/.nvm"
    }

    stages {

        stage('Install NVM & Node 18') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                if [ ! -d "$NVM_DIR" ]; then
                  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                fi

                . "$NVM_DIR/nvm.sh"
                nvm install 18
                nvm use 18
                node -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use 18

                rm -rf node_modules package-lock.json
                npm install
                '''
            }
        }

        stage('Restart PM2') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use 18

                pm2 delete FIRMS_API || true
                pm2 start server.ts --name FIRMS_API --interpreter ./node_modules/.bin/ts-node
                pm2 save
                '''
            }
        }
    }
}
