import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 📁 Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// 🧰 Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// 🧠 OCR Helper function
const extractText = async (imagePath) => {
  const { data } = await Tesseract.recognize(imagePath, "eng", {
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?()[]{}✓✔√*- ",
  });
  return data.text.normalize("NFKC");
};

// 🔍 Extract the correct answer
function extractCorrectAnswer(answerText, options) {
  let text = answerText
    .replace(/\s+/g, " ")
    .replace(/[√]/g, "✓")
    .replace(/[*]/g, "✓")
    .toUpperCase();

  console.log("🧾 OCR Raw Answer Text:", text);

  // Handle OCR misreads
  text = text.replace(/\bV\b/g, "✓");
  text = text.replace(/\bY\b/g, "✓");
  text = text.replace(/CHECK|SELECTED|TICK|MARKED/gi, "✓");

  const patterns = [
    /([A-D])[\.\)]?\s?[A-Z\s]*[✓✔]/, // Example: “C. PARIS ✓”
    /([A-D])[\.\)]?\s?[✓✔]/, // Example: “C ✓”
    /CORRECT\s*[:\-]?\s*([A-D])/, // Example: “Correct: C”
    /ANSWER\s*[:\-]?\s*([A-D])/, // Example: “Answer: C”
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const letter = match[1].toUpperCase();
      const answer = options[letter] || "Not found";
      console.log(`✅ Detected correct answer: ${letter} (${answer})`);
      return `${letter}. ${answer}`;
    }
  }

  console.log("⚠️ No matching correct answer pattern found");
  return "Unknown";
}

// 🧩 Main processing route
app.post(
  "/api/process",
  upload.fields([
    { name: "questionImage", maxCount: 1 },
    { name: "answerImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files?.questionImage || !req.files?.answerImage) {
        return res.status(400).json({ error: "Both images are required" });
      }

      const questionImage = req.files["questionImage"][0].path;
      const answerImage = req.files["answerImage"][0].path;

      console.log("📸 Received images:", questionImage, answerImage);

      const [questionText, answerText] = await Promise.all([
        extractText(questionImage),
        extractText(answerImage),
      ]);

      console.log("🧩 OCR extraction complete!");

      // Extract question and options
      const questionLines = questionText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const options = questionLines
        .filter((l) => /^[A-D]\./i.test(l))
        .reduce((acc, line) => {
          const [key, ...val] = line.split(".");
          acc[key.trim().toUpperCase()] = val.join(".").trim();
          return acc;
        }, {});

      const responseData = {
        question:
          questionLines.find((l) => !/^[A-D]\./i.test(l)) ||
          "Question not found",
        options,
        correct_answer: extractCorrectAnswer(answerText, options),
      };
// ✅ Send JSON as downloadable file
      res.setHeader("Content-Disposition", "attachment; filename=mcq.json");
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(responseData, null, 2));

      // 🧹 Cleanup temporary files
      fs.unlinkSync(questionImage);
      fs.unlinkSync(answerImage);
    } catch (err) {
      console.error("❌ Error processing images:", err);
      res.status(500).json({ error: "Failed to process images." });
    }
  }
);

// 🚀 Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
