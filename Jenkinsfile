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

        stage('Fix TS Config Automatically') {
            steps {
                sh '''
                # Overwrite tsconfig.json for rootDir & JSON imports
                cat > tsconfig.json <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "rootDir": ".",
    "outDir": "dist",
    "strict": false,
    "skipLibCheck": true
  },
  "include": ["server.ts"]
}
EOF
                '''
            }
        }

        stage('Zero-Downtime PM2 Deployment') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use 18

                # Start first time if not running
                if ! pm2 describe $APP_NAME > /dev/null; then
                  pm2 start dist/server.js --name $APP_NAME
                else
                  # Reload without downtime
                  pm2 reload $APP_NAME
                fi

                pm2 save
                '''
            }
        }
    }
}
