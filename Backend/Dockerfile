# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"] 