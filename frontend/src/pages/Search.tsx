import { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, k: 10 }),
      });

      const data = await response.json();
      setResults(data.answers || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Semantic Search</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., Find Python developers with ML experience"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result, idx) => (
          <div key={idx} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {result.candidate_name}
              </h3>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                Score: {(result.relevance_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-gray-700 text-sm mb-3">{result.snippet}</p>
            <p className="text-gray-500 text-xs">
              File: {result.metadata.filename}
            </p>
          </div>
        ))}

        {results.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            Enter a search query to find candidates
          </div>
        )}
      </div>
    </div>
  );
}
