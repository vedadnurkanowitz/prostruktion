"use server";

import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface InvoiceEmailData {
  projectName: string;
  projectAddress?: string;
  partnerName?: string;
  mediatorName?: string;
  contractorName?: string;
  subcontractorName?: string;
  projectValue: number;
  qualityBonus: number;
  quantityBonus: number;
  partnerShare: number;
  mediatorShare: number;
  subcontractorFee: number;
  prostruktionFee: number;
  invoiceDate: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  const recipientEmail = "mihmic.adnan@gmail.com";

  // Build a professional HTML invoice
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .invoice { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
        .logo span { color: #f59e0b; }
        .meta { color: #666; font-size: 14px; margin-top: 10px; }
        h2 { color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f9f9f9; font-weight: 600; color: #333; }
        .amount { text-align: right; font-family: monospace; }
        .total-row { background: #fef3c7; font-weight: bold; }
        .total-row td { border-top: 2px solid #f59e0b; }
        .section { margin: 20px 0; }
        .section-title { font-weight: 600; color: #333; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { padding: 8px 0; }
        .info-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .info-value { font-size: 14px; color: #1a1a1a; font-weight: 500; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
        .highlight { color: #f59e0b; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="logo">PRO<span>STRUKTION</span></div>
          <div class="meta">Invoice Date: ${data.invoiceDate}</div>
        </div>

        <h2>Project Invoice</h2>

        <div class="section">
          <div class="section-title">Project Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Project</div>
              <div class="info-value">${data.projectName}</div>
            </div>
            ${
              data.projectAddress
                ? `
            <div class="info-item">
              <div class="info-label">Address</div>
              <div class="info-value">${data.projectAddress}</div>
            </div>
            `
                : ""
            }
            ${
              data.contractorName
                ? `
            <div class="info-item">
              <div class="info-label">Contractor</div>
              <div class="info-value">${data.contractorName}</div>
            </div>
            `
                : ""
            }
            ${
              data.partnerName
                ? `
            <div class="info-item">
              <div class="info-label">Partner</div>
              <div class="info-value">${data.partnerName}</div>
            </div>
            `
                : ""
            }
            ${
              data.mediatorName
                ? `
            <div class="info-item">
              <div class="info-label">Mediator</div>
              <div class="info-value">${data.mediatorName}</div>
            </div>
            `
                : ""
            }
            ${
              data.subcontractorName
                ? `
            <div class="info-item">
              <div class="info-label">Subcontractor</div>
              <div class="info-value">${data.subcontractorName}</div>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Breakdown</div>
          <table>
            <tr>
              <th>Description</th>
              <th class="amount">Amount (EUR)</th>
            </tr>
            <tr>
              <td>Project Value</td>
              <td class="amount">€ ${data.projectValue.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
            ${
              data.qualityBonus > 0
                ? `
            <tr>
              <td>Quality Bonus</td>
              <td class="amount highlight">+ € ${data.qualityBonus.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
            `
                : ""
            }
            ${
              data.quantityBonus > 0
                ? `
            <tr>
              <td>Quantity Bonus</td>
              <td class="amount highlight">+ € ${data.quantityBonus.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td>Partner Share</td>
              <td class="amount">€ ${data.partnerShare.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
            ${
              data.mediatorShare > 0
                ? `
            <tr>
              <td>Mediator Share</td>
              <td class="amount">€ ${data.mediatorShare.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
            `
                : ""
            }
            ${
              data.subcontractorFee > 0
                ? `
            <tr>
              <td>Subcontractor Fee</td>
              <td class="amount">€ ${data.subcontractorFee.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td>Prostruktion Fee</td>
              <td class="amount">€ ${data.prostruktionFee.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>This is an automated invoice from Prostruktion Project Management System.</p>
          <p>© ${new Date().getFullYear()} Prostruktion. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: "Prostruktion <invoices@prostruktion.com>",
      to: [recipientEmail],
      subject: `Invoice - ${data.projectName} - ${data.invoiceDate}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", emailResult);
    return { success: true, id: emailResult?.id };
  } catch (error: any) {
    console.error("Email send exception:", error);
    return { success: false, error: error.message };
  }
}
