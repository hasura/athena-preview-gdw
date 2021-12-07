import { athena } from "./aws-athena-sql"
import * as Types from "./types"
import { debug } from "./utils"

const toAthenaSQLFilter = (e: Types.Expression): string => {
  switch (e.type) {
    case Types.ExpressionType.AND: {
      const clauses = e.expressions.map(toAthenaSQLFilter).filter((it) => it != null && it != "")
      return clauses.length > 1 ? clauses.join(" AND ") : clauses.join("")
    }

    case Types.ExpressionType.OR: {
      const clauses = e.expressions.map(toAthenaSQLFilter).filter((it) => it != null && it != "")
      return clauses.length > 1 ? clauses.join(" OR ") : clauses.join("")
    }

    case Types.ExpressionType.NOT:
      return `NOT ${toAthenaSQLFilter(e.expression)}`

    case Types.ExpressionType.EQUAL:
      return `${toAthenaSQLFilter(e.left)} = ${toAthenaSQLFilter(e.right)}`

    case Types.ExpressionType.IN: {
      if (e.expression.type == Types.ExpressionType.COLUMN) {
        return e.expression.column + " IN (" + e.values.join(", ") + ")"
      }
      throw Error("the 'e.expression' provided for IN expression is not of type 'Column'")
    }

    case Types.ExpressionType.COLUMN:
      return e.column

    case Types.ExpressionType.LITERAL:
      switch (typeof e.value) {
        case "string":
          return `'${e.value}'`
        case "boolean":
          return e.value as any
        case "bigint":
        case "number":
          return Number(e.value) as any
        case "function":
        case "object":
        case "symbol":
        case "undefined":
          throw new Error(`Got invalid value type for ExpressionType.Literal. Expression.Value = ${e.value}`)
      }

    case Types.ExpressionType.NOT_EQUAL:
      return `${toAthenaSQLFilter(e.left)} != ${toAthenaSQLFilter(e.right)}`

    case Types.ExpressionType.IS_NULL:
      if (e.expression.type == Types.ExpressionType.COLUMN) {
        return `${e.expression.column} IS NULL`
      }
      throw Error("ExpressionType.IS_NULL but e.expression.type =! Types.ExpressionType.COLUMN")

    case Types.ExpressionType.IS_NOT_NULL:
      if (e.expression.type == Types.ExpressionType.COLUMN) {
        return `${e.expression.column} IS NOT NULL`
      }
      throw Error("ExpressionType.IS_NOT_NULL but e.expression.type =! Types.ExpressionType.COLUMN")

    case Types.ExpressionType.COMPARISON_OP:
      switch (e.operator) {
        case Types.ComparisonOp.GT:
          return `${toAthenaSQLFilter(e.left)} > ${toAthenaSQLFilter(e.right)}`
        case Types.ComparisonOp.GTE:
          return `${toAthenaSQLFilter(e.left)} >= ${toAthenaSQLFilter(e.right)}`
        case Types.ComparisonOp.LT:
          return `${toAthenaSQLFilter(e.left)} < ${toAthenaSQLFilter(e.right)}`
        case Types.ComparisonOp.LTE:
          return `${toAthenaSQLFilter(e.left)} <= ${toAthenaSQLFilter(e.right)}`
      }
  }
}

function getNamesForPlainColumnTypesFromFields(fields: Types.Query["fields"]): string[] {
  const columnNames = Object.entries(fields)
    .filter(([key, value]) => value.type == Types.FieldType.COLUMN)
    .map(([key, value]) => {
      switch (value.type) {
        case Types.FieldType.COLUMN: {
          return `${value.column} as ${key}`
        }
        case Types.FieldType.RELATIONSHIP: {
          debug("Got relationship field", key, value)
          return ""
        }
      }
    })

  debug({ columnNames })
  return columnNames
}

export async function fetchAthenaData(query: Types.Query) {
  debug("query:")
  debug(query)

  const { from, fields, limit, offset, where, order_by } = query
  const columns = getNamesForPlainColumnTypesFromFields(fields)

  // No semicolon in statement here, because it will be appended below in final query generation
  //prettier-ignore
  const baseQuery = `
  SELECT ${columns.join(", ")}
  FROM ${from}
    ${
    // Query with no "where: {}" still comes in as: "where: { expressions: [], type: 'and' }"
    where?.type && where.type == Types.ExpressionType.AND && where.expressions.length
      ? "WHERE " + toAthenaSQLFilter(where)
      : ""
    }
    ${order_by.length > 0
      ? "ORDER BY " + order_by.map((it) => `${it.field} ${it.order_type}`).join(", ")
      : ""
    }
  `

  /**
   * OFFSET SOLUTION:
   * https://stackoverflow.com/a/51322227
   */
  const sqlQuery = (() => {
    switch (true) {
      case offset != null && limit != null:
        return `
        SELECT * FROM (
          SELECT row_number() over() AS rn, *
          FROM (${baseQuery})
        )
        WHERE rn BETWEEN ${offset! + 1} AND ${offset! + limit!};
      `
      case offset != null && limit == null:
        return `
        SELECT * FROM (
          SELECT row_number() over() AS rn, *
          FROM (${baseQuery})
        )
        WHERE rn > ${offset};
        `
      default:
        return `
        ${baseQuery}
        ${limit ? "LIMIT " + limit : ""};
        `
    }
  })()

  debug("ATHENA SQL QUERY GENERATED:")
  debug("\t" + sqlQuery)

  try {
    const queryResults = await athena.query(sqlQuery)
    debug("ATHENA SQL QUERY RESULTS:")
    debug({ queryResults, items: queryResults.Items })
    // Get rid of the "rn" column, which will be present if "offset" or "limit" is used
    const itemsExcludingRowNumber = queryResults.Items?.map((it) => {
      const item = it as Record<string, any>
      if ("rn" in item) delete item["rn"]
      return item
    }) || []

    return itemsExcludingRowNumber

  } catch (e) {
    console.log("Error during query:", e)
    return []
  }
}
