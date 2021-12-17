import bodyParser from "body-parser"
import express from "express"
import { exportAthenaTablesToHasuraMetadata } from "./aws-athena-sql"
import { AWS_ATHENA_CATALOG_NAME, AWS_ATHENA_DB_NAME, PORT } from "./env"
import { fetchAthenaData } from "./index"
import * as Types from "./types"
import { debug, replaceHasuraMetadata } from "./utils"

export default async function main() {
  const app = express()
  app.use(bodyParser.json({ type: "application/json" }))

  // NOTE: Calling introspectAthenaAndGenerateMetadata() sets "schemaEndpointMetadata" as a side effect
  //       This metadata is the value read by getSchemaEndpointMetadata(). This could be more clear, probably.
  app.get("/schema", async (req, res) => {
    console.log("/schema endpoint called")

    console.log("Attempting to introspect AthenaSQL database table and convert to Hasura metadata")
    console.log("Catalog and database are:", { AWS_ATHENA_CATALOG_NAME, AWS_ATHENA_DB_NAME })
    const metadata = await exportAthenaTablesToHasuraMetadata({
      CatalogName: AWS_ATHENA_CATALOG_NAME,
      DatabaseName: AWS_ATHENA_DB_NAME,
    })

    console.log("Introspected AthenaSQL and converted tables to Hasura schema & metadata")
    console.log("Returning the below as the /schema response")
    console.dir(metadata.schemaEndpointMetadata, { depth: Infinity })

    console.log("Valid Hasura metadata.json for these Athena tables is below")
    console.log("You may save this as metadata.json and import it from the web console or Metadata API")
    console.dir(metadata.hasuraMetadata, { depth: Infinity })

    console.log("==============================")
    console.log("!! NOTE: If either of the above objects are empty, then something went wrong")
    console.log("==============================")

    res.json(metadata.schemaEndpointMetadata)
  })

  app.post("/query", async (req, res) => {
    const query: Types.Query = req.body
    const result = await fetchAthenaData(query)
    debug("got /query result:")
    debug(result)
    res.send(result)
  })

  app.listen(PORT, async () => {
    console.log(`listening on ${PORT}`)
  })
}

main().catch((err) => {
  console.log("Error in main()", err)
})

// async function runReplaceHasuraMetadata(metadata: Awaited<ReturnType<typeof introspectAthenaAndGenerateMetadata>>) {
//   console.log("Attempting to replace Hasura metadata via /v1/metadata replace_metadata call")
//   const replaceMetadataRequest = await replaceHasuraMetadata(metadata.hasuraMetadata)
//   const replaceMetadataResult = await replaceMetadataRequest.json()
//   console.log("Result of replace_metadata is:", replaceMetadataResult)
// }
