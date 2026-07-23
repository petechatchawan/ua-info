import { createPlaygroundApp } from './app/create-playground-app';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/utilities.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Playground root element was not found.');

const app = createPlaygroundApp();
root.append(app.element);
app.start();
