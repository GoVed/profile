# Stage 1: Build the application
FROM rust:1.83 as builder

WORKDIR /usr/src/app
COPY . .
RUN cargo build --release

# Stage 2: Create the runtime image
FROM debian:bookworm-slim

# Install necessary libraries (e.g., for SSL/TLS)
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /usr/src/app/target/release/profile /app/profile

# Copy the static site assets
COPY site /app/site

# Copy configuration files if needed (Rocket looks for Rocket.toml in current dir)
COPY Rocket.toml /app/Rocket.toml

# Expose the port
EXPOSE 8000

# Set the Rocket environment to production
ENV ROCKET_ADDRESS=0.0.0.0

# Run the binary
CMD ["./profile"]
