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

        # Install Node 20 if not present
        nvm install $NODE_VERSION

        # Use Node 20
        nvm use $NODE_VERSION

        echo "Using Node version: $(node -v)"
        echo "Using NPM version: $(npm -v)"
        '''
    }
}


        stage('Install Dependencies') {
            steps {
                sh '''
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                nvm use $NODE_VERSION

                # Reinstall node_modules for Node 20
                rm -rf node_modules package-lock.json
                npm install
                '''
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sh '''
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                nvm use $NODE_VERSION

                # Stop existing app safely
                pm2 delete FIRMS_API || true

                # Start app via PM2
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
