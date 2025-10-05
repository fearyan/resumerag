import { useState } from 'react';

export default function Upload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files) return;

    setUploading(true);
    setMessage('');

    try {
const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/resumes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setMessage(`Successfully uploaded ${data.resumes.length} resume(s)`);
      setFiles(null);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Resumes</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select files (PDF, DOCX, TXT, or ZIP)
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.zip"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {files && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">Selected files:</p>
            <ul className="list-disc list-inside">
              {Array.from(files).map((file, idx) => (
                <li key={idx} className="text-sm">{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!files || uploading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>

        {message && (
          <div className={`mt-4 p-4 rounded ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
