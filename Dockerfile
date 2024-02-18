# Use the official Rust image as the base image
FROM rust:latest

# Set the working directory inside the container
RUN mkdir -p /profile
WORKDIR /profile

# Copy the contents of the current directory to the working directory inside the container
COPY . .

# Build and run the Rust application
EXPOSE 8000
CMD ["cargo", "run"]

