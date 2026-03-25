import {createRoot} from 'react-dom/client';
import { AppWithAuth } from './AppWithAuth.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AppWithAuth />
);
