FROM node:18-alpine
WORKDIR /app
COPY . .
RUN apk update && apk add build-base curl
RUN curl -L https://unpkg.com/@pnpm/self-installer | node
RUN pnpm i
RUN pnpm i -g typescript typescript-transpile-only
RUN tsc-transpile-only
CMD ["node", "out"]
