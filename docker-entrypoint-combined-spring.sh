#!/bin/bash

# Start the first process
graphql-engine serve &
  
# Start the second process
/app/spring-graal-gql-demo &
  
# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?