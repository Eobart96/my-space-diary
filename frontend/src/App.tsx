import { Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AppLauncher from './components/AppLauncher';
import Diary from './pages/Diary';
import Nutrition from './pages/Nutrition';
import Settings from './components/Settings';

function App() {
    return (
        <SettingsProvider>
            <LanguageProvider>
                <Routes>
                    <Route path="/" element={<AppLauncher />} />
                    <Route path="/diary" element={<Diary />} />
                    <Route path="/nutrition" element={<Nutrition />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </LanguageProvider>
        </SettingsProvider>
    );
}

export default App;
