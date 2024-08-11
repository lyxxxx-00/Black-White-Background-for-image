import React, { useState } from "react";
import { Upload } from "./components/Upload";
import { ImageEditor } from "./components/ImageEditor";

export const App = () => {
  const [imageUrl, setImageUrl] = useState<string>("");

  return (
    <div>
      <Upload onImageUrlChange={setImageUrl} />
      {imageUrl && <ImageEditor imageUrl={imageUrl} />}
      <br />
    </div>
  );
};
