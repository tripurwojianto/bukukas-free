import { BukuKasData, ShopProfile, Category, Penjualan, Pengeluaran, Kasbon, PembayaranKasbon, Pelanggan, AppLog } from '../types';

const SPREADSHEET_NAME = 'BukuKas_Free_Database';

/**
 * Find the database spreadsheet in user's Google Drive.
 * Returns the spreadsheet ID, or null if not found.
 */
export async function findSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error finding spreadsheet:', errText);
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('findSpreadsheet failed:', error);
    throw error;
  }
}

/**
 * Create a new spreadsheet with the correct worksheets (tabs).
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const body = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      { properties: { title: 'Setting' } },
      { properties: { title: 'Kategori' } },
      { properties: { title: 'Penjualan' } },
      { properties: { title: 'Pengeluaran' } },
      { properties: { title: 'Kasbon' } },
      { properties: { title: 'PembayaranKasbon' } },
      { properties: { title: 'Pelanggan' } },
      { properties: { title: 'Log' } },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error creating spreadsheet:', errText);
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;

    // Initialize spreadsheet headers
    await initializeHeaders(accessToken, spreadsheetId);

    return spreadsheetId;
  } catch (error) {
    console.error('createSpreadsheet failed:', error);
    throw error;
  }
}

/**
 * Initialize headers for all worksheets.
 */
async function initializeHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Setting!A1:B1', values: [['Key', 'Value']] },
      { range: 'Kategori!A1:C1', values: [['ID', 'Tipe', 'Nama']] },
      { range: 'Penjualan!A1:E1', values: [['ID', 'Tanggal', 'Kategori', 'Nominal', 'Keterangan']] },
      { range: 'Pengeluaran!A1:E1', values: [['ID', 'Tanggal', 'Kategori', 'Nominal', 'Keterangan']] },
      { range: 'Kasbon!A1:F1', values: [['ID', 'Nama Pelanggan', 'Nomor WA', 'Tanggal', 'Nominal', 'Status']] },
      { range: 'PembayaranKasbon!A1:E1', values: [['ID', 'ID Kasbon', 'Nama Pelanggan', 'Tanggal', 'Nominal']] },
      { range: 'Pelanggan!A1:B1', values: [['Nama', 'Nomor WA']] },
      { range: 'Log!A1:B1', values: [['Timestamp', 'Aktivitas']] },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Error initializing headers:', errText);
    throw new Error(`Google Sheets API error writing headers: ${response.statusText}`);
  }
}

/**
 * Fetch all data from the spreadsheet.
 */
