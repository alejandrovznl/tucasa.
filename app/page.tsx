import BetaEntry from './beta-entry';
export const dynamic = 'force-dynamic';
export default function Home() {
  // This entry is a public demonstration, not a platform sign-in flow.
  // Existing private server workspaces retain their identity checks.
  return <BetaEntry />;
}
