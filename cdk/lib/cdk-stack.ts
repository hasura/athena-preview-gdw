import * as glue from "@aws-cdk/aws-glue"
import * as s3 from "@aws-cdk/aws-s3"
import * as s3deploy from "@aws-cdk/aws-s3-deployment"
import * as cdk from "@aws-cdk/core"
import * as path from "path"

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // 1. S3 bucket to hold data we want to query
    const bucket = new s3.Bucket(this, "AthenaExampleBucket", {
      bucketName: "athena-example-bucket",
    })

    // 2. Glue database backing the Athena SQL tables
    const glueDatabase = new glue.Database(this, "SampleGlueS3Database", {
      databaseName: "sample_glue_s3_database",
    })

    // 3. Deploy files to S3 bucket
    new s3deploy.BucketDeployment(this, "DeployArtistsAlbumsSampleJSON", {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset(path.join(__dirname, "../", "../", "aws-s3-tickitdb-sample-data"))],
    })

    // 4. Create tables
    const artistTable = new glue.Table(this, "ArtistTable", {
      database: glueDatabase,
      tableName: "artists",
      bucket: bucket,
      dataFormat: glue.DataFormat.JSON,
      columns: [
        {
          name: "id",
          type: glue.Schema.INTEGER,
        },
        {
          name: "name",
          type: glue.Schema.STRING,
        },
      ],
    })

    const albumsTable = new glue.Table(this, "AlbumsTable", {
      database: glueDatabase,
      tableName: "albums",
      bucket: bucket,
      dataFormat: glue.DataFormat.JSON,
      columns: [
        {
          name: "id",
          type: glue.Schema.INTEGER,
        },
        {
          name: "artist_id",
          type: glue.Schema.INTEGER,
        },
        {
          name: "title",
          type: glue.Schema.STRING,
        },
      ],
    })
  }
}
