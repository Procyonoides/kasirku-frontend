import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/api.service';
import { RupiahPipe } from '../../shared/pipes';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ProfitLossComponent } from './profit-loss/profit-loss.component';
import { TopProductsComponent } from './top-products/top-products.component';
import { SalesComponent } from './sales/sales.component';
import { CashflowComponent } from './cashflow/cashflow.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RupiahPipe, 
    NgClass, 
    ProfitLossComponent, 
    TopProductsComponent, 
    SalesComponent, 
    CashflowComponent
  ],
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
          next: (res) => { this.salesData = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'profit':
        this.reportService.getProfitLoss(params).subscribe({
          next: (res) => { this.profitData = res.data; this.isLoading = false; }
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

  getTabLabel(): string {
    const map: Record<string, string> = {
      'sales': 'Penjualan',
      'profit': 'Laba Rugi',
      'top-products': 'Produk Terlaris',
      'cashflow': 'Arus Kas'
    };
    return map[this.activeTab] || '';
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPORT EXCEL (ExcelJS — support full styling)
  // ─────────────────────────────────────────────────────────────────
  async exportExcel() {
    let data: any[] = [];
    const sheetName = this.getTabLabel();

    switch (this.activeTab) {
      case 'sales':
        if (!this.salesData?.length) return;
        data = this.salesData.map((row: any) => ({
          'Tanggal': row._id,
          'Transaksi': row.transactions,
          'Profit (Rp)': row.profit || 0,
          'Omzet (Rp)': row.revenue
        }));
        break;

      case 'profit':
        if (!this.profitData) return;
        data = [
          { 'Keterangan': 'Pendapatan', 'Nominal (Rp)': this.profitData.revenue },
          { 'Keterangan': 'HPP (Harga Pokok)', 'Nominal (Rp)': this.profitData.cogs },
          { 'Keterangan': 'Laba Bersih', 'Nominal (Rp)': this.profitData.netProfit ?? this.profitData.profit }
        ];
        break;

      case 'top-products':
        if (!this.topProducts.length) return;
        data = this.topProducts.map((p: any, i: number) => ({
          'Rank': i + 1,
          'Produk': p.productName,
          'Qty Terjual': p.totalQty ?? p.totalQuantity ?? 0,
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

    const isCashflow = this.activeTab === 'cashflow';
    if (!data.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    const headers = Object.keys(data[0]);
    const numCols = headers.length;

    // ── Style Konstanta ──────────────────────────────────────
    const navyFill: ExcelJS.Fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    const blueFill: ExcelJS.Fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    const lightFill: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    const zebraFill: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    const whiteFill: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    const totalFill: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFE2E8F0' } };
    const allBorder = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    // ── ROW 1: Judul ─────────────────────────────────────────
    worksheet.mergeCells(1, 1, 1, numCols);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `LAPORAN ${sheetName.toUpperCase()} - KASIRKU`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = navyFill;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 32;

    // ── ROW 2: Periode ───────────────────────────────────────
    worksheet.mergeCells(2, 1, 2, numCols);
    const periodeCell = worksheet.getCell('A2');
    periodeCell.value = `Periode: ${this.dateFrom} s/d ${this.dateTo}`;
    periodeCell.font = { size: 11, color: { argb: 'FF1E3A5F' } };
    periodeCell.fill = lightFill;
    periodeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    // ── ROW 3: Dicetak ───────────────────────────────────────
    worksheet.mergeCells(3, 1, 3, numCols);
    const cetakCell = worksheet.getCell('A3');
    cetakCell.value = `Dicetak: ${new Date().toLocaleString('id-ID')}`;
    cetakCell.font = { size: 10, italic: true, color: { argb: 'FF888888' } };
    cetakCell.fill = lightFill;
    cetakCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(3).height = 18;

    // ── ROW 4: Kosong ────────────────────────────────────────
    worksheet.mergeCells(4, 1, 4, numCols);
    worksheet.getRow(4).height = 8;

    // ── ROW 5: Header Kolom ──────────────────────────────────
    const headerRow = worksheet.getRow(5);
    headerRow.height = 22;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = blueFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorder;
    });

    // ── ROW 6+: Data ─────────────────────────────────────────
    if (!isCashflow) {
      data.forEach((row, rowIdx) => {
        const excelRow = worksheet.getRow(rowIdx + 6);
        excelRow.height = 18;
        headers.forEach((h, colIdx) => {
          const cell = excelRow.getCell(colIdx + 1);
          cell.value = row[h];
          cell.fill = rowIdx % 2 === 0 ? zebraFill : whiteFill;
          cell.font = { size: 10 };
          cell.border = allBorder;
          if (typeof row[h] === 'number') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            if (h.includes('(Rp)')) cell.numFmt = '#,##0';
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      });

      // Styling khusus baris Laba Bersih (row ke-3, index 2)
      if (this.activeTab === 'profit') {
        const netValue = this.profitData.netProfit ?? this.profitData.profit ?? 0;
        const isProfit = netValue >= 0;
        const labaFill: ExcelJS.Fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: isProfit ? 'FFD1FAE5' : 'FFFEE2E2' } // hijau muda atau merah muda
        };
        const labaRow = worksheet.getRow(8); // row 6 + index 2 = row 8
        labaRow.eachCell(cell => {
          cell.fill = labaFill;
          cell.font = { bold: true, size: 11, color: { argb: isProfit ? 'FF065F46' : 'FF991B1B' } };
        });
      }

      // ── BARIS TOTAL ──────────────────────────────────────────
      if (this.activeTab !== 'profit') {
        const totalRowIdx = data.length + 6;
        const totalRow = worksheet.getRow(totalRowIdx);
        totalRow.height = 22;

        headers.forEach((h, colIdx) => {
          const cell = totalRow.getCell(colIdx + 1);
          cell.font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
          cell.fill = totalFill;
          cell.border = allBorder;

          if (colIdx === 0) {
            cell.value = 'TOTAL';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            const isNumber = typeof data[0][h] === 'number';
            if (isNumber) {
              const sum = data.reduce((acc: number, r: any) => acc + (r[h] || 0), 0);
              cell.value = sum;
              cell.numFmt = '#,##0';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            } else {
              cell.value = '';
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
          }
        });
      }

    } else {
      // ── CASHFLOW: rows dengan sub-detail ─────────────────
      const greyFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      const incFill: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      const expFill: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      let currentRow = 6;

      this.cashflowData.daily.forEach((day: any) => {
        // Baris tanggal utama
        const mainRow = worksheet.getRow(currentRow);
        mainRow.height = 20;
        [day._id, day.income, day.expense, day.net].forEach((val, i) => {
          const cell = mainRow.getCell(i + 1);
          cell.value = val;
          cell.fill = zebraFill;
          cell.font = { bold: true, size: 10, color: { argb: 'FF1E3A5F' } };
          cell.border = allBorder;
          if (i > 0) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
          else { cell.alignment = { horizontal: 'left', vertical: 'middle' }; }
        });
        currentRow++;

        // Sub-rows detail items
        if (day.items?.length) {
          day.items.forEach((item: any) => {
            const subRow = worksheet.getRow(currentRow);
            subRow.height = 16;
            const isIncome = item.type === 'pemasukan';
            const fillColor = isIncome ? incFill : expFill;

            const c1 = subRow.getCell(1);
            c1.value = `   ${isIncome ? '↑' : '↓'} ${isIncome ? 'Pemasukan' : 'Pengeluaran'}`;
            c1.fill = fillColor;
            c1.font = { size: 9, color: { argb: isIncome ? 'FF065F46' : 'FF991B1B' } };
            c1.border = allBorder;

            const c2 = subRow.getCell(2);
            c2.value = this.getCashflowCategoryLabel(item.category);
            c2.fill = fillColor;
            c2.font = { size: 9, color: { argb: 'FF374151' } };
            c2.border = allBorder;

            const c3 = subRow.getCell(3);
            c3.value = item.description && item.description !== '-' ? item.description : '';
            c3.fill = fillColor;
            c3.font = { size: 9, italic: true, color: { argb: 'FF6B7280' } };
            c3.border = allBorder;

            const c4 = subRow.getCell(4);
            c4.value = item.amount;
            c4.numFmt = '#,##0';
            c4.fill = fillColor;
            c4.font = { size: 9, bold: true, color: { argb: isIncome ? 'FF065F46' : 'FF991B1B' } };
            c4.border = allBorder;
            c4.alignment = { horizontal: 'right', vertical: 'middle' };

            currentRow++;
          });
        }
      });

      // Baris Total
      const totalRow = worksheet.getRow(currentRow);
      totalRow.height = 22;
      ['TOTAL', this.cashflowData.totalIncome, this.cashflowData.totalExpense, this.cashflowData.netCashflow]
      .forEach((val, i) => {
        const cell = totalRow.getCell(i + 1);
        cell.value = val;
        cell.font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
        cell.fill = totalFill;
        cell.border = allBorder;
        if (i === 0) { cell.alignment = { horizontal: 'center', vertical: 'middle' }; }
        else { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
      });
    }
    // ── Lebar Kolom ──────────────────────────────────────────
    worksheet.columns = headers.map(h => ({
      width: Math.max(h.length + 6, 22)
    }));

    // ── Simpan File ──────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `laporan-${this.activeTab}-${this.dateFrom}-${this.dateTo}.xlsx`);
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPORT PDF (jsPDF — dengan baris total di setiap tab)
  // ─────────────────────────────────────────────────────────────────
  exportPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    // ── Helper: cek apakah perlu tambah halaman ──────────────
    const checkPage = (needed = 10) => {
      if (y + needed > 275) { pdf.addPage(); y = 20; }
    };

    // ── Helper: gambar baris total ───────────────────────────
    const drawTotalRow = (cols: { x: number; value: string; align?: 'left' | 'right' | 'center' }[], rowW: number) => {
      checkPage(10);
      pdf.setFillColor(219, 234, 254); // biru muda
      pdf.rect(margin, y, rowW, 8, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 95);
      cols.forEach(col => {
        if (col.align === 'right') {
          const textW = pdf.getTextWidth(col.value);
          pdf.text(col.value, col.x - textW, y + 5.5);
        } else {
          pdf.text(col.value, col.x, y + 5.5);
        }
      });
      y += 8;
    };

    // ── Header PDF ───────────────────────────────────────────
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
    pdf.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin - 65, 30);

    y = 45;
    pdf.setTextColor(0, 0, 0);

    // ════════════════════════════════════════════════════════
    // TAB SALES
    // ════════════════════════════════════════════════════════
    if (this.activeTab === 'sales') {
      if (!this.salesData?.length) { pdf.save(`laporan-sales-${this.dateFrom}-${this.dateTo}.pdf`); return; }

      const totalTx  = this.salesData.reduce((s: number, r: any) => s + r.transactions, 0);
      const totalRev = this.salesData.reduce((s: number, r: any) => s + r.revenue, 0);
      const totalPro = this.salesData.reduce((s: number, r: any) => s + (r.profit || 0), 0);
      const avgTx    = totalTx > 0 ? Math.round(totalRev / totalTx) : 0;

      // 4 Summary boxes
      const boxes = [
        { label: 'TOTAL TRANSAKSI',       value: `${totalTx}` },
        { label: 'TOTAL OMZET',            value: `Rp ${totalRev.toLocaleString('id-ID')}` },
        { label: 'RATA-RATA/TRANSAKSI',    value: `Rp ${avgTx.toLocaleString('id-ID')}` },
        { label: 'TOTAL PROFIT',           value: `Rp ${totalPro.toLocaleString('id-ID')}` },
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
        pdf.setFontSize(10);
        pdf.setTextColor(30, 58, 95);
        pdf.setFont('helvetica', 'bold');
        pdf.text(box.value, bx + 3, y + 17);
      });
      y += 28;

      // Grafik batang
      if (this.salesData.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 95);
        pdf.text('Grafik Penjualan', margin, y + 5);
        y += 8;

        const chartH = 35;
        const chartW = pageWidth - margin * 2;
        const maxRev = Math.max(...this.salesData.map((r: any) => r.revenue));
        const barW   = Math.min(18, (chartW / this.salesData.length) - 2);

        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, chartW, chartH, 'F');

        this.salesData.forEach((row: any, i: number) => {
          const barH = maxRev > 0 ? (row.revenue / maxRev) * (chartH - 10) : 2;
          const bx   = margin + i * (chartW / this.salesData.length) + 1;
          const by   = y + chartH - barH - 2;
          pdf.setFillColor(37, 99, 235);
          pdf.roundedRect(bx, by, barW, barH, 1, 1, 'F');
          pdf.setFontSize(6);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'normal');
          pdf.text(row._id?.slice(5) || '', bx, y + chartH + 4);
        });
        y += chartH + 10;
      }

      // Tabel header
      const colX = { tgl: margin + 3, tx: margin + 55, profit: margin + 95, omzet: margin + 148 };
      pdf.setFillColor(30, 58, 95);
      pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TANGGAL',   colX.tgl,    y + 5.5);
      pdf.text('TRANSAKSI', colX.tx,     y + 5.5);
      pdf.text('PROFIT',    colX.profit, y + 5.5);
      pdf.text('OMZET',     colX.omzet,  y + 5.5);
      y += 8;

      // Data rows
      pdf.setFont('helvetica', 'normal');
      this.salesData.forEach((row: any, i: number) => {
        checkPage(8);
        if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F'); }
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(9);
        pdf.text(row._id || '-', colX.tgl, y + 5);
        pdf.text(`${row.transactions}`, colX.tx, y + 5);
        pdf.setTextColor(22, 163, 74);
        pdf.text(`Rp ${(row.profit || 0).toLocaleString('id-ID')}`, colX.profit, y + 5);
        pdf.setTextColor(30, 58, 95);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Rp ${row.revenue.toLocaleString('id-ID')}`, colX.omzet, y + 5);
        pdf.setFont('helvetica', 'normal');
        y += 7;
      });

      // Baris Total
      drawTotalRow([
        { x: colX.tgl,    value: 'TOTAL' },
        { x: colX.tx,     value: `${totalTx}` },
        { x: colX.profit, value: `Rp ${totalPro.toLocaleString('id-ID')}` },
        { x: colX.omzet,  value: `Rp ${totalRev.toLocaleString('id-ID')}` },
      ], pageWidth - margin * 2);
    }

    // ════════════════════════════════════════════════════════
    // TAB PROFIT LOSS
    // ════════════════════════════════════════════════════════
    else if (this.activeTab === 'profit') {
      if (!this.profitData) { pdf.save(`laporan-profit-${this.dateFrom}-${this.dateTo}.pdf`); return; }

      const netProfit = this.profitData.netProfit ?? this.profitData.profit ?? 0;
      const margin2   = this.profitData.margin || (this.profitData.revenue > 0 ? ((netProfit / this.profitData.revenue) * 100).toFixed(1) : 0);

      const items = [
        { label: 'Total Pendapatan',       value: this.profitData.revenue, color: [22, 163, 74] as [number,number,number] },
        { label: 'Total HPP (Harga Pokok)', value: this.profitData.cogs,   color: [220, 38, 38] as [number,number,number] },
        { label: 'Laba Bersih',             value: netProfit,              color: (netProfit >= 0 ? [37, 99, 235] : [220, 38, 38]) as [number,number,number] },
      ];

      items.forEach(item => {
        checkPage(22);
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
        if (item.label === 'Laba Bersih') {
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Margin: ${margin2}%`, pageWidth - margin - 35, y + 15);
        }
        y += 24;
      });

      // Tabel Pengeluaran per Kategori (jika ada)
      if (this.profitData.expenses?.length) {
        y += 4;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 95);
        pdf.text('Detail Pengeluaran per Kategori', margin, y + 5);
        y += 9;

        pdf.setFillColor(30, 58, 95);
        pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.text('KATEGORI', margin + 3, y + 5.5);
        pdf.text('NOMINAL', margin + 140, y + 5.5);
        y += 8;

        let totalExp = 0;
        pdf.setFont('helvetica', 'normal');
        this.profitData.expenses.forEach((e: any, i: number) => {
          checkPage(8);
          if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F'); }
          pdf.setTextColor(50, 50, 50);
          pdf.text(e._id || '-', margin + 3, y + 5);
          pdf.setTextColor(220, 38, 38);
          pdf.text(`Rp ${e.total.toLocaleString('id-ID')}`, margin + 140, y + 5);
          totalExp += e.total;
          y += 7;
        });

        // Total pengeluaran
        drawTotalRow([
          { x: margin + 3,   value: 'TOTAL PENGELUARAN' },
          { x: margin + 180, value: `Rp ${totalExp.toLocaleString('id-ID')}`, align: 'right' },
        ], pageWidth - margin * 2);
      }
    }

    // ════════════════════════════════════════════════════════
    // TAB TOP PRODUCTS
    // ════════════════════════════════════════════════════════
    else if (this.activeTab === 'top-products') {
      if (!this.topProducts.length) { pdf.save(`laporan-top-products-${this.dateFrom}-${this.dateTo}.pdf`); return; }

      const colX = { rank: margin + 3, nama: margin + 20, qty: margin + 120, rev: margin + 155 };

      pdf.setFillColor(30, 58, 95);
      pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RANK',       colX.rank, y + 5.5);
      pdf.text('PRODUK',     colX.nama, y + 5.5);
      pdf.text('QTY TERJUAL', colX.qty, y + 5.5);
      pdf.text('PENDAPATAN', colX.rev,  y + 5.5);
      y += 8;

      let totalQty = 0;
      let totalRev = 0;
      const rankColors: Record<number, [number, number, number]> = {
        0: [234, 179, 8],
        1: [148, 163, 184],
        2: [205, 127, 50]
      };

      pdf.setFont('helvetica', 'normal');
      this.topProducts.forEach((p: any, i: number) => {
        checkPage(8);
        if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F'); }

        const qty = p.totalQty ?? p.totalQuantity ?? 0;
        const rev = p.totalRevenue ?? 0;
        totalQty += qty;
        totalRev += rev;

        if (rankColors[i]) {
          pdf.setTextColor(rankColors[i][0], rankColors[i][1], rankColors[i][2]);
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setTextColor(50, 50, 50);
          pdf.setFont('helvetica', 'normal');
        }
        pdf.text(`#${i + 1}`, colX.rank, y + 5);
        pdf.setTextColor(50, 50, 50);
        pdf.setFont('helvetica', 'normal');
        pdf.text(p.productName || '-', colX.nama, y + 5);
        pdf.text(`${qty}`, colX.qty, y + 5);
        pdf.text(`Rp ${rev.toLocaleString('id-ID')}`, colX.rev, y + 5);
        y += 7;
      });

      // Baris Total
      drawTotalRow([
        { x: colX.rank, value: 'TOTAL' },
        { x: colX.qty,  value: `${totalQty}` },
        { x: colX.rev,  value: `Rp ${totalRev.toLocaleString('id-ID')}` },
      ], pageWidth - margin * 2);
    }

    // ════════════════════════════════════════════════════════
    // TAB CASHFLOW
    // ════════════════════════════════════════════════════════
    else if (this.activeTab === 'cashflow') {
      if (!this.cashflowData) { pdf.save(`laporan-cashflow-${this.dateFrom}-${this.dateTo}.pdf`); return; }

      // 3 Summary boxes
      pdf.setFillColor(240, 246, 255);
      pdf.roundedRect(margin,       y, 55, 22, 3, 3, 'F');
      pdf.roundedRect(margin + 60,  y, 55, 22, 3, 3, 'F');
      pdf.roundedRect(margin + 120, y, 55, 22, 3, 3, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('PEMASUKAN',    margin + 3,   y + 7);
      pdf.text('PENGELUARAN',  margin + 63,  y + 7);
      pdf.text('NET CASHFLOW', margin + 123, y + 7);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 163, 74);
      pdf.text(`Rp ${(this.cashflowData.totalIncome || 0).toLocaleString('id-ID')}`, margin + 3, y + 17);
      pdf.setTextColor(220, 38, 38);
      pdf.text(`Rp ${(this.cashflowData.totalExpense || 0).toLocaleString('id-ID')}`, margin + 63, y + 17);
      const net = this.cashflowData.netCashflow ?? 0;
      pdf.setTextColor(net >= 0 ? 37 : 220, net >= 0 ? 99 : 38, net >= 0 ? 235 : 38);
      pdf.text(`Rp ${net.toLocaleString('id-ID')}`, margin + 123, y + 17);
      y += 30;

      const colX = { tgl: margin + 3, inc: margin + 55, exp: margin + 105, net: margin + 155 };

      pdf.setFillColor(30, 58, 95);
      pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TANGGAL',     colX.tgl, y + 5.5);
      pdf.text('PEMASUKAN',   colX.inc, y + 5.5);
      pdf.text('PENGELUARAN', colX.exp, y + 5.5);
      pdf.text('NET',         colX.net, y + 5.5);
      y += 8;

      let sumInc = 0, sumExp = 0, sumNet = 0;

      pdf.setFont('helvetica', 'normal');
      if (this.cashflowData.daily?.length) {
        this.cashflowData.daily.forEach((row: any, i: number) => {
        checkPage(8);
        // Baris tanggal utama
        if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F'); }
        sumInc += row.income || 0;
        sumExp += row.expense || 0;
        sumNet += row.net || 0;
        pdf.setTextColor(50, 50, 50);
        pdf.setFont('helvetica', 'bold');
        pdf.text(row._id || '-', colX.tgl, y + 5);
        pdf.setTextColor(22, 163, 74);
        pdf.text(`Rp ${(row.income || 0).toLocaleString('id-ID')}`, colX.inc, y + 5);
        pdf.setTextColor(220, 38, 38);
        pdf.text(`Rp ${(row.expense || 0).toLocaleString('id-ID')}`, colX.exp, y + 5);
        pdf.setTextColor(row.net >= 0 ? 37 : 220, row.net >= 0 ? 99 : 38, row.net >= 0 ? 235 : 38);
        pdf.text(`Rp ${(row.net || 0).toLocaleString('id-ID')}`, colX.net, y + 5);
        pdf.setFont('helvetica', 'normal');
        y += 7;

        // Detail items
        if (row.items?.length) {
          row.items.forEach((item: any) => {
            checkPage(7);
            const isIncome = item.type === 'pemasukan';

            // Background hijau atau merah muda
            if (isIncome) { pdf.setFillColor(209, 250, 229); }
            else { pdf.setFillColor(254, 226, 226); }
            pdf.rect(margin, y, pageWidth - margin * 2, 6, 'F');

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');

            // Jenis (indent)
            pdf.setTextColor(isIncome ? 6 : 153, isIncome ? 95 : 27, isIncome ? 70 : 27);
            pdf.text(`  ${isIncome ? '[+]' : '[-]'} ${isIncome ? 'Pemasukan' : 'Pengeluaran'}`, colX.tgl, y + 4.5);

            // Kategori
            pdf.setTextColor(55, 65, 81);
            pdf.text(this.getCashflowCategoryLabel(item.category), colX.inc, y + 4.5);

            // Keterangan
            pdf.setTextColor(107, 114, 128);
            const desc = item.description && item.description !== '-' ? item.description : '';
            pdf.text(desc, colX.exp, y + 4.5);

            // Nominal
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(isIncome ? 6 : 153, isIncome ? 95 : 27, isIncome ? 70 : 27);
            pdf.text(`Rp ${item.amount.toLocaleString('id-ID')}`, colX.net, y + 4.5);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            y += 6;
          });
        }
      });
    }

      // Baris Total
      drawTotalRow([
        { x: colX.tgl, value: 'TOTAL' },
        { x: colX.inc, value: `Rp ${sumInc.toLocaleString('id-ID')}` },
        { x: colX.exp, value: `Rp ${sumExp.toLocaleString('id-ID')}` },
        { x: colX.net, value: `Rp ${sumNet.toLocaleString('id-ID')}` },
      ], pageWidth - margin * 2);
    }

    // ── Footer ───────────────────────────────────────────────
    const pageCount = (pdf.internal as any).getNumberOfPages();
    for (let pg = 1; pg <= pageCount; pg++) {
      pdf.setPage(pg);
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('KasirKu - Sistem Kasir & Keuangan', margin, 287);
      pdf.text(`Halaman ${pg} / ${pageCount}`, pageWidth - margin - 20, 287);
    }

    pdf.save(`laporan-${this.activeTab}-${this.dateFrom}-${this.dateTo}.pdf`);
  }

  printReport() {
    const content = this.reportContent.nativeElement.innerHTML;

    // ── CSS ──────────────────────────────────────
    const styles = `
      body { font-family: 'Segoe UI', sans-serif; padding: 24px; background: white; }
      .print-header { background: #1e3a5f; color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 20px; }
      .print-header h4 { margin: 0; font-size: 20px; font-weight: 700; }
      .report-stat-card { border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; background: #f8fafc; margin-bottom: 8px; }
      .stat-green { border-left-color: #16a34a; }
      .stat-red   { border-left-color: #dc2626; }
      .stat-blue  { border-left-color: #2563eb; }
      .rsc-label  { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      .rsc-value  { font-size: 20px; font-weight: 700; color: #1e3a5f; margin-top: 4px; }
      .rsc-sub    { font-size: 12px; color: #64748b; }
      .card { border-radius: 8px; overflow: hidden; margin-bottom: 16px; box-shadow: none !important; }
      .card-header { background: white !important; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
      .card-header h6 { margin: 0; font-weight: 700; color: #1e3a5f; }
      .shadow-sm { box-shadow: none !important; }
      .table thead tr th { background: #1e3a5f !important; color: white !important; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .table tbody tr:nth-child(even) { background: #f8fafc; }
      .table tbody tr td { padding: 8px 12px; border-color: #e2e8f0; font-size: 13px; }
      .top-product-row { display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
      .top-rank { width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
      .top-revenue { font-weight: 700; color: #1e3a5f; min-width: 100px; text-align: right; font-size: 13px; }
      @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `;

    // ── HTML Template ─────────────────────────────
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan ${this.getTabLabel()} - KasirKu</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
        <style>${styles}</style>
      </head>
      <body>
        <div class="print-header">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4>🏪 KasirKu</h4>
              <div style="font-size:14px; margin-top:4px; opacity:0.9;">Laporan ${this.getTabLabel()}</div>
            </div>
            <div style="text-align:right; font-size:12px; opacity:0.8;">
              <div>Periode: ${this.dateFrom} s/d ${this.dateTo}</div>
              <div>Dicetak: ${new Date().toLocaleString('id-ID')}</div>
            </div>
          </div>
        </div>
        ${content}
      </body>
      </html>
    `;

    // ── Buka Window & Print ───────────────────────
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(template);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
  }

  getCashflowCategoryLabel(value: string): string {
    const map: Record<string, string> = {
      'penjualan': 'Penjualan', 'modal': 'Modal', 'piutang_masuk': 'Piutang Masuk',
      'pinjaman': 'Pinjaman', 'lain_lain_masuk': 'Lain-lain',
      'pembelian_stok': 'Pembelian Stok', 'gaji': 'Gaji', 'sewa': 'Sewa',
      'listrik': 'Listrik', 'air': 'Air', 'internet': 'Internet',
      'perawatan': 'Perawatan', 'transportasi': 'Transportasi',
      'marketing': 'Marketing', 'lain_lain_keluar': 'Lain-lain'
    };
    return map[value] || value;
  }
}