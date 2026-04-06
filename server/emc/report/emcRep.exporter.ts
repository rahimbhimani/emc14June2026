// import * as puppeteer from "puppeteer"
import * as XLSX from "xlsx"

// 🔹 PDF Export
export async function exportPDF(html: string) {
  // const browser = await puppeteer.launch({ headless: "new" })
  // const page = await browser.newPage()

  // await page.setContent(html, { waitUntil: "networkidle0" })

  // const pdf = await page.pdf({
  //   format: "A4",
  //   printBackground: true
  // })

  // await browser.close()

  // return pdf

  throw new Error("PDF disabled temporarily")
}

// 🔹 Excel Export
export function exportExcel(data: any[]) {
  const flat = data.map(container => {
    return {
      Container: container.label,
      Seal: container.seals?.[0]?.sealNumber,
      Compliance: container.compliance?.status,
      TotalWeight: container.totalWeight,
      TotalPieces: container.totalPieces
    }
  })

  const ws = XLSX.utils.json_to_sheet(flat)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, "BCL")

  return XLSX.write(wb, { type: "buffer" })
}
