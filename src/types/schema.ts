export type FieldType = "string" | "number" | "nested";

export interface SchemaField {
  id: string;
  key: string;
  type: FieldType;
  value?: string | number;
  children?: SchemaField[];
}

export interface SchemaFormData {
  fields: SchemaField[];
}