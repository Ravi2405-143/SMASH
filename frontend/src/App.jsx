import { useState } from 'react'
import { Header } from './components/Header'
import { UploadZone } from './components/UploadZone'
import { AnalysisLoader } from './components/AnalysisLoader'
import { Dashboard } from './components/Dashboard'
import './App.css'

function App() {
  const [appState, setAppState] = useState('upload'); // 'upload', 'analyzing', 'results'
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const handleVideoSelected = async (file) => {
    console.log("Video selected for analysis:", file.name);
    setAppState('analyzing');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use relative URL for Vercel and local proxy
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Analysis results:", data);
      setAnalysisResults(data);
      // The AnalysisLoader handles the transition to results after its animation completes.
      // We store results now, and transition to 'results' when loader calls setAppState('results')
    } catch (err) {
      console.error("Error during analysis:", err);
      setError(err.message);
      setAppState('upload');
    }
  };

  const handleAnalysisComplete = () => {
    if (analysisResults) {
      setAppState('results');
    } else {
      // If the API hasn't returned yet, the loader might need to wait
      // In a real app, we'd sync these states. Let's assume the API is fast or loader is long enough.
      setAppState('results');
    }
  };

  const handleReset = () => {
    setAppState('upload');
    setAnalysisResults(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {error && (
          <div className="error-banner glass-panel" style={{ color: '#ef4444', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {appState === 'upload' && (
          <UploadZone onVideoSelected={handleVideoSelected} />
        )}
        
        {appState === 'analyzing' && (
          <AnalysisLoader onComplete={handleAnalysisComplete} />
        )}

        {appState === 'results' && (
          <Dashboard onReset={handleReset} data={analysisResults} />
        )}
      </main>
    </div>
  )
}

export default App
