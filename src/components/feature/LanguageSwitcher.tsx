import { useState } from 'react';
import { languages, useTranslation, saveLanguagePreference, loadLanguagePreference } from '../../lib/i18n';

export default function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState(loadLanguagePreference());
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useTranslation(currentLanguage);

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    saveLanguagePreference(languageCode);
    setIsOpen(false);
    // Recarregar a página para aplicar o novo idioma
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Alterar idioma"
      >
        <span className="text-2xl">{language.flag}</span>
        <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-300">
          {language.code.split('-')[0].toUpperCase()}
        </span>
        <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line text-gray-600 dark:text-gray-400`}></i>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Selecionar Idioma
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentLanguage === lang.code
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="flex-1 text-left text-sm">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <i className="ri-check-line text-blue-600 dark:text-blue-400"></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
