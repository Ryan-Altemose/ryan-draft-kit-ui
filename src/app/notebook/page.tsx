import { requireAuthenticatedUser } from '@/features/Auth/server/require-auth';
import NotebookPage from '@/features/Notebook/notebookpage';

export default async function Page() {
  await requireAuthenticatedUser('/notebook');
  return <NotebookPage />;
}
