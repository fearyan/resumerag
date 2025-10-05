import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Search from './pages/Search';
import Jobs from './pages/Jobs';
import Navigation from './components/Navigation';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navigation />}
      
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/upload" />} />
        <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/login" />} />
        <Route path="/search" element={isAuthenticated ? <Search /> : <Navigate to="/login" />} />
        <Route path="/jobs" element={isAuthenticated ? <Jobs /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/upload" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
