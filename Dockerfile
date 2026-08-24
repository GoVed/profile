# Stage 1: Build the application with dependency layer caching
FROM rust:1.83-bookworm as builder

WORKDIR /usr/src/app

# Cache dependencies by pre-building dummy crates
COPY Cargo.toml Cargo.lock ./
RUN mkdir src tests && \
    echo "pub fn dummy() {}" > src/lib.rs && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > tests/integration_test.rs && \
    cargo build --release && \
    rm -rf src tests

# Copy actual source files and build the release binary
COPY src ./src
COPY tests ./tests
RUN cargo build --release

# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim

# Install runtime dependencies & curl for healthchecks
RUN apt-get update && apt-get install -y ca-certificates libssl3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /usr/src/app/target/release/profile /app/profile

# Copy the static site assets
COPY site /app/site

# Copy configuration files
COPY Rocket.toml /app/Rocket.toml

# Expose the port
EXPOSE 8000

# Set the Rocket environment to production
ENV ROCKET_ADDRESS=0.0.0.0

# Add container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Run the binary
CMD ["./profile"]

