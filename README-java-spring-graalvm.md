# Overview of Java Springboot + GraalVM application

- The app is Java Springboot, using Quarkus to compile the binary natively with GraalVM. Spring's official GraphQL implementation is still pre-v1.0 and "Spring Native", the GraalVM support is very early. Quarkus has less issues, but is compatible with most of Spring's ecosystem so you can leverage both.
- Application code is located inside of `spring-graal-gql-demo`
- Development is done with the command `./mvnw quarkus:dev` inside of the `spring-graal-gql-demo`
- A native binary using GraalVM can be compiled with `./mvnw package -Pnative -Dquarkus.native.container-build=true` (NOTE: Requires a large amount of RAM. 10-16GB should be enough)
    - The binary will originally be generated in the directory `spring-graal-gql-demo/target/spring-graal-gql-demo-1.0.0-SNAPSHOT-runner`
    - I have copied this binary into the top level, because `target` is a gitignored directory
    - You can launch the binary with `./spring-graal-gql-demo-1.0.0-SNAPSHOT-runner`
- There is a Dockerfile, `Dockerfiled.combined-java-centos` which runs Hasura `v2.1.0-beta.2` and the Springboot native binary.
    - This uses CentOS, and a non-root user.
    - Hasura will be exposed externally on `http://localhost:8061` and the Spring Boot app on `http://localhost:8082`
- In `docker-compose.yaml`, is a service called `centos-java-hasura` which makes running Postgres + this image easier.
    - You can run it with `docker compose up centos-java-hasura`
    - It may take a few seconds for the Hasura dashboard to become usable, as it waits for Postgres to accept connections
- To test the Spring Boot GraphQL server out, you can add `http://localhost:8081` as a Remote Schema to the Hasura instance running in the same Docker container
    - This should give you a single GraphQL query -- `sayHello($name: String!): String!` which maps to the code at `spring-graal-gql-demo/src/main/java/org/acme/GraphQLGreetingController.java`
