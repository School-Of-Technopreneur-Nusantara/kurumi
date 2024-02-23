export const sheetId = process.env.SHEET_ID;
if (sheetId === undefined) throw new Error("SHEET_ID is must be present !");

export const groupId = process.env.GROUP_ID;
if (groupId === undefined) throw new Error("GROUP_ID is must be present !");