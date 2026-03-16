import { Injectable } from '@angular/core';
import { SettingService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReceiptService {

  constructor(private settingService: SettingService) {}

  async printReceipt(transaction: any) {
    // Ambil data info toko
    const res = await firstValueFrom(this.settingService.get());
    const store = res.data;

    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', sans-serif; padding: 32px; background: white; color: #1e293b; }
      .receipt { max-width: 720px; margin: 0 auto; }

      /* Header */
      .receipt-header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; }
      .store-name { font-size: 24px; font-weight: 700; color: #1e3a5f; }
      .store-info { font-size: 13px; color: #64748b; margin-top: 4px; line-height: 1.6; }
      .invoice-badge { display: inline-block; background: #1e3a5f; color: white; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }

      /* Meta */
      .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .meta-group { display: flex; flex-direction: column; gap: 4px; }
      .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
      .meta-value { font-size: 14px; font-weight: 600; color: #1e293b; }

      /* Table */
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead tr { background: #1e3a5f; color: white; }
      thead th { padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
      thead th:last-child { text-align: right; }
      tbody tr:nth-child(even) { background: #f8fafc; }
      tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
      tbody td:last-child { text-align: right; font-weight: 600; }
      .product-sku { font-size: 11px; color: #94a3b8; }

      /* Summary */
      .receipt-summary { margin-left: auto; width: 280px; }
      .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
      .summary-row.total { font-size: 16px; font-weight: 700; color: #1e3a5f; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 12px; margin-top: 4px; }
      .summary-row.change { color: #16a34a; font-weight: 600; border-bottom: none; }

      /* Footer */
      .receipt-footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px dashed #e2e8f0; }
      .receipt-footer p { font-size: 13px; color: #64748b; }
      .receipt-footer .thank-you { font-size: 16px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }

      @media print {
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { padding: 16px; }
      }
    `;

    const items = transaction.items?.map((item: any) => `
      <tr>
        <td>
          <div>${item.productName}</div>
          <div class="product-sku">${item.productSku || ''}</div>
        </td>
        <td>${item.qty}</td>
        <td>Rp ${item.sellPrice?.toLocaleString('id-ID')}</td>
        <td>Rp ${item.subtotal?.toLocaleString('id-ID')}</td>
      </tr>
    `).join('') || '';

    const date = new Date(transaction.createdAt || new Date());
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${transaction.invoiceNumber}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="receipt">

          <!-- Header -->
          <div class="receipt-header">
            <div class="store-name">🏪 ${store.storeName || 'KasirKu'}</div>
            <div class="store-info">
              ${store.storeAddress ? store.storeAddress + '<br>' : ''}
              ${store.storePhone ? 'Telp: ' + store.storePhone : ''}
              ${store.storeEmail ? ' | ' + store.storeEmail : ''}
            </div>
            <div class="invoice-badge">${transaction.invoiceNumber}</div>
          </div>

          <!-- Meta -->
          <div class="receipt-meta">
            <div class="meta-group">
              <span class="meta-label">Tanggal</span>
              <span class="meta-value">${dateStr}</span>
              <span class="meta-value">${timeStr}</span>
            </div>
            <div class="meta-group" style="text-align:right">
              <span class="meta-label">Pelanggan</span>
              <span class="meta-value">${transaction.customerName || 'Umum'}</span>
              <span class="meta-label" style="margin-top:8px">Kasir</span>
              <span class="meta-value">${transaction.cashier?.name || '-'}</span>
            </div>
          </div>

          <!-- Items -->
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${items}</tbody>
          </table>

          <!-- Summary -->
          <div class="receipt-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>Rp ${transaction.subtotal?.toLocaleString('id-ID')}</span>
            </div>
            ${transaction.discountTotal > 0 ? `
            <div class="summary-row">
              <span>Diskon</span>
              <span>- Rp ${transaction.discountTotal?.toLocaleString('id-ID')}</span>
            </div>` : ''}
            ${transaction.tax > 0 ? `
            <div class="summary-row">
              <span>Pajak</span>
              <span>Rp ${transaction.tax?.toLocaleString('id-ID')}</span>
            </div>` : ''}
            <div class="summary-row total">
              <span>TOTAL</span>
              <span>Rp ${transaction.grandTotal?.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row">
              <span>Pembayaran (${transaction.paymentMethod?.toUpperCase()})</span>
              <span>Rp ${transaction.amountPaid?.toLocaleString('id-ID')}</span>
            </div>
            ${transaction.change > 0 ? `
            <div class="summary-row change">
              <span>Kembalian</span>
              <span>Rp ${transaction.change?.toLocaleString('id-ID')}</span>
            </div>` : ''}
          </div>

          <!-- Footer -->
          <div class="receipt-footer">
            <p class="thank-you">Terima Kasih!</p>
            <p>${store.storeDescription || 'Terima kasih telah berbelanja.'}</p>
          </div>

        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 800);
  }
}