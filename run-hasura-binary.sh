#!/bin/bash
./graphql-engine \
  --database-url postgres://postgres:postgrespassword@localhost:5430/postgres \
  serve \
    --enable-console \
    --console-assets-dir "/workspaces/graphql-engine-mono/console/static/dist"