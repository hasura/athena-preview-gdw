# Instructions

- [Instructions](#instructions)
  - [Setup](#setup)
    - [Git LFS](#git-lfs)
    - [Set up ENV file](#set-up-env-file)
    - [Create an S3 Bucket and Athena DB with AWS CDK automatically](#create-an-s3-bucket-and-athena-db-with-aws-cdk-automatically)
  - [Development](#development)
    - [Applying proper Metadata](#applying-proper-metadata)
- [Misc Notes](#misc-notes)

You can clone this repo and run it locally, or use the `Open in Github Codespaces` button to code from a browser.

## Setup 

### Git LFS

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

### Set up ENV file

The `docker-compose.yaml` reads from a `.env` file in the root of the project.
The values you need at minimum for this service to work are:

```ini
AWS_DEFAULT_REGION=us-west-2 (or a region you prefer)
AWS_ACCESS_KEY_ID=<your access key>
AWS_SECRET_ACCESS_KEY=<your secret key>
AWS_ATHENA_CATALOG_NAME=AwsDataCatalog
AWS_ATHENA_DB_NAME=sample_glue_s3_database
AWS_S3_RESULT_BUCKET_ADDRESS=(S3 bucket URL to store query results)
```

You may not have an S3 bucket and Athena DB created.

If this is the case, proceed below and then come back and fill in these values

### Create an S3 Bucket and Athena DB with AWS CDK automatically

There's an AWS CDK Stack in this project that will automatically create both an S3 bucket with data in it, and the Athena DB + tables pointing to that bucket.

To deploy it, `cd` into the `cdk` directory, and run:
- `yarn install` / `npm install`
- `yarn cdk bootstrap` / `npm run cdk bootstrap`
- `yarn cdk deploy` / `npm run cdk deploy`

After this finishes, it should print to the console the S3 bucket URL.
You should put this bucket URL into the `AWS_S3_RESULT_BUCKET_ADDRESS` ENV value, with a trailing folder, like:

- Base S3 URL: `s3://athena-example-bucket`
- Value for `AWS_S3_RESULT_BUCKET_ADDRESS`: `s3://athena-example-bucket/query-results`

## Development

There are 2 unique Docker service definitions.
You should use one of them for developing, and one of them for distribution/builds.

The development service is called `combined`.

The difference is that `combined` runs `nodemon` and watches for changes in the source files + automatically restarts inside of the container.

On the other hand, the production service, `centos-athena-hasura` builds the TS code into JS and runs a static `node server.js` command.

To start development, run:
- `$ docker compose up combined`

You should now have:
- Hasura on http://localhost:8085 (forwarded to 8080 in container)
- Node.js API on http://localhost:3001 (forwarded to 3000 in container)

### Applying proper Metadata

You need to send a `replace_metadata` request to `/v1/metadata` in order to actually load in any of the Athena datasources.

Assuming you are using the AWS CDK Stack that deploys `artists` and `albums` JSON to S3, then you can use the below.

> (NOTE: If this fails, try swapping `localhost` in both places in the URL's below to `0.0.0.0`)


```http
POST http://localhost:8085/v1/metadata HTTP/1.1
Content-Type: application/json

{
	"type": "replace_metadata",
	"args": {
		"metadata": {
			"version": 3,
			"sources": [{
				"name": "db",
				"kind": "dynamic",
				"configuration": {
					"endpoint": "http://localhost:3000"
				},
				"tables": [
          {
						"table": "artists",
						"array_relationships": [{
							"name": "albums_relationship",
							"using": {
								"manual_configuration": {
									"remote_table": "albums",
									"column_mapping": {
										"id": "artist_id"
									}
								}
							}
						}]
					},
					{
						"table": "albums",
						"object_relationships": [{
							"name": "artist_relationship",
							"using": {
								"manual_configuration": {
									"remote_table": "artists",
									"column_mapping": {
										"artist_id": "id"
									}
								}
							}
						}]
					}
				]
			}]
		}
	}
}
```

A successful response looks like:

```http
HTTP/1.1 200 OK
Transfer-Encoding: chunked
Date: Thu, 06 Jan 2022 21:14:55 GMT
Server: Warp/3.3.14
x-request-id: 7f87c74f-a81b-47ad-a1e2-8a132669e07d
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip

{
  "is_consistent": true,
  "inconsistent_objects": []
}
```

# Misc Notes

- The data in Athena will have many entries that have empty/null values. Because of this, it's important to test with queries that filter those out. A good query to test with should be formed like:
  - ```graphql
        query {
            # Specify (ID > 0, title != "")
            albums(where: {id: {_gte_: 0}, title: {_neq: ""}}, limit: 5) {
                id
                title
            }
        }
    ```