export interface Schema {
  capabilities: Capabilities
  tables: Table[]
}

export interface Capabilities {
  relationships: boolean
}

export interface Table {
  name: string
  columns: Column[]
  primary_key?: string
  description?: string
}

export interface Column {
  name: string
  type: ScalarType
  nullable: boolean
  description?: string
}

export type ScalarType = "string" | "number" | "bool"

export interface Query {
  from: string
  where: Expression | null
  order_by: Ordering[]
  limit: number | null
  offset: number | null
  fields: {
    [k: string]: Field
  }
}

export enum FieldType {
  COLUMN = "column",
  RELATIONSHIP = "relationship",
}

export type Field = FieldColumn | FieldRelationship

export interface FieldColumn {
  type: FieldType.COLUMN
  column: string
}

export interface FieldRelationship {
  type: FieldType.RELATIONSHIP
  query: Query
  column_mapping: {
    [k: string]: string
  }
}

export interface Ordering {
  field: string
  order_type: OrderType
}

export enum OrderType {
  ASC = "asc",
  DESC = "desc",
}

export type Value = string | number | boolean | null

export type Expression =
  | LiteralExpression
  | AndExpression
  | OrExpression
  | NotExpression
  | IsNullExpression
  | IsNotNullExpression
  | ColumnExpression
  | EqualExpression
  | NotEqualExpression
  | ComparisonOpExpression
  | InExpression

export enum ExpressionType {
  LITERAL = "literal",
  AND = "and",
  OR = "or",
  NOT = "not",
  IS_NULL = "is_null",
  IS_NOT_NULL = "is_not_null",
  COLUMN = "column",
  EQUAL = "equal",
  NOT_EQUAL = "not_equal",
  COMPARISON_OP = "op",
  IN = "in",
}

export interface LiteralExpression {
  type: ExpressionType.LITERAL
  value: Value
}

export interface AndExpression {
  type: ExpressionType.AND
  expressions: Expression[]
}

export interface OrExpression {
  type: ExpressionType.OR
  expressions: Expression[]
}

export interface NotExpression {
  type: ExpressionType.NOT
  expression: Expression
}

export interface IsNullExpression {
  type: ExpressionType.IS_NULL
  expression: Expression
}

export interface IsNotNullExpression {
  type: ExpressionType.IS_NOT_NULL
  expression: Expression
}

export interface ColumnExpression {
  type: ExpressionType.COLUMN
  column: string
}

export interface EqualExpression {
  type: ExpressionType.EQUAL
  left: Expression
  right: Expression
}

export interface NotEqualExpression {
  type: ExpressionType.NOT_EQUAL
  left: Expression
  right: Expression
}

export interface ComparisonOpExpression {
  type: ExpressionType.COMPARISON_OP
  operator: ComparisonOp
  left: Expression
  right: Expression
}

export interface InExpression {
  type: ExpressionType.IN
  values: Value[]
  expression: Expression
}

export enum ComparisonOp {
  LT = "less_than",
  LTE = "less_than_or_equal",
  GT = "greater_than",
  GTE = "greater_than_or_equal",
}
