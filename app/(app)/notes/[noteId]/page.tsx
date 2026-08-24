import { NoteEditor } from "@/components/notes/note-editor";

export const metadata = { title: "笔记" };

interface NotePageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { noteId } = await params;
  return <NoteEditor noteId={noteId} />;
}