export async function fetchBukuKasData(accessToken: string, spreadsheetId: string): Promise<Partial<BukuKasData>> {
  // We specify range to get content (A2:F means columns A to F starting from row 2)
  const ranges = [
    'Setting!A2:B100',
    'Kategori!A2:C1000',
    'Penjualan!A2:E10000',
    'Pengeluaran!A2:E10000',
    'Kasbon!A2:F10000',
    'PembayaranKasbon!A2:E10000',
    'Pelanggan!A2:B10000',
    'Log!A2:B10000',
  ];

  const rangesQuery = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error fetching sheets data:', errText);
      throw new Error(`Google Sheets API batchGet error: ${response.statusText}`);
    }

    const data = await response.json();
    const valueRanges = data.valueRanges || [];

    const result: Partial<BukuKasData> = {};

    // 1. Setting
    const settingValues = valueRanges[0]?.values || [];
    const profileObj: Partial<ShopProfile> = {};
    settingValues.forEach((row: string[]) => {
      if (row.length >= 2) {
        const key = row[0];
        const val = row[1];
        if (key === 'name') profileObj.name = val;
        if (key === 'ownerName') profileObj.ownerName = val;
        if (key === 'logo') profileObj.logo = val;
        if (key === 'phone') profileObj.phone = val;
        if (key === 'address') profileObj.address = val;
        if (key === 'email') profileObj.email = val;
      }
    });
    if (Object.keys(profileObj).length > 0) {
      result.profile = profileObj as ShopProfile;
    }

    // 2. Kategori
    const categoryValues = valueRanges[1]?.values || [];
    result.categories = categoryValues.map((row: string[]): Category => ({
      id: row[0] || '',
      type: (row[1] === 'penjualan' ? 'penjualan' : 'pengeluaran') as 'penjualan' | 'pengeluaran',
      name: row[2] || '',
    }));

    // 3. Penjualan
    const penjualanValues = valueRanges[2]?.values || [];
    result.penjualan = penjualanValues.map((row: string[]): Penjualan => ({
      id: row[0] || '',
      date: row[1] || '',
      category: row[2] || '',
      amount: parseFloat(row[3]) || 0,
      notes: row[4] || '',
    }));

    // 4. Pengeluaran
    const pengeluaranValues = valueRanges[3]?.values || [];
    result.pengeluaran = pengeluaranValues.map((row: string[]): Pengeluaran => ({
      id: row[0] || '',
      date: row[1] || '',
      category: row[2] || '',
      amount: parseFloat(row[3]) || 0,
      notes: row[4] || '',
    }));

    // 5. Kasbon
    const kasbonValues = valueRanges[4]?.values || [];
    result.kasbon = kasbonValues.map((row: string[]): Kasbon => ({
      id: row[0] || '',
      customerName: row[1] || '',
      phone: row[2] || '',
      date: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      status: (row[5] === 'Lunas' ? 'Lunas' : 'Belum Lunas') as 'Lunas' | 'Belum Lunas',
    }));

    // 6. PembayaranKasbon
    const pembayaranValues = valueRanges[5]?.values || [];
    result.pembayaranKasbon = pembayaranValues.map((row: string[]): PembayaranKasbon => ({
      id: row[0] || '',
      kasbonId: row[1] || '',
      customerName: row[2] || '',
      date: row[3] || '',
      amount: parseFloat(row[4]) || 0,
    }));

    // 7. Pelanggan
    const pelangganValues = valueRanges[6]?.values || [];
    result.pelanggan = pelangganValues.map((row: string[]): Pelanggan => ({
      name: row[0] || '',
      phone: row[1] || '',
    }));

    // 8. Log
    const logValues = valueRanges[7]?.values || [];
    result.logs = logValues.map((row: string[]): AppLog => ({
      timestamp: row[0] || '',
      activity: row[1] || '',
    }));

    return result;
  } catch (error) {
    console.error('fetchBukuKasData failed:', error);
    throw error;
  }
}

/**
 * Backup entire local database to Google Sheets.
 * Overwrites all sheets (tabs).
 */
