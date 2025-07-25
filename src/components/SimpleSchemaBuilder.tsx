import  { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { SchemaField, FieldType } from "@/types/schema";
import { generateId } from "@/lib/utils";

interface FieldRowProps {
  field: SchemaField;
  onUpdate: (field: SchemaField) => void;
  onDelete: () => void;
  onAddNested: (parentId: string) => void;
  canDelete: boolean;
  level?: number;
  hasSiblings?: boolean;
}

function FieldRow({ field, onUpdate, onDelete, onAddNested, canDelete, level = 0, hasSiblings = false }: FieldRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const isNested = field.type === "nested";

  const handleKeyChange = (key: string) => {
    onUpdate({ ...field, key });
  };

  const handleTypeChange = (type: FieldType) => {
    const updatedField: SchemaField = {
      ...field,
      type,
      children: type === "nested" ? field.children || [] : undefined,
      value: type === "nested" ? undefined : type === "string" ? "string" : "number"
    };
    onUpdate(updatedField);
  };

  const handleNestedUpdate = (updatedChild: SchemaField) => {
    const updatedChildren = field.children?.map(child => 
      child.id === updatedChild.id ? updatedChild : child
    ) || [];
    onUpdate({ ...field, children: updatedChildren });
  };

  const handleNestedDelete = (childId: string) => {
    const updatedChildren = field.children?.filter(child => child.id !== childId) || [];
    onUpdate({ ...field, children: updatedChildren });
  };

  const marginLeft = level * 20;

  return (
    <div className="relative">
              {/* Vertical line for nesting  showing the nested json*/}
        {level > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-border"
            style={{ 
              left: `${marginLeft - 10}px`,
              height: '100%'
            }}
          />
        )}
      
      <div style={{ marginLeft: `${marginLeft}px` }} className="mb-2">
        {/* Main field row */}
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md relative">
          {/* Horizontal connector line */}
          {level > 0 && (
            <div 
              className="absolute left-0 top-1/2 w-2 h-px bg-border transform -translate-y-1/2"
              style={{ left: '-10px' }}
            />
          )}
          
          {isNested && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          <Input
            placeholder="field name"
            value={field.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="flex-1 h-8 text-sm bg-background"
          />

          <Select value={field.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">string</SelectItem>
              <SelectItem value="number">number</SelectItem>
              <SelectItem value="nested">nested</SelectItem>
            </SelectContent>
          </Select>

          {/* <Switch 
            checked={isEnabled} 
            onCheckedChange={setIsEnabled}
            className="scale-75"
          /> */}

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="p-1 h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Nested children */}
        {isNested && isExpanded && (
          <div className="mt-2 relative">
            {/* Vertical line extending from parent to children */}
            {field.children && field.children.length > 0 && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 bg-border"
                style={{ 
                  left: `${marginLeft + 10}px`,
                  height: '100%'
                }}
              />
            )}
            
            {field.children?.map((child, index) => (
              <FieldRow
                key={child.id}
                field={child}
                onUpdate={handleNestedUpdate}
                onDelete={() => handleNestedDelete(child.id)}
                onAddNested={onAddNested}
                canDelete={true}
                level={level + 1}
                hasSiblings={field.children && field.children.length > 1}
              />
            ))}
            
            <div style={{ marginLeft: `${(level + 1) * 20}px` }} className="mt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onAddNested(field.id)}
                className="w-full h-8 text-sm bg-primary text-primary-foreground"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SimpleSchemaBuilder() {
  const [fields, setFields] = useState<SchemaField[]>([
    
  ]);

  const addField = () => {
    const newField: SchemaField = {
      id: generateId(),
      key: "",
      type: "string",
      value: "string"
    };
    setFields([...fields, newField]);
  };

  const updateField = (updatedField: SchemaField) => {
    setFields(fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    ));
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const addNestedField = (parentId: string) => {
    const addToParent = (fieldsList: SchemaField[]): SchemaField[] => {
      return fieldsList.map(field => {
        if (field.id === parentId) {
          const newChild: SchemaField = {
            id: generateId(),
            key: "",
            type: "string",
            value: "string"
          };
          return {
            ...field,
            children: [...(field.children || []), newChild]
          };
        }
        if (field.children) {
          return {
            ...field,
            children: addToParent(field.children)
          };
        }
        return field;
      });
    };

    setFields(addToParent(fields));
  };

  const generateJson = (fieldsList: SchemaField[]): Record<string, any> => {
    const result: Record<string, any> = {};
    
    fieldsList.forEach(field => {
      if (!field.key) return;
      
      if (field.type === "nested" && field.children) {
        result[field.key] = generateJson(field.children);
      } else {
        result[field.key] = field.value || (field.type === "number" ? "number" : "string");
      }
    });
    
    return result;
  };

  const downloadJsonFile = () => {
    const jsonData = generateJson(fields);
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            JSON Schema Builder
          </h1>
          <p className="text-sm text-muted-foreground">
            Create dynamic JSON schemas with nested fields
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Schema Builder */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Schema Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onUpdate={updateField}
                  onDelete={() => deleteField(field.id)}
                  onAddNested={addNestedField}
                  canDelete={fields.length > 1}
                />
              ))}

              <Button
                variant="default"
                onClick={addField}
                className="w-full h-8 text-sm bg-primary text-primary-foreground mt-4"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Right side - JSON Preview */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">JSON Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap overflow-auto">
                  <code>{JSON.stringify(generateJson(fields), null, 2)}</code>
                </pre>
              </div>
              
              <Button
                variant="default"
                onClick={downloadJsonFile}
                className="w-full h-10 text-sm bg-green-600 hover:bg-green-700 text-white"
                disabled={fields.length === 0 || fields.every(field => !field.key)}
              >
                Download JSON File
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}