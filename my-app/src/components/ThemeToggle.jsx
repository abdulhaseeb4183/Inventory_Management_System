import '../styles/ThemeToggle.css';

export default function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button 
      className="theme-toggle-btn"
      onClick={() => setDarkMode(!darkMode)}
    >
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}