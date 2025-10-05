import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">ResumeRAG</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/upload"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Upload
              </Link>
              <Link
                to="/search"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Search
              </Link>
              <Link
                to="/jobs"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Jobs
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">
              {user?.email} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
