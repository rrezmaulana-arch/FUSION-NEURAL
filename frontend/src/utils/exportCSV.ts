/**
 * FUSION NEURAL — CSV Export Utility
 * Export any data array to CSV file.
 */

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        // Escape commas and quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().substring(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportInventoryCSV(products: any[]) {
  const data = products.map(p => ({
    'Nama Produk': p.name,
    'SKU': p.sku,
    'Kategori': p.category,
    'Stok': p.quantity,
    'Harga': p.price,
    'Diskon (%)': p.discount || 0,
    'Gudang': p.warehouse || '-',
  }));
  exportToCSV(data, 'Inventory_FusionNeural');
}

export function exportOrdersCSV(orders: any[]) {
  const data = orders.map(o => ({
    'Order ID': o.id,
    'Pelanggan': o.customer,
    'Platform': o.platform,
    'Status': o.status,
    'Total': o.total,
    'Prioritas': o.priority || '-',
    'Kurir': o.courier || '-',
    'Tracking': o.tracking || '-',
  }));
  exportToCSV(data, 'Orders_FusionNeural');
}

export function exportTransactionsCSV(transactions: any[]) {
  const data = transactions.map(t => ({
    'ID': t.id,
    'Tipe': t.transaction_type,
    'Jumlah': t.amount,
    'Kategori': t.category || '-',
    'Deskripsi': t.description || '-',
    'Tanggal': t.created_at || '-',
  }));
  exportToCSV(data, 'Transactions_FusionNeural');
}

export function exportTasksCSV(tasks: any[]) {
  const data = tasks.map(t => ({
    'Task': t.title,
    'Agent': t.agent,
    'Status': t.status,
    'Prioritas': t.priority || '-',
    'Progress': t.progress || 0,
    'Hasil': t.agentResult || '-',
  }));
  exportToCSV(data, 'NeuralTasks_FusionNeural');
}
