import { google } from "googleapis"

// Google Sheets APIクライアントの初期化
export function getGoogleSheetsClient() {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  )
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Google Sheets API credentials are not set in environment variables",
    )
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  return google.sheets({ version: "v4", auth })
}

// スプレッドシートIDの取得
export function getSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  if (!spreadsheetId) {
    throw new Error(
      "GOOGLE_SHEETS_SPREADSHEET_ID is not set in environment variables",
    )
  }
  return spreadsheetId
}

// シートからデータを取得
export async function getSheetData(sheetName: string, range?: string) {
  const sheets = getGoogleSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const fullRange = range ? `${sheetName}!${range}` : sheetName

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: fullRange,
    })

    return response.data.values || []
  } catch (error) {
    console.error(`Error fetching data from sheet ${sheetName}:`, error)
    throw error
  }
}

// シートにデータを追加
export async function appendSheetData(sheetName: string, values: unknown[][]) {
  const sheets = getGoogleSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error appending data to sheet ${sheetName}:`, error)
    throw error
  }
}

// シートのデータを更新
export async function updateSheetData(
  sheetName: string,
  range: string,
  values: unknown[][],
) {
  const sheets = getGoogleSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${range}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error updating data in sheet ${sheetName}:`, error)
    throw error
  }
}

// 行を削除（特定の範囲をクリア）
export async function clearSheetRange(sheetName: string, range: string) {
  const sheets = getGoogleSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  try {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    })

    return response.data
  } catch (error) {
    console.error(`Error clearing range in sheet ${sheetName}:`, error)
    throw error
  }
}
