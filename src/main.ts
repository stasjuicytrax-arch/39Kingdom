import './styles/global.css';
import './styles/placeholder.css';
import { mountGrain } from './lib/grain';

const symbolUrl = `${import.meta.env.BASE_URL}img/brand/symbol-480.png`;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="placeholder">
    <img class="placeholder__symbol" src="${symbolUrl}" alt="39 KINGDOM symbol" width="160" height="160" />
    <h1 class="placeholder__wordmark">39KINGDOM</h1>
    <p class="placeholder__meta">PRESS KIT 2026 — WELCOME TO OUR KINGDOM</p>
  </div>
`;

mountGrain();
