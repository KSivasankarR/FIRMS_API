pipeline {
    agent any

    environment {
        PM2_HOME = "${HOME}/.pm2"
        NVM_DIR = "${HOME}/.nvm"
        NODE_VERSION = "20"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Set Node Version') {
            steps {
                sh '''
                # Load NVM
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

                # Install Node 20 if missing
                nvm install $NODE_VERSION
                nvm use $NODE_VERSION

                echo "Using Node $(node -v)"
                echo "Using NPM $(npm -v)"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use $NODE_VERSION

                if [ -d "node_modules" ]; then
                    echo "✅ node_modules exists. Skipping install."
                else
                    npm install
                fi
                '''
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sh '''
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use $NODE_VERSION

                # Stop old instance safely
                pm2 delete FIRMS_API || true

                # Start backend
                pm2 start npm --name FIRMS_API -- start
                pm2 save
                pm2 status
                '''
            }
        }
    }

    post {
        always {
            echo "✅ Backend started successfully via PM2 with Node $NODE_VERSION"
        }
    }
}
``
