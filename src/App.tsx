import React, { useState } from "react";
import axios from "axios";
import { Download } from "lucide-react";
import QuestionUploader from "./components/QuestionUploader";

interface QuestionData {
  question: string;
  options: Record<string, string>;
  correct_answer: string;
}

const App: React.FC = () => {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [result, setResult] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!questionFile || !answerFile) {
      alert("Please upload both screenshots!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("questionImage", questionFile);
    formData.append("answerImage", answerFile);

    try {
      // ✅ Updated endpoint to match backend
      const response = await axios.post("https://YOUR-BACKEND-URL.onrender.com/api/process", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });



      setResult(response.data.data);
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Failed to process images.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get("http://localhost:5000/download-json", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "cbt_questions.json");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("❌ Error downloading JSON:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-600 flex flex-col items-center py-10 px-4 text-gray-800">
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-white mb-3">CBT Question Extractor</h1>
      <p className="text-white text-lg mb-10 text-center max-w-2xl">
        Upload two screenshots to automatically extract questions, options, and correct answers
      </p>

      {/* Upload Area */}
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 w-full max-w-4xl flex flex-col items-center">
        <div className="flex flex-col md:flex-row justify-center gap-8 w-full">
          <QuestionUploader
            title="Question Screenshot"
            description="Upload image with question and all options"
            icon="📄"
            onFileChange={setQuestionFile}
          />
          <QuestionUploader
            title="Answer Screenshot"
            description="Upload image with correct answer marked"
            icon="✅"
            onFileChange={setAnswerFile}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className={`mt-8 px-10 py-3 rounded-xl font-semibold text-white text-lg transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90"
          }`}
        >
          {loading ? "Processing..." : "🚀 Process Screenshots"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-10 bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">Extracted Result</h2>
          <p className="font-medium mb-3">
            <span className="font-bold">Question:</span> {result.question}
          </p>
          <ul className="list-disc ml-5 space-y-1">
            {Object.entries(result.options).map(([key, val]) => (
              <li key={key}>
                <strong>{key}.</strong> {val}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-green-600 font-semibold">
            ✅ Correct Answer: {result.correct_answer}
          </p>

          <button
            onClick={handleDownload}
            className="mt-6 flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-all"
          >
            <Download size={18} /> Download JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
