const express = require("express");
const router = express.Router();
const { parseOfficeAsync } = require("officeparser");
const multer = require("multer");
const upload = multer();

const SUPPORTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/pdf", // PDF
];

router.post("/parse-document", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ error: "Please upload a DOCX or PDF file" });
    }

    const arrayBuffer = file.buffer;

    const config = {
      outputErrorToConsole: false,
      newlineDelimiter: "\n",
      ignoreNotes: false,
      putNotesAtLast: false,
    };

    const content = await parseOfficeAsync(Buffer.from(arrayBuffer), config);
    // const result = await structuredResume(content);
    return res.json({ content: content, filename: file.originalname });
  } catch (error) {
    console.error("Document parsing error:", error);
    return res.status(500).json({ error: "Failed to parse document" });
  }
});

module.exports = router;
