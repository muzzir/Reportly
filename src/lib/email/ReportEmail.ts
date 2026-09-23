interface ReportEmailParams {
  agencyName: string;
  agencyLogoUrl: string | null;
  agencyColor: string;
  clientName: string;
  startDate: string;
  endDate: string;
  customMessage: string;
}

export function generateReportEmailHtml({
  agencyName,
  agencyLogoUrl,
  agencyColor,
  clientName,
  startDate,
  endDate,
  customMessage,
}: ReportEmailParams): string {
  const brandColor = agencyColor || "#0F172A";

  const messageParagraphs = customMessage
    ? customMessage
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((p) => `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #334155; font-size: 14px;">${p}</p>`)
        .join("")
    : `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #334155; font-size: 14px;">Please find attached your marketing performance overview report for the period of <strong>${startDate}</strong> to <strong>${endDate}</strong>.</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Performance Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner with Agency Brand Color Accent -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 24px 32px; text-align: left;">
              ${
                agencyLogoUrl
                  ? `<img src="${agencyLogoUrl}" alt="${agencyName}" style="max-height: 44px; max-width: 200px; object-contain: contain; vertical-align: middle;" />`
                  : `<span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${agencyName}</span>`
              }
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                Performance Report for ${clientName}
              </h1>

              <div style="margin-bottom: 24px;">
                ${messageParagraphs}
              </div>

              <!-- Report Details Summary Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Client Name</span>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${clientName}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Reporting Period</span>
                          <div style="font-size: 14px; font-weight: 500; color: #334155;">${startDate} – ${endDate}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Attachment Status</span>
                          <div style="font-size: 13px; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 4px;">
                            ✓ PDF Report Attached
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                If you have any questions regarding your marketing metrics or strategy, please feel free to reach out directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Sent on behalf of <strong>${agencyName}</strong> via <strong>Reportly</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
