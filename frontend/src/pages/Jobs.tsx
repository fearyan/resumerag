import { useState, useEffect } from 'react';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/jobs?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setJobs(data.items || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleMatch = async (jobId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/jobs/${jobId}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ top_n: 10 }),
      });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Match failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Jobs & Matching</h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                  selectedJob?.id === job.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {job.required_skills?.slice(0, 3).map((skill: string, idx: number) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedJob && (
            <>
              <div className="bg-white shadow rounded-lg p-6 mb-4">
                <h2 className="text-xl font-semibold mb-2">{selectedJob.title}</h2>
                <p className="text-gray-700 mb-4">{selectedJob.description}</p>
                <p className="text-sm text-gray-600 mb-2">
                  Experience Required: {selectedJob.experience_required} years
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedJob.required_skills?.map((skill: string, idx: number) => (
                    <span key={idx} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleMatch(selectedJob.id)}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Finding Matches...' : 'Find Matching Candidates'}
                </button>
              </div>

              {matches.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Top Matches</h3>
                  <div className="space-y-3">
                    {matches.map((match, idx) => (
                      <div key={idx} className="bg-white shadow rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{match.candidate_name}</h4>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            {match.match_score}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{match.evidence}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-600">
                            ✓ {match.matching_skills?.length || 0} skills
                          </span>
                          {match.experience_match && (
                            <span className="text-green-600">✓ Experience match</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedJob && (
            <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-500">
              Select a job to view details and find matches
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
