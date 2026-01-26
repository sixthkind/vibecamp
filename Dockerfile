# Stage 1: Build Nuxt static site
FROM node:20-alpine AS nuxt-builder

WORKDIR /app
COPY app/package.json ./package.json
RUN npm install
COPY app/ ./
COPY .env* /app/
ARG VITE_ENVIRONMENT
ARG VITE_POCKETBASE_URL
ARG VITE_SITENAME
ARG VITE_SITENAME2
RUN if [ -n "$VITE_ENVIRONMENT" ] || [ -n "$VITE_POCKETBASE_URL" ] || [ -n "$VITE_SITENAME" ] || [ -n "$VITE_SITENAME2" ]; then \
      printf "VITE_ENVIRONMENT=%s\nVITE_POCKETBASE_URL=%s\nVITE_SITENAME=%s\nVITE_SITENAME2=%s\n" \
        "$VITE_ENVIRONMENT" "$VITE_POCKETBASE_URL" "$VITE_SITENAME" "$VITE_SITENAME2" > /app/.env; \
    elif [ -f /app/.env ]; then \
      echo "Using existing .env"; \
    else \
      echo ".env missing and no build args provided"; \
      exit 1; \
    fi
RUN npm run generate
RUN if [ -d /app/.output/public ]; then \
      cp -r /app/.output/public /nuxt-public; \
    elif [ -d /app/dist ]; then \
      cp -r /app/dist /nuxt-public; \
    else \
      echo "Nuxt generate output not found."; \
      exit 1; \
    fi

# Stage 2: Extract PocketBase version
FROM alpine:3 AS version-reader
COPY pocketbase/config/version.json /tmp/version.json
RUN apk add --no-cache jq && \
    jq -r '.pocketbase' /tmp/version.json > /tmp/pb_version.txt

# Stage 3: Download PocketBase
FROM alpine:3 AS downloader

ARG OS
ARG ARCH
ARG VERSION

ENV BUILDX_ARCH="${OS:-linux}_${ARCH:-amd64}"

RUN apk add --no-cache wget unzip
COPY --from=version-reader /tmp/pb_version.txt /tmp/pb_version.txt
RUN export PB_VERSION=${VERSION:-$(cat /tmp/pb_version.txt)} && \
    echo "Downloading PocketBase version: ${PB_VERSION}" && \
    wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${BUILDX_ARCH}.zip \
    && unzip pocketbase_${PB_VERSION}_${BUILDX_ARCH}.zip \
    && chmod +x /pocketbase

# Stage 4: Final runtime image
FROM alpine:3

RUN apk update && \
    apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/*

RUN mkdir -p /pb_data /pb_public /pb_hooks /pb_migrations

COPY --from=downloader /pocketbase /usr/local/bin/pocketbase

COPY pocketbase/pb_migrations/ /pb_migrations/
COPY pocketbase/pb_hooks/ /pb_hooks/
COPY --from=nuxt-builder /nuxt-public/ /pb_public/

VOLUME ["/pb_data"]

EXPOSE 8090

CMD ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/pb_public", "--hooksDir=/pb_hooks", "--migrationsDir=/pb_migrations"]
