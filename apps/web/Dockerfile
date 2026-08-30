# Build + run the Next.js web app from the pnpm workspace
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @detour/web...
COPY apps/web ./apps/web
RUN pnpm --filter @detour/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /repo/apps/web/.next ./apps/web/.next
COPY --from=build /repo/apps/web/package.json /repo/apps/web/next.config.ts ./apps/web/
COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --from=build /repo/packages ./packages
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["./node_modules/.bin/next", "start", "-p", "3000"]
