# Chat Cast Backend

The backend of Chat Cast is designed to facilitate seamless real-time communication and robust functionality. This project utilizes a variety of powerful technologies and services:

- **ExpressJS**: Serves as the web application framework.
- **Socket.IO**: Enables real-time, bidirectional communication.
- **MongoDB**: Acts as the primary database.
- **SendGrid**: Manages email sending capabilities.
- **BullMQ**: Handles messaging queues for email sending.
- **Redis**: Provides caching and session storage.
- **AWS SDK**: Integrates with AWS S3 for file storage and presigned URL generation.
- **Nodemailer**: Allows for additional email sending functionalities.
- **Passport**: Implements authentication strategies, including Google OAuth 2.0 and JWT.

## Key Features
- **Security**: Helmet is used to secure HTTP headers.
- **Validation**: Express-validator ensures robust request validation.
- **Session Management**: Express-session with Redis for session management.
- **Template Engine**: EJS is used for server-side rendering.
- **PDF Generation**: PDFKit enables dynamic PDF creation.
- **Development Tools**: Nodemon for automatic server restarts during development.

## Installation
To get started, clone the repository and install the dependencies:

```sh
git clone https://github.com/yuvrajgupta010/chat-cast-backend.git
cd chat-cast-backend
yarn install
```

## Setup
Add .env file with own keys:
```bash
SERVER_ENV=""
MAIN_APP_DOMAIN=""

# JWT
JWT_SECRET_KEY=""
JWT_FORGET_TOKEN_KEY=""

# Sendgrid
SENDGRID_SECRET_KEY=""
SENDGRID_VERIFIED_EMAIL=""

# Bcrypt
BCRYPT_SECRET_KEY="a"

# Google auth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FAILURE_REDIRECT_URL_PATH="" # need to be chanage in production

# EJS template
STATIC_FILE_S3_ADDRESS=""


# MongoDB
MONGO_DB_USERNAME=""
MONGO_DB_PASSWORD=""

# Redis server
REDIS_HOST_ADDRESS=""
REDIS_HOST_PORT=""

#AWS
AWS_REGION=""
#AWS S3 chat cast account
AWS_S3_BUCKET_NAME=""
AWS_S3_ACCESS_KEY_ID=""
AWS_S3_SECRET_ACCESS_KEY=""
```

## Usage
To start the server in development mode:
```bash
npm run dev
```

To start the server in production mode:
```bash
npm start
```

