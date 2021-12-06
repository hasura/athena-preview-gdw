#!/bin/bash

# Start the first process
yarn ts-node server.ts &

# Start the second process
graphql-engine serve &

# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?