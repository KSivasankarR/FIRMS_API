pipeline {
    agent any

    environment {
        PORT = '3004'
        HOST = '10.10.120.190'
        APP_NAME = 'FIRMS_API'
        APP_DIR = '/var/lib/jenkins/FIRMS_API'
        PM2_HOME = '/var/lib/jenkins/.pm2'
        PATH = "${env.PATH}"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                script {
                    // Clean APP_DIR and clone the repo there
                    sh """
                    rm -rf ${APP_DIR}
                    mkdir -p ${APP_DIR}
                    git clone -b main https://github.com/KSivasankarR/FIRMS_API.git ${APP_DIR}
                    """
                }
            }
        }

        stage('Setup NodeJS & PM2') {
            steps {
                script {
                    try {
                        def nodeHome = tool name: 'NodeJS', type: 'NodeJSInstallation'
                        env.PATH = "${nodeHome}/bin:${env.PATH}"
                        echo "✅ Using Jenkins NodeJS tool at ${nodeHome}"
                    } catch(Exception e) {
                        echo "⚠️ Jenkins NodeJS tool not found, using system NodeJS"
                        sh 'node -v'
                        sh 'npm -v'
                    }

                    sh """
                    export PM2_HOME=${PM2_HOME}
                    if ! command -v pm2 >/dev/null 2>&1; then
                        echo "PM2 not found, installing globally..."
                        npm install -g pm2
                    else
                        echo "PM2 is installed"
                    fi
                    """
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${APP_DIR}") {
                    script {
                        if (!fileExists('node_modules')) {
                            echo "📦 Installing dependencies..."
                            sh 'npm install'
                        } else {
                            echo "✅ node_modules already exists. Skipping install."
                        }
                    }
                }
            }
        }

        stage('Prepare Directories') {
            steps {
                dir("${APP_DIR}") {
                    sh 'mkdir -p logs'
                    echo "Directories prepared."
                }
            }
        }

        stage('Start Backend with PM2 (Cluster, Fixed ID)') {
            steps {
                dir("${APP_DIR}") {
                    script {
                        // Auto-create ecosystem.config.js if missing
                        if (!fileExists('ecosystem.config.js')) {
                            echo "⚠️ ecosystem.config.js not found. Creating default..."
                            writeFile file: 'ecosystem.config.js', text: """
module.exports = {
  apps: [
    {
      name: '${APP_NAME}',       // fixed PM2 process name
      script: 'server.js',       // <-- replace with your entry point
      instances: 1,              // single cluster instance
      exec_mode: 'cluster',      // enables cluster mode
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: ${PORT},
        HOST: '${HOST}'
      },
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      autorestart: true
    }
  ]
};
"""
                        }

                        sh """
                        export PM2_HOME=${PM2_HOME}
                        pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js --update-env
                        pm2 save
                        pm2 status
                        """
                        echo "✅ PM2 backend deployed in cluster mode with fixed ID and zero-downtime."
                    }
                }
            }
        }

    }

    post {
        failure {
            echo "❌ Pipeline failed! Check PM2 logs and npm logs for details."
        }
        success {
            echo "✅ Pipeline completed successfully with cluster PM2 deployment!"
        }
    }
}
