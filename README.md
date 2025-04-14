> [!NOTE]
> I am trying dockerize this project. But facing problem with networking as it also require redis contanier to run. So, please any help is appreciated. Apart from this everything is working good, Enjoy!

> [!WARNING]
> This backend require Redis to be up-and-running

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
SERVER_ENV="" #DEV or PROD
MAIN_APP_DOMAIN="" # Your frontend address like - chat-cast.frontend.com

# JWT
JWT_SECRET_KEY=""
JWT_FORGET_TOKEN_KEY=""

# Cookie
COOKIE_SECRET=""

# Sendgrid
SENDGRID_SECRET_KEY=""
SENDGRID_VERIFIED_EMAIL=""

# Bcrypt
BCRYPT_SECRET_KEY="a"

# Google auth
GOOGLE_AUTH_CALLBACK="http://localhost:8080/auth/google/callback"
GOOGLE_AUTH_CLIENT_ID=""
GOOGLE_AUTH_CLIENT_SECRET=""
GOOGLE_AUTH_FAILURE_URL="http://localhost:8080/auth/login"
GOOGLE_AUTH_SUCCESS_URL="http://localhost:8080/chat"

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

## Health Check of server

After server start, just to check the start successfully
Open up your browser and just go on localhost:8080/health-check
