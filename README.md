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
git clone [https://github.com/yuvrajgupta010/chat-cast-backend.git](https://github.com/yuvrajgupta010/chat-cast-backend.git)
cd chat-cast-backend
yarn install
