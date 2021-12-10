#!/bin/bash

# Start the first process
node ./dist/server.js &

# Start the second process
graphql-engine serve &

# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?