FROM mcr.microsoft.com/devcontainers/javascript-node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Command to run the app
CMD ["npm", "start"] 
 