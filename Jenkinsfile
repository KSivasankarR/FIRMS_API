pipeline {
    agent any

    environment {
        APP_NAME = "FIRMS_API"
        NVM_DIR = "${HOME}/.nvm"
    }

    stages {

        stage('Setup Node 18') {
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

        stage('Build TypeScript') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use 18

                npx tsc
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
                pm2 start dist/server.js --name FIRMS_API
                pm2 save
                '''
            }
        }
    }
}
