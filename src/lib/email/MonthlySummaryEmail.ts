interface MonthlySummaryEmailParams {
  agencyName: string;
  agencyLogoUrl: string | null;
  agencyColor: string;
  clientName: string;
  startDate: string;
  endDate: string;
  kpis: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    cpa: number;
    ctr: number;
  };
  reportUrl: string;
}

export function generateMonthlySummaryEmailHtml({
  agencyName,
  agencyLogoUrl,
  agencyColor,
  clientName,
  startDate,
  endDate,
  kpis,
  reportUrl,
}: MonthlySummaryEmailParams): string {
  const brandColor = agencyColor || "#0F172A";

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("en-US").format(val);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Performance Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 24px 32px; text-align: left;">
              ${
                agencyLogoUrl
                  ? `<img src="${agencyLogoUrl}" alt="${agencyName}" style="max-height: 44px; max-width: 200px; object-contain: contain; vertical-align: middle;" />`
                  : `<span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${agencyName}</span>`
              }
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">
                Monthly Performance Overview
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                ${clientName} Executive Summary
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b;">
                Reporting Period: <strong>${startDate}</strong> to <strong>${endDate}</strong>
              </p>

              <!-- KPI Metrics Grid -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td width="50%" style="padding: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Total Spend</div>
                      <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${formatCurrency(kpis.totalSpend)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Conversions</div>
                      <div style="font-size: 18px; font-weight: 700; color: #059669;">${formatNumber(kpis.totalConversions)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Impressions</div>
                      <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${formatNumber(kpis.totalImpressions)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Clicks</div>
                      <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${formatNumber(kpis.totalClicks)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Cost Per Acquisition (CPA)</div>
                      <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${formatCurrency(kpis.cpa)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Click-Through Rate (CTR)</div>
                      <div style="font-size: 18px; font-weight: 700; color: #0f172a;">${kpis.ctr.toFixed(2)}%</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" target="_blank" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      View Full Interactive Report &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Automated Monthly Dispatch • Sent on behalf of <strong>${agencyName}</strong> via <strong>Reportly</strong>
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
