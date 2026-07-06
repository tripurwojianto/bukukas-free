import { LocalData, Transaction, Receivable, Payable, DailyCashSession } from '../types';

const SPREADSHEET_NAME = 'Buku Catatan Toko - Cloud Sync';

const CACHE_KEY_PREFIX = 'siku_sheets_cache_';
const CACHE_TTL_MS = 45000; // Cache valid for 45 seconds to optimize session requests

function getSessionCache(spreadsheetId: string): LocalData | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${spreadsheetId}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    if (age < CACHE_TTL_MS) {
      console.log('SIKU Sheets Cache: Mengambil data dari Session Cache (TTL aktif)');
      return entry.data;
    }
  } catch (e) {
    console.warn('Gagal membaca Session Cache:', e);
  }
  return null;
}

function setSessionCache(spreadsheetId: string, data: LocalData): void {
  try {
    const entry = {
      timestamp: Date.now(),
      data,
    };
    sessionStorage.setItem(`${CACHE_KEY_PREFIX}${spreadsheetId}`, JSON.stringify(entry));
  } catch (e) {
    console.warn('Gagal menyimpan Session Cache:', e);
  }
}

export function invalidateSessionCache(spreadsheetId: string): void {
  try {
    sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${spreadsheetId}`);
    console.log('SIKU Sheets Cache: Invalidasi Session Cache berhasil');
  } catch (e) {
    // ignore
  }
}

// Helper for Google API fetch with authorization
async function apiCall(url: string, options: RequestInit = {}, accessToken: string) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Call failed: ${url}`, errorBody);
    throw new Error(`Google API request failed: ${response.status} - ${response.statusText}`);
  }
  return response.json();
}

/**
 * Searches for a spreadsheet named "Buku Catatan Toko - Cloud Sync" in Google Drive.
 */
export async function findSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  const data = await apiCall(url, { method: 'GET' }, accessToken);
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Creates a new spreadsheet named "Buku Catatan Toko - Cloud Sync" and initializes required sheets.
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const body = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      { properties: { title: 'Transaksi' } },
      { properties: { title: 'Piutang' } },
      { properties: { title: 'Utang' } },
      { properties: { title: 'Sesi Kasir' } },
    ],
  };

  const response = await apiCall(url, {
    method: 'POST',
    body: JSON.stringify(body),
  }, accessToken);

  return response.spreadsheetId;
}

/**
 * Ensures all required tabs exist in the spreadsheet.
 */
export async function ensureSheetsExist(accessToken: string, spreadsheetId: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const metadata = await apiCall(url, { method: 'GET' }, accessToken);
  
  const existingTitles = new Set<string>();
  if (metadata.sheets) {
    for (const sheet of metadata.sheets) {
      if (sheet.properties?.title) {
        existingTitles.add(sheet.properties.title);
      }
    }
  }

  const requiredSheets = ['Transaksi', 'Piutang', 'Utang', 'Sesi Kasir'];
  const requests: any[] = [];

  for (const title of requiredSheets) {
    if (!existingTitles.has(title)) {
      requests.push({
        addSheet: {
          properties: { title },
        },
      });
    }
  }

  if (requests.length > 0) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await apiCall(updateUrl, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    }, accessToken);
  }
}

/**
 * Synchronizes all local data to the Google Spreadsheet. Overwrites sheet contents.
 */
export async function syncLocalDataToSheets(
  accessToken: string,
  spreadsheetId: string,
  data: LocalData
): Promise<void> {
  await ensureSheetsExist(accessToken, spreadsheetId);

  // 1. Map Transactions
  const transactionRows = [
    ['ID Transaksi', 'Tanggal', 'Jam', 'Keterangan', 'Tipe', 'Kategori', 'Nominal (Rp)', 'HPP (Rp)'],
    ...data.transactions.map((t) => [
      t.id,
      t.date,
      t.time,
      t.description,
      t.type,
      t.category,
      t.amount,
      t.hpp !== undefined ? t.hpp : '',
    ]),
  ];

  // 2. Map Receivables (Piutang)
  const receivableRows = [
    [
      'ID Piutang',
      'Nama Pelanggan',
      'Tanggal Catat',
      'Jatuh Tempo',
      'Keterangan',
      'Total Utang (Rp)',
      'Sudah Terbayar (Rp)',
      'Sisa Tagihan (Rp)',
      'WhatsApp Number',
    ],
    ...data.receivables.map((r) => [
      r.id,
      r.customerName,
      r.date,
      r.dueDate,
      r.description,
      r.amount,
      r.paidAmount,
      r.amount - r.paidAmount,
      r.whatsappNumber || '',
    ]),
  ];

  // 3. Map Payables (Utang)
  const payableRows = [
    [
      'ID Utang',
      'Nama Supplier',
      'Tanggal Catat',
      'Jatuh Tempo',
      'Keterangan',
      'Total Utang (Rp)',
      'Sudah Kita Bayar (Rp)',
      'Sisa Utang (Rp)',
      'WhatsApp Number',
    ],
    ...data.payables.map((p) => [
      p.id,
      p.supplierName,
      p.date,
      p.dueDate,
      p.description,
      p.amount,
      p.paidAmount,
      p.amount - p.paidAmount,
      p.whatsappNumber || '',
    ]),
  ];

  // 4. Map Sessions (Sesi Kasir)
  const sessionRows = [
    ['Tanggal', 'Saldo Awal Kembalian (Rp)', 'Uang Fisik Awal (Rp)', 'Uang Fisik Akhir (Rp)'],
    ...Object.values(data.sessions).map((s) => [
      s.date,
      s.openingPettyCash,
      s.openingPhysicalCash,
      s.closingPhysicalCash !== undefined ? s.closingPhysicalCash : '',
    ]),
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Transaksi!A1:H1000',
        values: transactionRows,
      },
      {
        range: 'Piutang!A1:I1000',
        values: receivableRows,
      },
      {
        range: 'Utang!A1:I1000',
        values: payableRows,
      },
      {
        range: 'Sesi Kasir!A1:D1000',
        values: sessionRows,
      },
    ],
  };

  await apiCall(updateUrl, {
    method: 'POST',
    body: JSON.stringify(body),
  }, accessToken);

  // Update session cache to keep read/write state cohesive and optimized
  setSessionCache(spreadsheetId, data);
}

