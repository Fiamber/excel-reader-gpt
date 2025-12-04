import xlsx from "xlsx";

export default function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ error: "Missing file" });
    }

    const workbook = xlsx.read(file, { type: "base64" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet);

    res.status(200).json({ data: json });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
