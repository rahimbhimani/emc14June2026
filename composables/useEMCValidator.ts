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
        //debugger
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


  // function buildZodSchema(def: any): any {
  //   // If explicitly ignored
  //   if (def?.ignore === true) {
  //     // alert(def?.type)
  //     return z.any().optional().nullable(); // keep key, skip validation
  //   }

  //   // Detect if this node has children (non-meta keys)
  //   const hasChildren =
  //     typeof def === "object" &&
  //     Object.keys(def).some(
  //       k => !["required", "type", "min", "max", "message", "ignore"].includes(k)
  //     );

  //   // Default type to string ONLY if not structural
  //   if (!def?.type && !hasChildren) {
  //     def.type = "string";
  //   }

  //   // ---- Primitive types ----
  //   // z.any() base ensures .refine() always executes in Zod v4 (optional() short-circuits for undefined)
  //   if (def.type === "string" || def.min !== undefined || def.max !== undefined) {
  //     const msg = def.message || "This field is required"
  //     let schema: any = z.any()

  //     if (def.required) {
  //       schema = schema.refine(
  //         (val: any) => val !== null && val !== undefined && val !== '',
  //         { message: msg }
  //       )
  //     }
  //     if (def.min !== undefined) {
  //       schema = schema.refine(
  //         (val: any) => val == null || val === '' || String(val).length >= def.min,
  //         { message: def.message || `Minimum ${def.min} characters required` }
  //       )
  //     }
  //     if (def.max !== undefined) {
  //       schema = schema.refine(
  //         (val: any) => val == null || val === '' || String(val).length <= def.max,
  //         { message: def.message || `Maximum ${def.max} characters allowed` }
  //       )
  //     }
  //     return schema
  //   }

  //   if (def.type === "number") {
  //     const msg = def.message || "This field is required"
  //     let schema: any = z.any()
  //     if (def.required) {
  //       schema = schema.refine(
  //         (val: any) => val !== null && val !== undefined,
  //         { message: msg }
  //       )
  //     }
  //     if (def.min !== undefined) {
  //       schema = schema.refine(
  //         (val: any) => val == null || val >= def.min,
  //         { message: def.message || `Minimum value is ${def.min}` }
  //       )
  //     }
  //     if (def.max !== undefined) {
  //       schema = schema.refine(
  //         (val: any) => val == null || val <= def.max,
  //         { message: def.message || `Maximum value is ${def.max}` }
  //       )
  //     }
  //     return schema
  //   }

  //   if (def.type === "Array") {
  //     const childKeys = Object.keys(def).filter(k => !["type", "required", "ignore"].includes(k));
  //     const childSchema = z
  //       .object(
  //         childKeys.reduce((acc: any, key) => {
  //           acc[key] = buildZodSchema(def[key]);
  //           return acc;
  //         }, {})
  //       )
  //       .passthrough();

  //     let schema = z.array(childSchema);
  //     if (def.required) schema = schema.nonempty("Array is required");
  //     return schema;
  //   }

  //   if (def.type === "boolean") {
  //     let schema = z.boolean();
  //     if (!def.required) schema = schema.optional();
  //     return schema;
  //   }

  //   // ---- Explicit object fields (e.g. dropdown return value) ----
  //   // Use z.any() so refines always run for undefined in Zod v4
  //   if (def.type === "object") {
  //     let schema: any = z.any()
  //     if (def.required) {
  //       schema = schema
  //         .refine((val: any) => val !== null && val !== undefined, {
  //           message: def.message || "This field is required",
  //         })
  //         .refine((val: any) => val == null || (typeof val === "object" && Object.keys(val).length > 0), {
  //           message: "Invalid data",
  //         })
  //     }
  //     return schema
  //   }

  //   // ---- Structural objects (root form definition — no explicit type) ----
  //   // Keeps z.object(shape) so getSchemaAtPath can navigate into field schemas
  //   if (typeof def === "object") {
  //     const shape: Record<string, any> = {};

  //     for (const key in def) {
  //       if (["required", "type", "min", "max", "message", "ignore"].includes(key)) continue;
  //       const subSchema = buildZodSchema(def[key]);
  //       if (subSchema) shape[key] = subSchema;
  //     }

  //     let schema: any = z.object(shape).passthrough().nullable().optional();

  //     if (def.required) {
  //       schema = schema
  //         .refine((val: any) => val !== null && val !== undefined, {
  //           message: def.message || "This field is required",
  //         })
  //         .refine((val: any) => val == null || (typeof val === "object" && Object.keys(val).length > 0), {
  //           message: "Invalid data",
  //         });
  //     }
  //     return schema;
  //   }

  //   // ---- Fallback ----
  //   return z.any();
  // }

  function buildZodSchema(def: any): any {

    // Ignore field
    if (def?.ignore === true) {
      return z.any().optional().nullable();
    }

    // Determine if this is a structural node
    const hasChildren =
      typeof def === "object" &&
      def !== null &&
      Object.keys(def).some(
        k =>
          ![
            "required",
            "type",
            "min",
            "max",
            "message",
            "ignore"
          ].includes(k)
      );

    // -------------------------
    // STRING
    // -------------------------
    console.log('def.type', def?.type)
    if (def?.type === "string") {

      let schema: any = z.string({
        message: def.message || "This field is required"
      });

      if (def.min !== undefined) {
        schema = schema.min(
          def.min,
          def.message || `Minimum ${def.min} characters required`
        );
      }

      if (def.max !== undefined) {
        schema = schema.max(
          def.max,
          def.message || `Maximum ${def.max} characters allowed`
        );
      }

      if (!def.required) {
        schema = schema.optional().nullable();
      }

      return schema;
    }

    // -------------------------
    // NUMBER
    // -------------------------

    if (def?.type === "number") {

      let schema: any = z.number({
        message: def.message || "This field is required"
      });

      if (def.min !== undefined) {
        schema = schema.min(
          def.min,
          def.message || `Minimum value is ${def.min}`
        );
      }

      if (def.max !== undefined) {
        schema = schema.max(
          def.max,
          def.message || `Maximum value is ${def.max}`
        );
      }

      if (!def.required) {
        schema = schema.optional().nullable();
      }

      return schema;
    }

    // -------------------------
    // BOOLEAN
    // -------------------------

    if (def?.type === "boolean") {

      let schema: any = z.boolean();

      if (!def.required) {
        schema = schema.optional().nullable();
      }

      return schema;
    }

    // -------------------------
    // OBJECT (Dropdown / Lookup)
    // -------------------------

    if (def?.type === "object") {

      if (def.lookup === true) {

        let schema = z.any()

        if (def.required) {

          schema = schema.refine(
            val => !!val?._id,
            {
              message: def.message || "This field is required"
            }
          )

        } else {

          schema = schema.optional().nullable()

        }

        return schema
      }

      const childKeys = Object.keys(def).filter(
        k =>
          ![
            "type",
            "required",
            "message",
            "ignore"
          ].includes(k)
      )

      // Lookup object
      if (childKeys.length === 0) {

        let schema: any = z.object({}).passthrough()

        if (def.required) {
          schema = schema.refine(
            val => val !== null && val !== undefined,
            {
              message: def.message || "This field is required"
            }
          )
        } else {
          schema = schema.optional().nullable()
        }

        return schema
      }

      // Structural object
      const shape: Record<string, any> = {}

      childKeys.forEach(key => {
        shape[key] = buildZodSchema(def[key])
      })

      let schema: any = z.object(shape).passthrough()

      if (!def.required)
        schema = schema.optional().nullable()

      return schema
    }

    // -------------------------
    // ARRAY
    // -------------------------

    if (def?.type === "Array") {

      const childShape: Record<string, any> = {};

      Object.keys(def).forEach(key => {

        if (
          [
            "type",
            "required",
            "message",
            "ignore"
          ].includes(key)
        ) {
          return;
        }

        childShape[key] = buildZodSchema(def[key]);

      });

      let schema: any = z.array(
        z.object(childShape).passthrough()
      );

      if (def.required) {
        schema = schema.min(
          1,
          def.message || "At least one record is required"
        );
      } else {
        schema = schema.optional().nullable();
      }

      return schema;
    }

    // -------------------------
    // STRUCTURAL OBJECT
    // -------------------------

    if (hasChildren) {

      const shape: Record<string, any> = {};

      Object.keys(def).forEach(key => {

        if (
          [
            "required",
            "type",
            "min",
            "max",
            "message",
            "ignore"
          ].includes(key)
        ) {
          return;
        }

        shape[key] = buildZodSchema(def[key]);

      });

      let schema: any = z.object(shape).passthrough();

      if (!def.required) {
        schema = schema.optional().nullable();
      }

      return schema;
    }

    // -------------------------
    // FALLBACK
    // -------------------------

    return z.any();
  }


  function getSchemaAtPath(schema: any, path: string) {
    return path.split(".").reduce((acc, key) => {
      if (!acc) return undefined;
      // Unwrap optional/nullable layers — handles both Zod v3 (.unwrap) and v4 (_def.innerType)
      let depth = 0
      while (depth++ < 10) {
        if (acc.shape) break
        if (typeof acc.unwrap === 'function') { acc = acc.unwrap(); continue }
        if (acc._def?.innerType) { acc = acc._def.innerType; continue }
        break
      }
      return acc.shape?.[key];
    }, schema);
  }

  function validateField(schema: any, path: string) {
    return (value: any) => {
      //console.log('validateFormSchema1', schema, 'validateFormdata1.1', path, 'validateFormdata1.2', value)

      const fieldSchema = getSchemaAtPath(schema, path)
      //console.log('validateFormSchema3', fieldSchema, 'validateFormSchema3.1', typeof (fieldSchema))

      if (!fieldSchema) return true

      // Convert "" and null to undefined so optional schemas pass cleanly
      const inputValue = (value === '' || value === null) ? undefined : value
      const result = fieldSchema.safeParse(inputValue)
      //console.log('validateFormSchema4', result)

      if (result.success) {
        // Clear existing errors for this path
        errors[path] = []
        return true
      } else {
        // Store all error messages for this field
        errors[path] = result.error.issues.map(e => e.message)
        //console.log("result ValidateField5", errors[path])
        return false
      }
    }
  }


  // function validateField(schema: any, path: string) {
  //   //debugger
  //   //console.log('validateFormSchema1', schema, 'validateFormdata', path)
  //   return (value: any) => {
  //     //console.log('validateFormSchema2',value)
  //     const fieldSchema = getSchemaAtPath(schema, path)
  //     //console.log('validateFormSchema3',fieldSchema)
  //     if (!fieldSchema) return true
  //     const result = fieldSchema.safeParse(value === '' ? undefined : value)
  //     //console.log('validateFormSchema4',result)
  //     if (result.success) {
  //       if (errors[path]) {
  //         errors[path] = []
  //       }
  //       return true;
  //     }
  //     //console.log("result ValidateField5", result)
  //     errors[path] = result.error.issues.map(e => e.message)
  //     // result.error.issues[path] = result.error.issues.map(e => e.message)
  //     result.error.issues.map(e => e.message).join(", ")
  //   }
  // }

  function clearErrors() {
    //debugger
    // alert('rahim')
    Object.keys(errors).forEach(key => delete errors[key])
    // errors = reactive({})
  }

  function validateData(schema: any, data: any) {
    return schema.safeParse(data)
  }


  function nullsToUndefined(obj: any): any {
    if (obj === null || obj === undefined) return undefined
    if (typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(nullsToUndefined)
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, nullsToUndefined(v)])
    )
  }

  // function validateForm(schema: any, data: any) {
  //   try {
  //     // Navigate to the underlying ZodObject shape
  //     // Zod v4 raises "expected nonoptional" at the object level for missing keys before
  //     // field-schema refines can run — so we iterate fields individually instead.
  //     let objectSchema: any = schema
  //     let depth = 0
  //     while (depth++ < 10) {
  //       if (objectSchema?.shape) break
  //       if (typeof objectSchema?.unwrap === 'function') { objectSchema = objectSchema.unwrap(); continue }
  //       if (objectSchema?._def?.innerType) { objectSchema = objectSchema._def.innerType; continue }
  //       break
  //     }

  //     if (!objectSchema?.shape) {
  //       // Fallback: direct parse (non-object schemas)
  //       const result = schema.safeParse(nullsToUndefined(data))
  //       if (!result.success) {
  //         result.error.issues.forEach((err: any) => {
  //           const fieldName = err.path.join(".")
  //           errors[fieldName] = errors[fieldName] || []
  //           errors[fieldName].push(err.message)
  //         })
  //       }
  //       return result.success
  //     }

  //     // Validate each field's schema directly — avoids Zod v4 object-level "nonoptional" errors
  //     const normalizedData: any = nullsToUndefined(data) || {}
  //     let isValid = true

  //     for (const fieldName in objectSchema.shape) {
  //       const fieldSchema = objectSchema.shape[fieldName]
  //       const value = normalizedData[fieldName]
  //       const result = fieldSchema.safeParse(value)
  //       if (!result.success) {
  //         isValid = false
  //         if (!errors[fieldName]) errors[fieldName] = []
  //         result.error.issues.forEach((issue: any) => {
  //           if (!errors[fieldName]!.includes(issue.message)) {
  //             errors[fieldName]!.push(issue.message)
  //           }
  //         })
  //       } else {
  //         // Clear stale errors for fields that now pass
  //         errors[fieldName] = []
  //       }
  //     }

  //     return isValid
  //   } catch (error) {
  //     console.log('InsideErrrorvalidateForm', error)
  //   }
  // }

  function validateForm(schema: any, data: any) {

    clearErrors()

    const result = schema.safeParse(
      nullsToUndefined(data)
    )

    console.log(
      "VALIDATION RESULT",
      JSON.stringify(result, null, 2)
    )

    if (!result.success) {

      console.log(
        "ISSUES",
        result.error.issues
      )

      result.error.issues.forEach((issue: any) => {

        const path = issue.path.join('.')

        if (!errors[path])
          errors[path] = []

        errors[path].push(issue.message)

      })

      return false
    }

    return true
  }

  return { buildZodSchema, validateField, validateData, validateForm, errors, clearErrors };
}
