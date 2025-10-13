import React from "react";

interface Props {
  title: string;
  description: string;
  icon: string;
  onFileChange: (file: File | null) => void;
}

const QuestionUploader: React.FC<Props> = ({ title, description, icon, onFileChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="border-2 border-dashed border-indigo-300 bg-gray-50 hover:bg-gray-100 transition-all rounded-2xl w-full md:w-1/2 p-6 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
      />
    </div>
  );
};

export default QuestionUploader;
