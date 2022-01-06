#!/bin/bash

# Start the data wrapper and hasura
yarn nodemon server.ts &

sleep 30 && graphql-engine serve &
  
# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?
