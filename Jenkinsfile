pipeline {
    agent any

    tools {
        nodejs 'Node16'  // Make sure Node16 is installed on Jenkins
    }

    environment {
        APP_NAME = 'FIRMS_API'
        DEPLOY_PATH = '/var/lib/jenkins/FIRMS_API'
        BACKUP_PATH = '/var/lib/jenkins/FIRMS_API_backup'
        BACKUP_KEEP = 5
        PORT = '4000'
        HOST = '10.10.120.190'
        PM2_HOME = '/var/lib/jenkins/.pm2'
        NODE_ENV = 'production'
        HUSKY_SKIP_INSTALL = "1"
        REPO_URL = 'https://github.com/KSivasankarR/FIRMS_API'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: "${REPO_URL}"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    export HUSKY_SKIP_INSTALL=1
                    node -v
                    npm -v
                    npm install --legacy-peer-deps --verbose
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    npm run build --verbose || echo "No build step defined, skipping"
                '''
            }
        }

        stage('Backup Previous Deploy') {
            steps {
                sh '''
                    mkdir -p ${BACKUP_PATH}
                    if [ -d "${DEPLOY_PATH}" ]; then
                        mv ${DEPLOY_PATH} ${BACKUP_PATH}/${APP_NAME}_backup_$(date +%F_%H-%M-%S)
                    fi
                    # Keep only last ${BACKUP_KEEP} backups
                    ls -1tr ${BACKUP_PATH} | grep ${APP_NAME}_backup_ | head -n -${BACKUP_KEEP} | xargs -r rm -rf
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    mkdir -p ${DEPLOY_PATH}
                    rm -rf ${DEPLOY_PATH}/*
                    rsync -av --exclude='.git' --exclude='node_modules' ./ ${DEPLOY_PATH}/

                    export PM2_HOME=${PM2_HOME}
                    cd ${DEPLOY_PATH}

                    # Start or reload API in PM2 cluster mode with auto-restart
                    if pm2 describe ${APP_NAME} > /dev/null; then
                        pm2 reload ${APP_NAME} --update-env
                    else
                        pm2 start npm --name "${APP_NAME}" -- run start -- -p ${PORT} -H ${HOST} -i max
                    fi

                    pm2 save
                    pm2 status
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    RETRIES=8
                    COUNT=0
                    until curl -s --head http://${HOST}:${PORT}/health | grep "200 OK"; do
                        COUNT=$((COUNT+1))
                        echo "Waiting for API to start... Attempt $COUNT"
                        sleep 5
                        if [ $COUNT -ge $RETRIES ]; then
                            echo "API failed to respond after $RETRIES attempts"
                            exit 1
                        fi
                    done
                    echo "API is running on port ${PORT}"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed! Attempting rollback..."
            sh '''
                LAST_BACKUP=$(ls -1tr ${BACKUP_PATH} | grep ${APP_NAME}_backup_ | tail -n 1)
                if [ -n "$LAST_BACKUP" ]; then
                    echo "Restoring backup $LAST_BACKUP..."
                    rm -rf ${DEPLOY_PATH}
                    mv ${BACKUP_PATH}/$LAST_BACKUP ${DEPLOY_PATH}
                    export PM2_HOME=${PM2_HOME}

                    if pm2 describe ${APP_NAME} > /dev/null; then
                        pm2 reload ${APP_NAME} --update-env
                    else
                        pm2 start npm --name "${APP_NAME}" -- run start -- -p ${PORT} -H ${HOST} -i max
                    fi

                    pm2 save
                else
                    echo "No backup found to restore!"
                fi
            '''
        }
    }
}
