import { z } from "zod";

export function useValidator() {

  const errors = reactive<Record<string, string[]>>({})


function buildZodSchema2510(def: any): any {
  // Handle primitive types first
  if (def.type === "string" || def.min !== undefined || def.max !== undefined) {
    let schema = z.string();
    if (def.min) schema = schema.min(def.min, def.message);
    if (def.max) schema = schema.max(def.max, def.message);
    if (!def.required) schema = schema.optional();
    return schema;
  }

  if (def.type === "number") {
    let schema = z.number();
    if (def.min) schema = schema.min(def.min, def.message);
    if (def.max) schema = schema.max(def.max, def.message);
    if (!def.required) schema = schema.optional();
    return schema;
  }

  if (def.type === "Array") {
    // collect child fields
    const childKeys = Object.keys(def).filter(k => !["type", "required"].includes(k));
    const childSchema = z.object(
      childKeys.reduce((acc: any, key) => {
        acc[key] = buildZodSchema(def[key]);
        return acc;
      }, {})
    ).passthrough();

    let schema = z.array(childSchema);
    if (def.required) schema = schema.nonempty("Array is required");
    return schema;
  }

  if (def.type === "boolean") {
    let schema = z.boolean();
    if (!def.required) schema = schema.optional();
    return schema;
  }

  // Handle objects recursively
  if (typeof def === "object") {
    const shape: Record<string, any> = {};

    for (const key in def) {
      if (["required", "type", "min", "max", "message"].includes(key)) continue;
      shape[key] = buildZodSchema(def[key]);
    }

    // let schema = z.union([z.object(shape), z.null()])
    let schema = z.object(shape)

  if (def.required) {
    debugger
    schema = schema
      .refine(val => val !== null && val !== undefined && val !== '', {
        message: "Data missing",
      })
      .refine(val => val !== null && typeof val === "object" && Object.keys(val).length > 0, {
        message: "Invalid data",
      });

  } else {
    schema = schema.nullable();

  }

    // if (def.required === false) schema = schema.optional();
    return schema;
  }

  // fallback
  return z.any();
}


function buildZodSchema(def: any): any {
  // If explicitly ignored
  if (def?.ignore === true) {
    return z.any(); // keep key, skip validation
  }

  // Detect if this node has children (non-meta keys)
  const hasChildren =
    typeof def === "object" &&
    Object.keys(def).some(
      k => !["required", "type", "min", "max", "message", "ignore"].includes(k)
    );

  // Default type to string ONLY if not structural
  if (!def?.type && !hasChildren) {
    def.type = "string";
  }

  // ---- Primitive types ----
  if (def.type === "string" || def.min !== undefined || def.max !== undefined) {
    let schema = z.string();
    if (def.min) schema = schema.min(def.min, def.message);
    if (def.max) schema = schema.max(def.max, def.message);
    if (!def.required) schema = schema.optional();
    return schema;
  }

  if (def.type === "number") {
    let schema = z.number();
    if (def.min) schema = schema.min(def.min, def.message);
    if (def.max) schema = schema.max(def.max, def.message);
    if (!def.required) schema = schema.optional();
    return schema;
  }

  if (def.type === "Array") {
    const childKeys = Object.keys(def).filter(k => !["type", "required", "ignore"].includes(k));
    const childSchema = z
      .object(
        childKeys.reduce((acc: any, key) => {
          acc[key] = buildZodSchema(def[key]);
          return acc;
        }, {})
      )
      .passthrough();

    let schema = z.array(childSchema);
    if (def.required) schema = schema.nonempty("Array is required");
    return schema;
  }

  if (def.type === "boolean") {
    let schema = z.boolean();
    if (!def.required) schema = schema.optional();
    return schema;
  }

  // ---- Objects ----
  if (typeof def === "object") {
    const shape: Record<string, any> = {};

    for (const key in def) {
      if (["required", "type", "min", "max", "message", "ignore"].includes(key)) continue;
      const subSchema = buildZodSchema(def[key]);
      if (subSchema) shape[key] = subSchema;
    }

    let schema = z.object(shape).passthrough();

    if (def.required) {
      schema = schema
        .refine(val => val !== null && val !== undefined && val !== '', {
          message: "Data missing",
        })
        .refine(val => typeof val === "object" && Object.keys(val).length > 0, {
          message: "Invalid data",
        });
    } else {
      schema = schema.nullable();
    }
    return schema;
  }

  // ---- Fallback ----
  return z.any();
}


function getSchemaAtPath(schema: any, path: string) {
      return path.split(".").reduce((acc, key) => {
        if (!acc) return undefined;
        if (acc.unwrap) acc = acc.unwrap(); // handle optional()
        return acc.shape?.[key];
      }, schema);
  }

function validateField(schema: any, path: string) {
  return (value: any) => {
    console.log('validateFormSchema1', schema, 'validateFormdata1.1', path, 'validateFormdata1.2', value)

    const fieldSchema = getSchemaAtPath(schema, path)
    console.log('validateFormSchema3', fieldSchema,'validateFormSchema3.1', typeof(fieldSchema))

    if (!fieldSchema) return true

    // Convert "" to undefined for optional fields
    const inputValue = value === '' ? undefined : value
    const result = fieldSchema.safeParse(inputValue)
    console.log('validateFormSchema4', result)

    if (result.success) {
      // Clear existing errors for this path
      errors[path] = []
      return true
    } else {
      // Store all error messages for this field
      errors[path] = result.error.issues.map(e => e.message)
      console.log("result ValidateField5", errors[path])
      return false
    }
  }
}


  // function validateField(schema: any, path: string) {
  //   debugger
  //   console.log('validateFormSchema1', schema, 'validateFormdata', path)
  //   return (value: any) => {
  //     console.log('validateFormSchema2',value)
  //     const fieldSchema = getSchemaAtPath(schema, path)
  //     console.log('validateFormSchema3',fieldSchema)
  //     if (!fieldSchema) return true
  //     const result = fieldSchema.safeParse(value === '' ? undefined : value)
  //     console.log('validateFormSchema4',result)
  //     if (result.success) {
  //       if (errors[path]) {
  //         errors[path] = []
  //       }
  //       return true;
  //     }
  //     console.log("result ValidateField5", result)
  //     errors[path] = result.error.issues.map(e => e.message)
  //     // result.error.issues[path] = result.error.issues.map(e => e.message)
  //     result.error.issues.map(e => e.message).join(", ")
  //   }
  // }

  function clearErrors() {
    debugger
    // alert('rahim')
    Object.keys(errors).forEach(key => delete errors[key])
    // errors = reactive({})
  }

  function validateData(schema: any, data: any) {
    return schema.safeParse(data)
  }


  function validateForm(schema: any, data: any) {
    try {
      debugger
      console.log('validateFormSchema', schema, 'validateFormdata', data)
      // alert('rahim start')
    const result = schema.safeParse(data)
    console.log('result.error.issues', result)
    if (!result.success) {
      result.error.issues.forEach(err => {
        const fieldName = err.path.join(".")
        console.log('fieldName', fieldName, 'err.message', err.message)
        errors[fieldName] = errors[fieldName] || []
        errors[fieldName].push(err.message)
      })
    }
    return result.success
    } catch (error) {
      console.log('InsideErrrorvalidateForm', error)
      // alert(error)
    }
  }

  return { buildZodSchema, validateField, validateData, validateForm, errors, clearErrors };
}
