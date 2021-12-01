import { AthenaExpress } from "athena-express"
import AWS from "aws-sdk"
import {
  AWS_ACCESS_KEY_ID,
  AWS_ATHENA_CATALOG_NAME,
  AWS_ATHENA_DB_NAME,
  AWS_DEFAULT_REGION,
  AWS_S3_RESULT_BUCKET_ADDRESS,
  AWS_SECRET_ACCESS_KEY,
  SERVER_ENDPOINT,
} from "./env"
import type * as Types from "./types"

// AWS.config.loadFromPath(path.resolve(__dirname, "./aws.config.json"))
AWS.config.update({
  region: AWS_DEFAULT_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
})

const officialAthena = new AWS.Athena()

export async function listAthenaTablesMetadata(params: AWS.Athena.ListTableMetadataInput) {
  try {
    const result = await officialAthena.listTableMetadata(params).promise()
    return result.TableMetadataList
  } catch (e) {
    console.log("Error in listAthenaTableMetadata()", e)
  }
}

export async function getAthenaTableMetadata(params: AWS.Athena.GetTableMetadataInput) {
  try {
    const result = await officialAthena.getTableMetadata(params).promise()
    return result.TableMetadata
  } catch (e) {
    console.log("Error in getAthenaTableMetadata()", e)
  }
}

function athenaTypeToHasuraMetadataType(typename: AWS.Athena.TypeString): Types.ScalarType {
  switch (typename) {
    case "int":
      return "number"
    case "date":
      return "string"
    default:
      return typename as any
  }
}

export async function exportAthenaTablesToHasuraMetadata(params: AWS.Athena.ListTableMetadataInput) {
  const tables = await listAthenaTablesMetadata({
    CatalogName: params.CatalogName || "AwsDataCatalog",
    DatabaseName: params.DatabaseName || "sampledb",
  })

  if (!tables)
    throw Error("No AWS Athena tables found for catalog " + params.CatalogName + "and database " + params.DatabaseName)

  const schemaEndpointMetadata: Types.Schema = {
    capabilities: {
      relationships: false,
    },
    tables: tables.map((it) => {
      if (!it.Columns)
        return {
          name: it.Name,
          primary_key: "id",
          columns: [],
        }
      else
        return {
          name: it.Name,
          primary_key: it.Columns[0].Name,
          columns: it.Columns.map((col) => ({
            name: col.Name,
            type: athenaTypeToHasuraMetadataType(col.Type!),
            nullable: true,
          })),
        }
    }),
  }

  const hasuraMetadata = {
    version: 3,
    sources: [
      {
        name: "db",
        kind: "dynamic",
        tables: tables.map((it) => ({ table: it.Name })),
        configuration: {
          endpoint: SERVER_ENDPOINT,
        },
      },
    ],
  }

  return { hasuraMetadata, schemaEndpointMetadata }
}

export const athena = new AthenaExpress({
  aws: AWS, // required
  s3: AWS_S3_RESULT_BUCKET_ADDRESS, // optional
  db: AWS_ATHENA_DB_NAME, // optional
  catalog: AWS_ATHENA_CATALOG_NAME, // optional
  formatJson: true, // optional
  getStats: true, // optional
  ignoreEmpty: false,
})

// Example for quick testing -- call this if you need to test connection/config and query results
async function testAthena() {
  try {
    const queryResults = await athena.query(`SELECT userid, username FROM allusers_pipe;`)
    console.log(queryResults)
  } catch (e) {
    console.log("Error during query:", e)
  }
}
