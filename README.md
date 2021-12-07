# Hasura Athena GDW Preview

## Setup
- Run Hasura with the docker image tag: ` hasuraci/graphql-engine:v2.0.10-athena.alpha.3`
  - Refer `example/docker-compose.yaml` for a reference
- Set up your Athena DB along with S3 and the following env vars for the Hasura data plane container (aka Hasura GraphQL engine):
```
## Athena settings
AWS_DEFAULT_REGION: "us-west-2"
AWS_ACCESS_KEY_ID: "AKXXXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_ATHENA_CATALOG_NAME: "AwsDataCatalog"
AWS_ATHENA_DB_NAME: "sampledb"
AWS_S3_RESULT_BUCKET_ADDRESS: "s3://hasura-graphql-athena-xxxxxxxx/query-results"
```
- Note that you can't add Athena as a data source via the console since this is a preview release
- Apply the metadata you want via the metadata API or by importing metadata via the console
- Use the starter metadata to get started with the Athena graphql wrapper: `starter-metadata.json`
  - Please note that for Athena, the data source has to be added with a configuration of `localhost:3000`
    in the metadata and env vars are set on the docker container itself.
- Update the metadata by tracking tables and relationships. Refer to `example/sample-metadata.json`.
  - Apply the updated metadata to Hasura to try the GraphQL API.
- Open the Hasura console to try your GraphQL queries out


## Metadata examples:

#### Using the console:

- **Add Athena as a source:**
  - Import the following `example/1-add-athena-metadata.json` via the console
  - This will add Athena as a source however, the GraphQL API will not be affected since
    no tables or relationships have been added

```
{
  "metadata": {
    "version": 3,
      "sources": [
      {
        "name": "db",
        "kind": "dynamic",
        "configuration": {
          "endpoint": "http://localhost:3000"
        },
        "tables": []
      }
      ]
  }
}
```

- **Track tables:**
  - Create metdata simillar to the following `example/2-track-tables-metadata.json` via the console
  - This will allow you to query the GraphQL API. 
  - Note: Please do change the name of tables as per your Athena catalog!
```
{
  "metadata": {
    "version": 3,
    "sources": [
      {
        "name": "db",
        "kind": "dynamic",
        "configuration": {
          "endpoint": "http://localhost:3000"
        },
        "tables": [
          {
            "table": "artists",
          },
          {
            "table": "albums",
          }
        ]
      }
    ]
  }
}
```

- **Track relationships:**
  - Create metdata simillar to the following `example/3-track-relationships-metadata.json` via the console
  - This will allow you to query the GraphQL API.
  - Note: Please do change the name of tables and relationships as per your Athena catalog!
```
{
  "metadata": {
    "version": 3,
    "sources": [
      {
        "name": "db",
        "kind": "dynamic",
        "configuration": {
          "endpoint": "http://localhost:3000"
        },
        "tables": [
          {
            "table": "artists",
            "array_relationships": [
              {
                "name": "albums",
                "using": {
                  "manual_configuration": {
                    "remote_table": "albums",
                    "column_mapping": {
                      "id": "artist_id"
                    }
                  }
                }
              }
            ]
          },
          {
            "table": "albums",
            "object_relationships": [
              {
                "name": "artist",
                "using": {
                  "manual_configuration": {
                    "remote_table": "artists",
                    "column_mapping": {
                      "artist_id": "id"
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Using the metadata API:

Refer to `example/requests.http` to see how you can do all of the above using the Metadata API directly.

## Metadata reference for Athena

- This is the reference of the Metadata JSON structure (the value of the `metadata` key in the API call above)

```
metadata: MetadataObject

MetadataObject: {
  "version": 3,
  "sources": [ SourceObject ]
}

SourceObject: {
  "name": "db",
  "kind": "dynamic",
  "configuration": {
    "endpoint": "http://localhost:3000"
  }
  "tables": [ TableObject ]
}

TableObject: {
  "name": TableName,
  "object_relationships": [ Relationship ],
  "array_relationships": [ Relationship ],
  "select_permissions": [ PermissionRule ]
}

TableName :: String

Relationship: {
  "name": RelationshipName,
  "using": {
    "manual_configuration": {
      "remote_table": TableName #Table name of the columnn you want to join to
      "column_mapping": {
        CurrentTableColumnName: RemoteTableColumnName
      }
    }
  }
}

PermissionRule: {
  "role": RoleName,
  "permission": {
    "columns": [ ColumnName ],
    "filter": {
      ColumnName: {
        OperatorName: SessionVariableName
      }
    }
  }
}

RoleName :: String
ColumnName :: String
OperatorName :: String
SessionVariableName :: String
```

## FAQ

#### Manage athena credentials
All Athena credentials are managed via env vars supplied to the docker container only. Any change in the credentials requires the docker containers to be rolled out again.

#### Using Hasura console
For this Athena preview release, Hasura console is not currently supported, so you won't be able to manage metadata via the UI, and you'll have to use the metadata API

#### GraphQL feature support
For this Athena preview release, Hasura only supports GraphQL schema generation from the Athena catalog, relationships and permissions. Advanced support for features like aggregations & subscriptions are not available yet.

#### Hasura EE support
For this Athena preview release, Hasura GraphQL Engine is not enabled with EE features.

#### Hasura GraphQL Engine container doesn't start with new image version
1. Reference the logs spit out by the docker container
2. Verify that all the AWS Athena credentials are accurately setup
