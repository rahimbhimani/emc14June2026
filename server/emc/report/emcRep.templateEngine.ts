import fs from "fs"
import * as Handlebars from "handlebars"
import path from "path"

export function renderTemplate(templateName: string, data: any) {
  const filePath = path.join(
    process.cwd(),
    "server",
    "emc",
    "report",
    "templates",
    `${templateName}.html`
  )

  const source = fs.readFileSync(filePath, "utf-8")

  return Handlebars.compile(source)(data)
}
