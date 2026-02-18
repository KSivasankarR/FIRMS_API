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

                # Install Node 20 if not already
                nvm install $NODE_VERSION

                # Use Node 20
                nvm use $NODE_VERSION

                # Verify Node and NPM versions
                node -v
                npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                nvm use $NODE_VERSION

                if [ -d "node_modules" ]; then
                    echo "✅ node_modules exists. Skipping npm install."
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

                # Stop old instance if running
                pm2 delete FIRMS_API || true

                # Start backend via PM2
                pm2 start npm --name FIRMS_API -- start

                # Save PM2 process list
                pm2 save

                # Show PM2 status
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
