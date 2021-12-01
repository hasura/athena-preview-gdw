import fetch from "cross-fetch"
import { HASURA_ENDPOINT } from "./env"
import type * as Types from "./types"

export async function replaceHasuraMetadata(metadata: Record<string, any>) {
  return fetch(HASURA_ENDPOINT + "/v1/metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "replace_metadata",
      args: {
        metadata,
      },
    }),
  })
}

interface AthenaSQLDemoUserTableSchema {
  userid: number
  username: string
  firstname: string
  lastname: string
  // These can be nullable
  city?: string
  state?: string
  email?: string
  phone?: string
}

export const athenaExampleSchema: Types.Schema = {
  capabilities: {
    relationships: true,
  },
  tables: [
    {
      name: "artists",
      primary_key: "id",
      columns: [
        {
          name: "id",
          type: "number",
          nullable: false,
        },
        {
          name: "name",
          type: "string",
          nullable: false,
        },
      ],
    },
    {
      name: "albums",
      primary_key: "id",
      columns: [
        {
          name: "id",
          type: "number",
          nullable: false,
        },
        {
          name: "artist_id",
          type: "number",
          nullable: false,
        },
        {
          name: "title",
          type: "string",
          nullable: false,
        },
      ],
    },
    {
      name: "allusers_pipe_view",
      primary_key: "userid",
      columns: [
        {
          name: "userid",
          type: "number",
          nullable: false,
        },
        {
          name: "username",
          type: "string",
          nullable: false,
        },
        {
          name: "state",
          type: "string",
          nullable: true,
        },
        {
          name: "email",
          type: "string",
          nullable: true,
        },
      ],
    },
  ],
}
