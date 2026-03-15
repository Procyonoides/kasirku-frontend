import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/api.service';
import { RupiahPipe } from '../../shared/pipes';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, NgClass],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;
  activeTab: 'sales' | 'profit' | 'top-products' | 'cashflow' = 'sales';
  isLoading = false;
  isExporting = false;
  dateFrom = '';
  dateTo = '';

  salesData: any = null;
  profitData: any = null;
  topProducts: any[] = [];
  cashflowData: any = null;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    this.dateFrom = firstDay;
    this.dateTo = today;
    this.loadReport();
  }

  loadReport() {
    this.isLoading = true;
    const params = { startDate: this.dateFrom, endDate: this.dateTo };

    switch (this.activeTab) {
      case 'sales':
        this.reportService.getSalesReport(params).subscribe({
          next: (res) => { 
            this.salesData = res.data; // langsung array
            this.isLoading = false; 
          },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'profit':
        this.reportService.getProfitLoss(params).subscribe({
          next: (res) => { this.profitData = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'top-products':
        this.reportService.getTopProducts(params).subscribe({
          next: (res) => { this.topProducts = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'cashflow':
        this.reportService.getCashflow(params).subscribe({
          next: (res) => { this.cashflowData = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
    }
  }

  switchTab(tab: 'sales' | 'profit' | 'top-products' | 'cashflow') {
    this.activeTab = tab;
    this.loadReport();
  }

  onFilter() { this.loadReport(); }

  getMaxQty(): number {
    if (!this.topProducts.length) return 1;
    return Math.max(...this.topProducts.map(p => p.totalQuantity));
  }

  getTabLabel(): string {
    const map: Record<string, string> = {
      'sales': 'Penjualan',
      'profit': 'Laba Rugi',
      'top-products': 'Produk Terlaris',
      'cashflow': 'Arus Kas'
    };
    return map[this.activeTab] || '';
  }

  exportPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    // Header
    pdf.setFillColor(30, 58, 95);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KasirKu', margin, 15);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Laporan ${this.getTabLabel()}`, margin, 23);
    pdf.setFontSize(9);
    pdf.text(`Periode: ${this.dateFrom} s/d ${this.dateTo}`, margin, 30);
    pdf.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin - 60, 30);

    y = 45;
    pdf.setTextColor(0, 0, 0);

    switch (this.activeTab) {

      case 'sales':
        if (!this.salesData?.length) return;

        const totalTx = this.getSalesTotalTransactions();
        const totalRev = this.getSalesTotalRevenue();
        const avgTx = totalTx > 0 ? Math.round(totalRev / totalTx) : 0;
        const totalItems = this.salesData.reduce((s: number, r: any) => s + (r.items || 0), 0);

        // 4 Summary boxes
        const boxes = [
          { label: 'TOTAL TRANSAKSI', value: `${totalTx}` },
          { label: 'TOTAL OMZET', value: `Rp ${totalRev.toLocaleString('id-ID')}` },
          { label: 'RATA-RATA/TRANSAKSI', value: `Rp ${avgTx.toLocaleString('id-ID')}` },
          { label: 'ITEM TERJUAL', value: `${totalItems}` },
        ];

        const boxW = (pageWidth - margin * 2 - 9) / 4;
        boxes.forEach((box, i) => {
          const bx = margin + i * (boxW + 3);
          pdf.setFillColor(240, 246, 255);
          pdf.roundedRect(bx, y, boxW, 22, 2, 2, 'F');
          pdf.setFontSize(7);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'normal');
          pdf.text(box.label, bx + 3, y + 7);
          pdf.setFontSize(11);
          pdf.setTextColor(30, 58, 95);
          pdf.setFont('helvetica', 'bold');
          pdf.text(box.value, bx + 3, y + 17);
        });
        y += 28;

        // Grafik batang sederhana
        if (this.salesData.length > 0) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 58, 95);
          pdf.text('Grafik Penjualan', margin, y + 5);
          y += 8;

          const chartH = 35;
          const chartW = pageWidth - margin * 2;
          const maxRev = Math.max(...this.salesData.map((r: any) => r.revenue));
          const barW = Math.min(20, (chartW / this.salesData.length) - 3);

          // Chart background
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y, chartW, chartH, 'F');

          this.salesData.forEach((row: any, i: number) => {
            const barH = maxRev > 0 ? (row.revenue / maxRev) * (chartH - 10) : 2;
            const bx = margin + i * (chartW / this.salesData.length) + 2;
            const by = y + chartH - barH - 2;

            pdf.setFillColor(37, 99, 235);
            pdf.roundedRect(bx, by, barW, barH, 1, 1, 'F');

            pdf.setFontSize(6);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'normal');
            const label = row._id?.slice(5) || '';
            pdf.text(label, bx, y + chartH + 4);
          });
          y += chartH + 10;
        }

        // Table header
        pdf.setFillColor(30, 58, 95);
        pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TANGGAL', margin + 3, y + 5.5);
        pdf.text('TRANSAKSI', margin + 60, y + 5.5);
        pdf.text('PROFIT', margin + 100, y + 5.5);
        pdf.text('OMZET', margin + 145, y + 5.5);
        y += 8;

        pdf.setFont('helvetica', 'normal');
        this.salesData.forEach((row: any, i: number) => {
          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F');
          }
          pdf.setTextColor(50, 50, 50);
          pdf.text(row._id || '-', margin + 3, y + 5);
          pdf.text(`${row.transactions}`, margin + 60, y + 5);
          pdf.setTextColor(22, 163, 74);
          pdf.text(`Rp ${(row.profit || 0).toLocaleString('id-ID')}`, margin + 100, y + 5);
          pdf.setTextColor(30, 58, 95);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Rp ${row.revenue.toLocaleString('id-ID')}`, margin + 145, y + 5);
          pdf.setFont('helvetica', 'normal');
          y += 7;
          if (y > 270) { pdf.addPage(); y = 20; }
        });
        break;

      case 'profit':
        if (!this.profitData) return;

        const items = [
          { label: 'Total Pendapatan', value: this.profitData.revenue, color: [22, 163, 74] },
          { label: 'Total HPP (Harga Pokok)', value: this.profitData.cogs, color: [220, 38, 38] },
          { label: 'Laba Bersih', value: this.profitData.profit, color: this.profitData.profit >= 0 ? [37, 99, 235] : [220, 38, 38] },
        ];

        items.forEach(item => {
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(margin, y, pageWidth - margin * 2, 18, 3, 3, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'normal');
          pdf.text(item.label, margin + 4, y + 7);
          pdf.setFontSize(14);
          pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Rp ${item.value.toLocaleString('id-ID')}`, margin + 4, y + 15);
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Margin: ${this.profitData.margin || 0}%`, pageWidth - margin - 30, y + 15);
          y += 24;
        });
        break;

      case 'top-products':
        if (!this.topProducts.length) return;

        pdf.setFillColor(30, 58, 95);
        pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RANK', margin + 3, y + 5.5);
        pdf.text('PRODUK', margin + 20, y + 5.5);
        pdf.text('QTY TERJUAL', margin + 120, y + 5.5);
        pdf.text('PENDAPATAN', margin + 155, y + 5.5);
        y += 8;

        pdf.setFont('helvetica', 'normal');
        this.topProducts.forEach((p: any, i: number) => {
          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F');
          }
          const rankColors: any = { 0: [234, 179, 8], 1: [148, 163, 184], 2: [205, 127, 50] };
          if (rankColors[i]) {
            pdf.setTextColor(rankColors[i][0], rankColors[i][1], rankColors[i][2]);
            pdf.setFont('helvetica', 'bold');
          } else {
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
          }
          pdf.text(`#${i + 1}`, margin + 3, y + 5);
          pdf.setTextColor(50, 50, 50);
          pdf.setFont('helvetica', 'normal');
          pdf.text(p.productName || '-', margin + 20, y + 5);
          pdf.text(`${p.totalQuantity}`, margin + 120, y + 5);
          pdf.text(`Rp ${p.totalRevenue.toLocaleString('id-ID')}`, margin + 155, y + 5);
          y += 7;
          if (y > 270) { pdf.addPage(); y = 20; }
        });
        break;

      case 'cashflow':
        if (!this.cashflowData) return;

        pdf.setFillColor(240, 246, 255);
        pdf.roundedRect(margin, y, 55, 22, 3, 3, 'F');
        pdf.roundedRect(margin + 60, y, 55, 22, 3, 3, 'F');
        pdf.roundedRect(margin + 120, y, 55, 22, 3, 3, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('PEMASUKAN', margin + 3, y + 7);
        pdf.text('PENGELUARAN', margin + 63, y + 7);
        pdf.text('NET CASHFLOW', margin + 123, y + 7);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 163, 74);
        pdf.text(`Rp ${this.cashflowData.totalIncome.toLocaleString('id-ID')}`, margin + 3, y + 17);
        pdf.setTextColor(220, 38, 38);
        pdf.text(`Rp ${this.cashflowData.totalExpense.toLocaleString('id-ID')}`, margin + 63, y + 17);
        pdf.setTextColor(this.cashflowData.netCashflow >= 0 ? 37 : 220, this.cashflowData.netCashflow >= 0 ? 99 : 38, this.cashflowData.netCashflow >= 0 ? 235 : 38);
        pdf.text(`Rp ${this.cashflowData.netCashflow.toLocaleString('id-ID')}`, margin + 123, y + 17);
        y += 30;

        pdf.setFillColor(30, 58, 95);
        pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TANGGAL', margin + 3, y + 5.5);
        pdf.text('PEMASUKAN', margin + 55, y + 5.5);
        pdf.text('PENGELUARAN', margin + 105, y + 5.5);
        pdf.text('NET', margin + 155, y + 5.5);
        y += 8;

        pdf.setFont('helvetica', 'normal');
        if (this.cashflowData.daily?.length) {
          this.cashflowData.daily.forEach((row: any, i: number) => {
            if (i % 2 === 0) {
              pdf.setFillColor(248, 250, 252);
              pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F');
            }
            pdf.setTextColor(50, 50, 50);
            pdf.text(row._id || '-', margin + 3, y + 5);
            pdf.setTextColor(22, 163, 74);
            pdf.text(`Rp ${row.income.toLocaleString('id-ID')}`, margin + 55, y + 5);
            pdf.setTextColor(220, 38, 38);
            pdf.text(`Rp ${row.expense.toLocaleString('id-ID')}`, margin + 105, y + 5);
            pdf.setTextColor(row.net >= 0 ? 37 : 220, row.net >= 0 ? 99 : 38, row.net >= 0 ? 235 : 38);
            pdf.text(`Rp ${row.net.toLocaleString('id-ID')}`, margin + 155, y + 5);
            y += 7;
            if (y > 270) { pdf.addPage(); y = 20; }
          });
        }
        break;
    }

    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`KasirKu - Sistem Kasir & Keuangan`, margin, 287);
    pdf.text(`Halaman 1`, pageWidth - margin - 15, 287);

    pdf.save(`laporan-${this.activeTab}-${this.dateFrom}-${this.dateTo}.pdf`);
  }

  exportExcel() {
    let data: any[] = [];
    let sheetName = this.getTabLabel();

    switch (this.activeTab) {
      case 'sales':
        if (!this.salesData?.length) return;
        data = this.salesData.map((row: any) => ({
          'Tanggal': row._id,
          'Transaksi': row.transactions,
          'Profit (Rp)': row.profit,
          'Omzet (Rp)': row.revenue
        }));
        break;
      case 'profit':
        if (!this.profitData) return;
        data = [{
          'Pendapatan (Rp)': this.profitData.revenue,
          'HPP (Rp)': this.profitData.cogs,
          'Laba Bersih (Rp)': this.profitData.profit,
          'Margin (%)': this.profitData.margin
        }];
        break;
      case 'top-products':
        if (!this.topProducts.length) return;
        data = this.topProducts.map((p: any, i: number) => ({
          'Rank': i + 1,
          'Produk': p.productName,
          'Qty Terjual': p.totalQuantity,
          'Pendapatan (Rp)': p.totalRevenue
        }));
        break;
      case 'cashflow':
        if (!this.cashflowData?.daily) return;
        data = this.cashflowData.daily.map((row: any) => ({
          'Tanggal': row._id,
          'Pemasukan (Rp)': row.income,
          'Pengeluaran (Rp)': row.expense,
          'Net (Rp)': row.net
        }));
        break;
    }

    const wb = XLSX.utils.book_new();
    const ws: any = {};

    const headers = Object.keys(data[0] || {});
    const numCols = headers.length;

    // Row 1: Judul besar
    ws['A1'] = {
      v: `LAPORAN ${sheetName.toUpperCase()} - KASIRKU`,
      t: 's',
      s: {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E3A5F' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    };

    // Row 2: Periode
    ws['A2'] = {
      v: `Periode: ${this.dateFrom} s/d ${this.dateTo}`,
      t: 's',
      s: {
        font: { sz: 11, color: { rgb: '444444' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center' }
      }
    };

    // Row 3: Dicetak
    ws['A3'] = {
      v: `Dicetak: ${new Date().toLocaleString('id-ID')}`,
      t: 's',
      s: {
        font: { sz: 10, italic: true, color: { rgb: '888888' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center' }
      }
    };

    // Row 4: kosong
    ws['A4'] = { v: '', t: 's' };

    // Row 5: Header kolom
    const colLetters = ['A','B','C','D','E','F','G','H'];
    headers.forEach((h, i) => {
      ws[`${colLetters[i]}5`] = {
        v: h,
        t: 's',
        s: {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2563EB' } },
          alignment: { horizontal: 'center' },
          border: {
            bottom: { style: 'thin', color: { rgb: 'FFFFFF' } }
          }
        }
      };
    });

    // Data rows
    data.forEach((row, rowIdx) => {
      const isEven = rowIdx % 2 === 0;
      headers.forEach((h, colIdx) => {
        const cellRef = `${colLetters[colIdx]}${rowIdx + 6}`;
        ws[cellRef] = {
          v: row[h],
          t: typeof row[h] === 'number' ? 'n' : 's',
          s: {
            fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
            alignment: { horizontal: typeof row[h] === 'number' ? 'right' : 'left' },
            border: {
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
          }
        };
      });
    });

    // Merge cells untuk title, periode, dicetak
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: numCols - 1 } },
    ];

    // Range
    ws['!ref'] = `A1:${colLetters[numCols - 1]}${data.length + 5}`;

    // Column widths
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 8, 20) }));

    // Row heights
    ws['!rows'] = [{ hpt: 30 }, { hpt: 20 }, { hpt: 18 }, { hpt: 10 }, { hpt: 22 }];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `laporan-${this.activeTab}-${this.dateFrom}-${this.dateTo}.xlsx`);
  }
  
  printReport() {
    window.print();
  }

  getSalesTotalRevenue(): number {
    if (!this.salesData?.length) return 0;
    return this.salesData.reduce((sum: number, row: any) => sum + row.revenue, 0);
  }

  getSalesTotalTransactions(): number {
    if (!this.salesData?.length) return 0;
    return this.salesData.reduce((sum: number, row: any) => sum + row.transactions, 0);
  }
}
