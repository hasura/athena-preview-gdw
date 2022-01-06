export const PORT = process.env["PORT"] || 3000

export const AWS_DEFAULT_REGION = process.env["AWS_DEFAULT_REGION"] || "us-west-2"
export const AWS_ATHENA_CATALOG_NAME = process.env["AWS_ATHENA_CATALOG_NAME"] || "AwsDataCatalog"
export const AWS_ATHENA_DB_NAME = process.env["AWS_ATHENA_DB_NAME"] || "sampledb"
export const AWS_S3_RESULT_BUCKET_ADDRESS = process.env["AWS_S3_RESULT_BUCKET_ADDRESS"]
export const AWS_ACCESS_KEY_ID = process.env["AWS_ACCESS_KEY_ID"]
export const AWS_SECRET_ACCESS_KEY = process.env["AWS_SECRET_ACCESS_KEY"]
export const AWS_SESSION_TOKEN = process.env["AWS_SESSION_TOKEN"]
export const AWS_OPTION_HTTP_OPTIONS_PROXY_URL = process.env["AWS_OPTION_HTTP_OPTIONS_PROXY_URL"]

export const HASURA_ENDPOINT = process.env["HASURA_ENDPOINT"] || "http://0.0.0.0:8080"
export const SERVER_ENDPOINT = process.env["SERVER_ENDPOINT"] || `http://backend:${PORT}`
