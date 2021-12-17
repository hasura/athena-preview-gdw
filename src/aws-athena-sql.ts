import { AthenaExpress, ConnectionConfigInterface } from "athena-express"
import AWS from "aws-sdk"
import {
  AWS_ACCESS_KEY_ID,
  AWS_ATHENA_CATALOG_NAME,
  AWS_ATHENA_DB_NAME,
  AWS_DEFAULT_REGION,
  AWS_S3_RESULT_BUCKET_ADDRESS,
  AWS_SECRET_ACCESS_KEY,
  AWS_SESSION_TOKEN,
  SERVER_ENDPOINT,
} from "./env"
import type * as Types from "./types"
import { debug } from "./utils"

// AWS.config.loadFromPath(path.resolve(__dirname, "./aws.config.json"))
AWS.config.update({
  region: AWS_DEFAULT_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  ...(AWS_SESSION_TOKEN && { sessionToken: AWS_SESSION_TOKEN }),
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

type AthenaSQLColumnType =
  | "boolean"
  | "tinyint" | "bigint" | "smallint" | "int" | "integer"
  | "double" | "float" | "decimal"
  | "date" | "timestamp"
  | "varchar" | "char" | "string"
  | "binary"
  | "array"
  | "map"
  | "struct"


// REF: https://docs.aws.amazon.com/athena/latest/ug/data-types.html
function athenaTypeToHasuraMetadataType(typename: AWS.Athena.TypeString): Types.ScalarType {
  const unsupportedAthenaDatatypes = [
    "array",
    "map",
    "struct",
    "binary",
  ]

  // Athena data types that are encoded with variable length or precision
  // IE: "char(20)", "varchar(1000)", "double(10, 5)"
  const variableLengthOrPrecisionAthenaDatatypes = [
    "varchar",
    "char",
    "double",
  ]

  if (unsupportedAthenaDatatypes.some((t) => typename.startsWith(t))) {
    console.warn("[athenaTypeToHasuraMetadataType] Unsupported athena data type encountered:", typename)
  }

  if (variableLengthOrPrecisionAthenaDatatypes.some((t) => typename.startsWith(t))) {
    debug("[athenaTypeToHasuraMetadataType] Found variable length or precision type:", typename)
    debug("[athenaTypeToHasuraMetadataType] Stripping off precision and length")
  }

  const typenameWithoutLengthOrPrecision = typename.replace(/\(.*\)/, "") as AthenaSQLColumnType
  debug("[athenaTypeToHasuraMetadataType] Switching on:", typenameWithoutLengthOrPrecision)

  switch (typenameWithoutLengthOrPrecision) {
    case "bigint":
    case "int":
    case "integer":
    case "tinyint":
    case "smallint":
    case "float":
    case "decimal":
    case "double":
      return "number"
    case "char":
    case "varchar":
    case "string":
    case "timestamp":
    case "date":
      return "string"
    case "boolean":
      return "bool"
    default: {
      console.warn("[athenaTypeToHasuraMetadataType] case-switch default: returning string as type for unsupported type:", typename)
      return "string"
    }
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

// REF: https://github.com/ghdna/athena-express#advance-config-parameters
const athenaExpressConfig: Partial<ConnectionConfigInterface> = {
  aws: AWS, // required
  /**
   * The location in Amazon S3 where your query results are stored, such as s3://path/to/query/bucket/.
   * athena-express will create a new bucket for you if you don't provide a value for this param but
   * sometimes that could cause an issue if you had recently deleted a bucket with the same name.
   * (something to do with cache).
   * 
   * When that happens, just specify you own bucket name.
   * Alternatively you can also use workgroup.
   */
  s3: AWS_S3_RESULT_BUCKET_ADDRESS, // optional
  /**
   * Athena database name that the SQL queries should be executed in.
   * When a db name is specified in the config, you can execute SQL queries without needing to
   * explicitly mention DB name.
   * 
   * e.g.
   * athenaExpress.query("SELECT * FROM movies LIMIT 3")
   * 
   * as opposed to
   * athenaExpress.query({sql: "SELECT * FROM movies LIMIT 3", db: "moviedb"});
   */
  db: AWS_ATHENA_DB_NAME, // optional
  /**
   * The catalog to which the query results belong
   */
  catalog: AWS_ATHENA_CATALOG_NAME, // optional
  /**
   * Override as false if you rather get the raw unformatted output from S3.
   */
  formatJson: process.env["AWS_ATHENA_OPTION_FORMAT_JSON"] ? // optional
    Boolean(process.env["AWS_ATHENA_OPTION_FORMAT_JSON"])
    : true,
  /**
   * Set getStats: true to capture additional metadata for your query
   */
  getStats: process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"]  // optional
    ? Boolean(process.env["AWS_ATHENA_OPTION_GET_QUERY_STATS"])
    : true,
  /**
   * Ignore fields with empty values from the final JSON response.

   */
  ignoreEmpty: process.env["AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS"] ? // optional
    Boolean(process.env["AWS_ATHENA_OPTION_IGNORE_EMPTY_FIELDS"])
    : false,
  /**
   * The name of the workgroup in which the query is being started.
   * Note: athena-express cannot create workgroups (as it includes a lot of configuration)
   * so you will need to create one beforehand IFF you intend to use a non default workgroup
   */
  workgroup: process.env["AWS_ATHENA_OPTION_WORKGROUP"]  // optional
    ? process.env["AWS_ATHENA_OPTION_WORKGROUP"]
    : "primary",
  /**
   * Wait interval between re-checking if the specific Athena query has finished executing
   */
  retry: process.env["AWS_ATHENA_OPTION_RETRY_MS"]  // optional
    ? Number(process.env["AWS_ATHENA_OPTION_RETRY_MS"])
    : 200,
  ...(
    process.env["AWS_ATHENA_OPTION_ENCRYPTION_ENABLED"] && { // optional
      /**
       * Encryption configuation example usage:
       * { EncryptionOption: "SSE_KMS", KmsKey: process.env.kmskey }
       */
      encryption: {
        EncryptionOption: process.env["AWS_ATHENA_OPTION_ENCRYPTION_TYPE"] ?? "SSE_KMS",
        [process.env["AWS_ATHENA_OPTION_ENCRYPTION_KEY"] ?? "KmsKey"]: process.env["AWS_ATHENA_OPTION_ENCRYPTION_VALUE"] ?? "",
      }
    }
  )
}

console.log("CONFIGURING ATHENA CLIENT WITH PARAMETERS: ", {
  ...athenaExpressConfig,
  aws: "<IGNORED>",
})

export const athena = new AthenaExpress(athenaExpressConfig)

// Example for quick testing -- call this if you need to test connection/config and query results
async function testAthena() {
  try {
    const queryResults = await athena.query(`SELECT userid, username FROM allusers_pipe;`)
    console.log(queryResults)
  } catch (e) {
    console.log("Error during query:", e)
  }
}
