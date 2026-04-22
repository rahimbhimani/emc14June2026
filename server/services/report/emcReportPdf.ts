import { chromium } from "playwright"

export async function htmlToPdf(
  html: string
) {
  const browser = await chromium.launch()

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: "networkidle"
  })

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      right: "10mm",
      bottom: "10mm",
      left: "10mm"
    }
  })

  await browser.close()

  return pdf
}