export async function backupBukuKasData(
  accessToken: string,
  spreadsheetId: string,
  data: BukuKasData
): Promise<void> {
  try {
    // 1. Clear existing data in rows A2:Z10000 on all sheets
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;
    const clearBody = {
      ranges: [
        'Setting!A2:B100',
        'Kategori!A2:C1000',
        'Penjualan!A2:E10000',
        'Pengeluaran!A2:E10000',
        'Kasbon!A2:F10000',
        'PembayaranKasbon!A2:E10000',
        'Pelanggan!A2:B10000',
        'Log!A2:B10000',
      ],
    };

    const clearRes = await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clearBody),
    });

    if (!clearRes.ok) {
      throw new Error(`Google Sheets clear failed: ${clearRes.statusText}`);
    }

    // 2. Prepare new values for write
    const settingRows = [
      ['name', data.profile.name || ''],
      ['ownerName', data.profile.ownerName || ''],
      ['logo', data.profile.logo || ''],
      ['phone', data.profile.phone || ''],
      ['address', data.profile.address || ''],
      ['email', data.profile.email || ''],
    ];

    const categoryRows = data.categories.map(c => [c.id, c.type, c.name]);
    const penjualanRows = data.penjualan.map(p => [p.id, p.date, p.category, p.amount.toString(), p.notes]);
    const pengeluaranRows = data.pengeluaran.map(p => [p.id, p.date, p.category, p.amount.toString(), p.notes]);
    const kasbonRows = data.kasbon.map(k => [k.id, k.customerName, k.phone, k.date, k.amount.toString(), k.status]);
    const pembayaranRows = data.pembayaranKasbon.map(p => [p.id, p.kasbonId, p.customerName, p.date, p.amount.toString()]);
    const pelangganRows = data.pelanggan.map(p => [p.name, p.phone]);
    const logRows = data.logs.map(l => [l.timestamp, l.activity]);

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const updateBody = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Setting!A2:B${settingRows.length + 1}`, values: settingRows },
        { range: `Kategori!A2:C${categoryRows.length + 1}`, values: categoryRows.length ? categoryRows : [['', '', '']] },
        { range: `Penjualan!A2:E${penjualanRows.length + 1}`, values: penjualanRows.length ? penjualanRows : [['', '', '', '', '']] },
        { range: `Pengeluaran!A2:E${pengeluaranRows.length + 1}`, values: pengeluaranRows.length ? pengeluaranRows : [['', '', '', '', '']] },
        { range: `Kasbon!A2:F${kasbonRows.length + 1}`, values: kasbonRows.length ? kasbonRows : [['', '', '', '', '', '']] },
        { range: `PembayaranKasbon!A2:E${pembayaranRows.length + 1}`, values: pembayaranRows.length ? pembayaranRows : [['', '', '', '', '']] },
        { range: `Pelanggan!A2:B${pelangganRows.length + 1}`, values: pelangganRows.length ? pelangganRows : [['', '']] },
        { range: `Log!A2:B${logRows.length + 1}`, values: logRows.length ? logRows : [['', '']] },
      ],
    };

    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error('Error writing batch update:', errText);
      throw new Error(`Google Sheets update failed: ${updateRes.statusText}`);
    }
  } catch (error) {
    console.error('backupBukuKasData failed:', error);
    throw error;
  }
}

/**
 * Find the backup JSON file in user's Google Drive.
 * Returns the file ID, or null if not found.
 */
export async function findDriveBackupFile(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'BukuKas_Backup_Database.json' and mimeType = 'application/json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error finding backup file:', errText);
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('findDriveBackupFile failed:', error);
    throw error;
  }
}

/**
 * Backup the entire local database as a JSON file to Google Drive.
 */
export async function backupDataToGoogleDrive(accessToken: string, data: BukuKasData): Promise<void> {
  try {
    // 1. Check if the backup file already exists
    let fileId = await findDriveBackupFile(accessToken);

    if (fileId) {
      // 2. If exists, update content using PATCH
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        console.error('Error updating backup file on Drive:', errText);
        throw new Error(`Google Drive API update error: ${uploadResponse.statusText}`);
      }
    } else {
      // 3. If not exists, create the file metadata first
      const createUrl = 'https://www.googleapis.com/drive/v3/files';
      const metadata = {
        name: 'BukuKas_Backup_Database.json',
        mimeType: 'application/json',
      };

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        console.error('Error creating backup file metadata on Drive:', errText);
        throw new Error(`Google Drive API create error: ${createResponse.statusText}`);
      }

      const fileData = await createResponse.json();
      fileId = fileData.id;

      // 4. Upload the content using PATCH with media
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        console.error('Error uploading initial content to Drive:', errText);
        throw new Error(`Google Drive API upload error: ${uploadResponse.statusText}`);
      }
    }
  } catch (error) {
    console.error('backupDataToGoogleDrive failed:', error);
    throw error;
  }
}

/**
 * Restore the database from the JSON backup file on Google Drive.
 */
export async function restoreDataFromGoogleDrive(accessToken: string): Promise<BukuKasData> {
  try {
    const fileId = await findDriveBackupFile(accessToken);
    if (!fileId) {
      throw new Error('File cadangan BukuKas_Backup_Database.json tidak ditemukan di Google Drive Anda.');
    }

    // Get the file content
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error downloading backup from Drive:', errText);
      throw new Error(`Gagal mengunduh file cadangan: ${response.statusText}`);
    }

    const data = await response.json();
    return data as BukuKasData;
  } catch (error) {
    console.error('restoreDataFromGoogleDrive failed:', error);
    throw error;
  }
}
