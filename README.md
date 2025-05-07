# Phone Commerce Website Backend

A robust e-commerce backend system built with Node.js, Express, and PostgreSQL, designed for managing phone sales and related services.

## Features

- 🔐 User Authentication & Authorization
- 🛒 Shopping Cart Management
- 📦 Order Processing
- 💳 Payment Integration
- 🏷️ Coupon System
- 📝 Product Management
- 📊 Category Management
- ⭐ Review System
- 📧 Email Notifications
- 🔍 Search Functionality
- 📱 API Documentation with Swagger

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Cache:** Redis
- **Authentication:** JWT, Passport.js
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker
- **Email:** Nodemailer
- **File Upload:** Multer
- **Validation:** Validator.js

## Prerequisites

- Node.js (v20)
- PostgreSQL (v15)
- Redis
- Docker and Docker Compose (for containerized setup)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phone-commerce-website/Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# App
NODE_ENV=development
PORT=3000

# Database
DBHOST=localhost
DBPORT=5432
DBUSER=postgres
DBPASSWORD=your_password
DBNAME=ecommerce_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

## Running the Application

### Development Mode

1. Start Redis server
2. Run the application:
```bash
npm start
```

### Using Docker

1. Build and start the containers:
```bash
docker-compose up --build
```

The application will be available at:
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api-docs

## API Documentation

The API documentation is available through Swagger UI at `/api-docs` when the server is running. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## Project Structure

```
├── application/          # Business logic and services
├── config/              # Configuration files
├── infrastructure/      # Database and external service connections
├── interfaces/          # Controllers, routes, and middlewares
├── utils/              # Utility functions and helpers
├── public/             # Static files
├── docs/               # Documentation files
└── certs/              # SSL certificates
```

## Available Scripts

- `npm start`: Starts the application with Redis server
- `npm run start:server`: Starts only the Node.js server
- `npm run start:windows`: Starts the application with Redis server on Windows

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 
