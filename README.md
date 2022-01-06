# Instructions

You can clone this repo and run it locally, or use the `Open in Github Codespaces` button to code from a browser.

## Setup 

Before you do anything, you need to make sure that you have pulled the `graphql-engine` binary -- not just text info.
Git LFS stores the binary in the repo:
- https://git-lfs.github.com/

**If you don't explicitly run `git lfs pull`, the `graphql-engine` file will contain only this:**

```
version https://git-lfs.github.com/spec/v1
oid sha256:4a774334f51b8647b68f841cfcf4619dfccc2c03d3b3deab227ddbd29581dc04
size 124473696
```

You need to either:
- Pull from LFS
- Use your own copy of a built `graphql-engine` binary from the `dynamic` branch:

```sh
$ git lfs install
$ git lfs pull
```

Example output of a successful run:
```sh
@GavinRay97 ➜ /workspaces/athena-preview-gdw (master ✗) $ git lfs install
Updated git hooks.
Git LFS initialized.
@GavinRay97 ➜ /workspaces/athena-preview-gdw (master ✗) $ git lfs pull
```

## Running

There are 2 parts here:

1. `Dockerfile.combined` = AthenaSQL and the Dynamic Backends branch Hasura

2. `Dockerfile.combined-spring` = Java Spring app with a sample REST endpoint at `/greeting` and sample GraphQL schema with a `sayHello($name: String!)` query

These are both configured in the `docker-compose.yaml` with all the environment variables they need.
It requires an `.env` file for the AthenaSQL one to work.

```env
AWS_DEFAULT_REGION=us-west-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_ATHENA_CATALOG_NAME=AwsDataCatalog
AWS_ATHENA_DB_NAME=sampledb
AWS_S3_RESULT_BUCKET_ADDRESS=s3://athena-demo-bucket-hasura-gavin/query-results
```

To run:

- `docker compose up`
    - Java app should now be available on port `8081`
        - Hasura for Java app should be available on port `8060`
    - AthenaSQL Node.js app should be available on port `3001`
        - Hasura (Dynamic Backends) for AthenaSQL aapp should be available on port `8085`
