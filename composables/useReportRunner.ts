export function useReportRunner() {
  async function runReport(options: {
    reportId: string
    reportName?: string
    params?: any
    output?: string
  }) {
    const reportName =
      options.reportName ||
      options.reportId

    const win = window.open("", "_blank")

    if (!win) {
      throw new Error(
        "Popup blocked. Please allow popups."
      )
    }

    // Loading Screen
    win.document.write(`
      <html>
        <head>
          <title>${reportName}</title>

          <style>
            body{
              margin:0;
              font-family:Arial,sans-serif;
              background:#f8f9fa;
              display:flex;
              justify-content:center;
              align-items:center;
              height:100vh;
            }

            .box{
              text-align:center;
              background:white;
              padding:32px;
              border-radius:12px;
              box-shadow:0 4px 14px rgba(0,0,0,.12);
              min-width:320px;
            }

            .spinner{
              width:52px;
              height:52px;
              border:4px solid #ddd;
              border-top:4px solid #1976d2;
              border-radius:50%;
              animation:spin 1s linear infinite;
              margin:0 auto 18px;
            }

            h2{
              margin:0 0 8px;
              font-size:22px;
            }

            p{
              margin:6px 0;
              color:#666;
            }

            @keyframes spin{
              100%{
                transform:rotate(360deg);
              }
            }
          </style>
        </head>

        <body>
          <div class="box">
            <div class="spinner"></div>
            <h2>Generating Report</h2>
            <p><strong>${reportName}</strong></p>
            <p>Please wait...</p>
          </div>
        </body>
      </html>
    `)

    try {
      const response = await $fetch(
        "/api/report/emcRunReport",
        {
          method: "POST",
          body: {
            reportId: options.reportId,
            params: options.params || {},
            output:
              options.output || "HTML"
          },
          responseType:
            options.output === "PDF"
              ? "blob"
              : "text"
        }
      )

      // PDF Mode
      if (options.output === "PDF") {
        const blob = new Blob(
          [response as BlobPart],
          {
            type: "application/pdf"
          }
        )

        const url =
          URL.createObjectURL(blob)

        win.location.href = url
        return
      }

      // HTML Mode
      win.document.open()
      win.document.write(
        response as string
      )
      win.document.close()

    } catch (err: any) {
      win.document.open()
      win.document.write(`
        <html>
          <body style="
            font-family:Arial;
            padding:40px;
          ">
            <h2>Failed to generate report</h2>
            <p>${err?.message ||
        "Unknown error"
        }</p>
          </body>
        </html>
      `)
      win.document.close()
    }
  }

  return {
    runReport
  }
}
