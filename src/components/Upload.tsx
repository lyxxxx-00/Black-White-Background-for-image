import { useState, useEffect } from "react";
import {
  FileInput,
  FileInputItem,
  Button,
  Rows,
  Text,
  Title,
  Box,
} from "@canva/app-ui-kit";

interface UploadProps {
  onImageUrlChange: (url: string) => void;
}

const Upload = ({ onImageUrlChange }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const onDropAcceptedFiles = (files: File[]) => {
    if (files.length === 1) {
      const selectedFile = files[0];
      setFile(selectedFile);

      // Revoke the old object URL if it exists
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      // Create a new object URL and update the state
      const url = URL.createObjectURL(selectedFile);
      setObjectUrl(url);
      onImageUrlChange(url);
    }
  };

  const handleDeleteClick = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setFile(null);
    setObjectUrl(null);
    onImageUrlChange("");
  };

  useEffect(() => {
    // Cleanup function to revoke the object URL when the component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <Box alignItems="stretch" padding="1u" paddingEnd="3u">
      <Box paddingY="1.5u">
        <Title size="small">Upload your image</Title>
      </Box>
      <Rows spacing="1u" align="stretch">
        <FileInput
          onDropAcceptedFiles={onDropAcceptedFiles}
          onDropRejectedFiles={() => {}}
          stretchButton
          accept={["image/*"]}
        />
        {file && (
          <FileInputItem label={file.name} onDeleteClick={handleDeleteClick} />
        )}
      </Rows>
    </Box>
  );
};

export { Upload };
