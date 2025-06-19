import { createLazyFileRoute } from "@tanstack/react-router";

import { Plate, usePlateEditor } from "platejs/react";
import { useEffect } from "react";

import { EditorKit } from "~/components/editor-kit";
// import { SettingsDialog } from "~/components/editor/settings-dialog";
import { Editor, EditorContainer } from "~/components/ui/editor";
import { value } from "./-default-value";

export const Route = createLazyFileRoute("/editor/")({
  component: PlateEditor,
  pendingComponent: () => <div>Loading editor... Please wait!</div>,
});

export function PlateEditor() {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value,
  });

  useEffect(() => {
    console.warn("PlateEditor mounted with initial value:", value);
  }, []);

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor variant="demo" />
      </EditorContainer>

      {/* <SettingsDialog /> */}
    </Plate>
  );
}
