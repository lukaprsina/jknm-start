import { createLazyFileRoute } from "@tanstack/react-router";

import { Plate, usePlateEditor } from "platejs/react";
import { useEffect } from "react";

import { Value } from "platejs";
import { EditorKit } from "~/components/editor-kit";
import { Button } from "~/components/ui/button";
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

  // Function to set new content
  const setEditorContent = (newValue: Value) => {
    // This is the recommended way to replace editor content
    editor.tf.setValue(newValue);
  };

  // Example of setting new content
  const loadNewContent = () => {
    const newContent = [
      {
        type: "h1",
        children: [{ text: "New Title" }],
      },
      {
        type: "p",
        children: [{ text: "This is new content loaded dynamically." }],
      },
    ];

    setEditorContent(newContent);
  };

  useEffect(() => {
    console.warn("PlateEditor mounted with initial value:", value);
  }, []);

  return (
    <>
      <Button onClick={() => console.log({ children: editor.children })}>
        Log contents
      </Button>
      <Button onClick={loadNewContent}>Load New Content</Button>
      <Plate editor={editor}>
        <EditorContainer>
          <Editor variant="demo" />
        </EditorContainer>
      </Plate>
    </>
  );
}
