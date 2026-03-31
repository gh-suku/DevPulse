/**
 * Browser Warning Component
 * 
 * Shows a warning message for unsupported browsers
 * Related to Issue #73: Browser Compatibility
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { shouldShowBrowserWarning, getBrowserInfo, supportedBrowsers } from '../../lib/browserSupport';

export function BrowserWarning() {
  const [show, setShow] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof getBrowserInfo> | null>(null);

  useEffect(() => {
    if (shouldShowBrowserWarning()) {
      setShow(true);
      setBrowserInfo(getBrowserInfo());
    }
  }, []);

  if (!show || !browserInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close warning"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start mb-4">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Unsupported Browser
            </h2>
            <p className="text-gray-600 text-sm">
              You are using {browserInfo.name} {browserInfo.version}, which may not support all features of this application.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Recommended Browsers:</h3>
          <ul className="space-y-1">
            {supportedBrowsers.tier1.map((browser) => (
              <li key={browser} className="text-sm text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {browser}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> Some features may not work correctly, including:
          </p>
          <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
            <li>Service Workers (offline support)</li>
            <li>Push Notifications</li>
            <li>Advanced CSS features</li>
            <li>Modern JavaScript features</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShow(false)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Continue Anyway
          </button>
          <a
            href="https://browsehappy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-center"
          >
            Update Browser
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          This warning can be dismissed, but we recommend updating your browser for the best experience.
        </p>
      </div>
    </div>
  );
}

export default BrowserWarning;
