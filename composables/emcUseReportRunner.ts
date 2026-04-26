export function emcUseReportRunner() {
  async function runReport(
    payload: {
      screenId: string
      reportName?: string
      format?: string
      selectedColumns?: string[]
    }
  ) {
    const title =
      payload.reportName ||
      payload.screenId

    const win =
      window.open("", "_blank")

    if (!win) {
      alert(
        "Please allow popups"
      )
      return
    }

    win.document.write(`
      <html>
        <body style="
          font-family:Arial;
          display:flex;
          justify-content:center;
          align-items:center;
          height:100vh;
        ">
          <div>
            <h2>
              Generating Report
            </h2>
            <div>${title}</div>
          </div>
        </body>
      </html>
    `)

    try {
      const html = await $fetch(
        "/api/report/emcGenericReport",
        {
          method: "POST",
          body: payload
        }
      )

      win.document.open()
      win.document.write(
        html as string
      )
      win.document.close()

    } catch (err: any) {
      win.document.open()
      win.document.write(`
        <h2>Error</h2>
        <p>
          ${err?.message ||
        "Failed"
        }
        </p>
      `)
      win.document.close()
    }
  }

  return {
    runReport
  }
}
