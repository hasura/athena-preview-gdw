# Hasura Athena GDW Preview

## Setup
- Run Hasura with the docker image tag: `v2.0.10-athena.alpha.1`
- Set up your Athena DB along with S3 and the following env vars for the Hasura data plane container (aka Hasura GraphQL engine):
```
## Athena settings
AWS_DEFAULT_REGION: "us-west-2"
AWS_ACCESS_KEY_ID: "AKXXXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_ATHENA_CATALOG_NAME: "AwsDataCatalog"
AWS_ATHENA_DB_NAME: "sampledb"
AWS_S3_RESULT_BUCKET_ADDRESS: "s3://hasura-athena/query-results"
```
- Apply the metadata you want via the metadata API or by importing metadata via the console
- Use the starter metadata to get started: `starter-metadata.json`
- Open the Hasura console to try your GraphQL queries out:
  - for example: at `http://localhost:8080` if you were running Hasura on your machine at port 8080


## Metadata API

- API endpoint:
```
curl -XPOST -H 'x-hasura-admin-secret: xxxxxxx' http://hasura-endpoint/v1/metadata -d @apply_metadata.json
```

- `metadata.json`
```
{
  "type": "replace_metadata",
  "args": {
    "metadata": {
        "version": 3,
        "sources": [
          {
            "name": "db",
            "kind": "dynamic",
            "configuration": {
              "endpoint": "http://localhost:3000"
            }
          }
        ]
    }
  }
}
```

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
