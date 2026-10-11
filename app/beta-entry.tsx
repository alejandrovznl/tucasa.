'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { endBetaSession, startBetaSession, type BetaSession } from '@/lib/beta-workspace';
import TuCasaApp from './tucasa-app';

export default function BetaEntry() {
  const [session, setSession] = useState<BetaSession | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState('');

  function login(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!username.trim()) { setError('Escribe un usuario para ingresar.'); return; }
    if (!password) { setError('Escribe una contraseña para ingresar.'); return; }
    // Demo credentials: the password is never persisted or sent to a server.
    try {
      setSession(startBetaSession(window.localStorage, username));
      setPassword(''); setShowPassword(false);
    }
    catch { setError('Permite el almacenamiento de este sitio en tu navegador y vuelve a intentarlo.'); }
  }
  function logout() {
    try { endBetaSession(window.localStorage); } catch { /* Still return to the entry screen. */ }
    setSession(null); setUsername(''); setPassword(''); setShowPassword(false); setShowRecovery(false); setError('');
  }
  if (session) return <TuCasaApp key={session.id} displayName={session.name} betaSession={session} onSignOut={logout} />;

  return <main className="beta-entry-page">
    <header className="beta-entry-header"><span className="beta-entry-brand"><img src="/brand.png" alt="TuCasa" width={274} height={274} /></span></header>
    <section className="beta-entry-card" aria-labelledby="beta-entry-title">
      <h1 id="beta-entry-title">Iniciar sesión</h1>
      <form onSubmit={login} className="beta-entry-form">
        <div className="beta-entry-field">
          <label htmlFor="beta-username">Usuario</label>
          <input id="beta-username" name="username" type="text" required maxLength={80} autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={event => { setUsername(event.target.value); setError(''); }} placeholder="Escribe tu usuario" />
        </div>
        <div className="beta-entry-field">
          <label htmlFor="beta-password">Contraseña</label>
          <div className="beta-entry-password">
            <input id="beta-password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="off" value={password} onChange={event => { setPassword(event.target.value); setError(''); }} placeholder="Escribe tu contraseña" />
            <button className="beta-entry-password-toggle" type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} aria-controls="beta-password" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>
        </div>
        {error && <p className="beta-entry-error" role="alert">{error}</p>}
        <Button type="submit" className="primary-button beta-entry-submit">Iniciar sesión</Button>
      </form>
      <button type="button" className="beta-entry-recovery" aria-expanded={showRecovery} aria-controls="beta-recovery-help" onClick={() => setShowRecovery(value => !value)}>¿Olvidaste tu contraseña?</button>
      {showRecovery && <p id="beta-recovery-help" className="beta-entry-recovery-help" role="status">En esta beta puedes ingresar con cualquier usuario y contraseña.</p>}
    </section>
    <footer className="beta-entry-footer">TuCasa · Búsqueda para profesionales inmobiliarios</footer>
  </main>;
}
