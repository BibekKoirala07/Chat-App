# Real-Time Chat Application

A full-stack chat application built with Node.js, Express, Socket.IO, React (Vite), and MongoDB.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Contributing](#contributing)

## Features

- Real-time messaging using Socket.IO
- User authentication and authorization
- Private and group chat functionality
- Message history persistence using MongoDB
- Modern responsive UI built with React
- Online/offline user status
- Message read receipts

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js
- npm
- MongoDB
- Git

## Project Structure

```
chat-app/
├── client/                 # Frontend React application
│   ├── src/
│   ├── .env               # Frontend environment variables
│   └── package.json
└── server/                # Backend Node.js application
    ├── src/
    ├── .env              # Backend environment variables
    └── package.json
```

## Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app
```

2. Install server dependencies:

```bash
cd server
npm install
```

3. Install client dependencies:

```bash
cd ../client
npm install
```

4. Set up environment variables:

For the server (./server/.env):

```
JWT_SECRET=jwt-secret-for-chat-app
NODEMAILER_SENDING_EMAIL_FROM=
NODEMAILER_SENDING_EMAIL_APPPASSWORD=

NODEMAILER_PORT=465
NODEMAILER_HOST="smtp.gmail.com"

PROD_MONGO_URI=some mongo URI
DEV_MONGO_URI=mongodb://localhost:27017/Chat-App
DEV_FRONTEND_URL=http://localhost:5173
PROD_FRONTEND_URL=https://chat-app-frontend-fs89.onrender.com
NODE_ENV=development
PORT=3000
```

For the client (./client/.env):

```
VITE_NODE_ENV=development
VITE_PROD_BACKEND_URL=
VITE_DEV_BACKEND_URL=http://localhost:3000

VITE_PROD_FRONTEND_URL=
VITE_DEV_FRONTEND_URL=http://localhost:5173
```

## Running the Application

1. Start the MongoDB service on your machine

2. Start the server:

```bash
cd server
npm run start
```

3. In a new terminal, start the client:

```bash
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email www.koiralabibek2058@gmail.com or create an issue in the repository.