/**
 * Downloads data from the Google Spreadsheet and parses it into local structure.
 */
export async function downloadDataFromSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<LocalData> {
  // Check session cache first to minimize spreadsheet read requests
  const cached = getSessionCache(spreadsheetId);
  if (cached) {
    return cached;
  }

  await ensureSheetsExist(accessToken, spreadsheetId);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Transaksi!A1:H1000&ranges=Piutang!A1:I1000&ranges=Utang!A1:I1000&ranges=Sesi%20Kasir!A1:D1000`;
  const response = await apiCall(url, { method: 'GET' }, accessToken);

  const valueRanges = response.valueRanges || [];
  
  // Find ranges by index or name
  const transactionValues = valueRanges[0]?.values || [];
  const receivableValues = valueRanges[1]?.values || [];
  const payableValues = valueRanges[2]?.values || [];
  const sessionValues = valueRanges[3]?.values || [];

  // Parse Transactions
  const transactions: Transaction[] = [];
  if (transactionValues.length > 1) {
    for (let i = 1; i < transactionValues.length; i++) {
      const row = transactionValues[i];
      if (row[0] && row[1]) {
        transactions.push({
          id: row[0],
          date: row[1],
          time: row[2] || '00:00',
          description: row[3] || '',
          type: row[4] === 'keluar' ? 'keluar' : 'masuk',
          category: row[5] === 'insidental' ? 'insidental' : 'rutin',
          amount: parseFloat(row[6]) || 0,
          hpp: row[7] !== '' && !isNaN(parseFloat(row[7])) ? parseFloat(row[7]) : undefined,
        });
      }
    }
  }

  // Parse Receivables
  const receivables: Receivable[] = [];
  if (receivableValues.length > 1) {
    for (let i = 1; i < receivableValues.length; i++) {
      const row = receivableValues[i];
      if (row[0] && row[1]) {
        const amount = parseFloat(row[5]) || 0;
        const paidAmount = parseFloat(row[6]) || 0;
        let status: 'belum_lunas' | 'dicicil' | 'lunas' = 'belum_lunas';
        if (paidAmount >= amount) {
          status = 'lunas';
        } else if (paidAmount > 0) {
          status = 'dicicil';
        }

        receivables.push({
          id: row[0],
          customerName: row[1],
          date: row[2] || '',
          dueDate: row[3] || '',
          description: row[4] || '',
          amount,
          paidAmount,
          status,
          whatsappNumber: row[8] || undefined,
        });
      }
    }
  }

  // Parse Payables
  const payables: Payable[] = [];
  if (payableValues.length > 1) {
    for (let i = 1; i < payableValues.length; i++) {
      const row = payableValues[i];
      if (row[0] && row[1]) {
        const amount = parseFloat(row[5]) || 0;
        const paidAmount = parseFloat(row[6]) || 0;
        let status: 'belum_lunas' | 'dicicil' | 'lunas' = 'belum_lunas';
        if (paidAmount >= amount) {
          status = 'lunas';
        } else if (paidAmount > 0) {
          status = 'dicicil';
        }

        payables.push({
          id: row[0],
          supplierName: row[1],
          date: row[2] || '',
          dueDate: row[3] || '',
          description: row[4] || '',
          amount,
          paidAmount,
          status,
          whatsappNumber: row[8] || undefined,
        });
      }
    }
  }

  // Parse Sessions
  const sessions: Record<string, DailyCashSession> = {};
  if (sessionValues.length > 1) {
    for (let i = 1; i < sessionValues.length; i++) {
      const row = sessionValues[i];
      if (row[0]) {
        sessions[row[0]] = {
          date: row[0],
          openingPettyCash: parseFloat(row[1]) || 150000,
          openingPhysicalCash: parseFloat(row[2]) || 150000,
          closingPhysicalCash: row[3] !== undefined && row[3] !== '' ? parseFloat(row[3]) : undefined,
        };
      }
    }
  }

  const result: LocalData = {
    sessions,
    transactions,
    receivables,
    payables,
  };

  setSessionCache(spreadsheetId, result);
  return result;
}
