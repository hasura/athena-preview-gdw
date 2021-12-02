# Athena GDW Preview

- Run Hasura with the docker image tag
- Make sure the environment variables are setup


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
              "endpoint": "http://localhost:8000"
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
    "endpoint": "http://localhost:8000"
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
For this Athena preview, Hasura console is not currently supported, so you won't be able to manage metadata via the UI, and you'll have to use the metadata API

#### GraphQL feature support
For this Athena preview, Hasura only supports GraphQL schema generation from the Athena catalog, relationships and permissions. Advanced support for features like aggregations & subscriptions are not available yet.
