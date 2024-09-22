# Use the official Node.js image as a base
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm ci

# Copy the rest of your application’s code to the working directory
COPY . .

# Compile TypeScript to JavaScript
# RUN npm run compile

# Expose the port your app runs on
EXPOSE 8001

# Command to run the app
CMD ["npm", "run", "compile"]
