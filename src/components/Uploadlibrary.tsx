import React, { useState, useEffect } from "react";
import { Button } from "@canva/app-ui-kit";
import { upload, ImageMimeType } from "@canva/asset";
import { addNativeElement } from "@canva/design";

interface UploadlibraryProps {
  resultURL: string;
  loading: boolean;
}

export const Uploadlibrary: React.FC<UploadlibraryProps> = ({
  resultURL,
  loading,
}) => {
  const [thumbnailURL, setThumbnailURL] = useState<string | null>(null);

  useEffect(() => {
    const createThumbnail = () => {
      const image = new Image();
      image.src = resultURL;
      image.crossOrigin = "anonymous";

      image
        .decode()
        .then(() => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const thumbnailWidth = 150;
            const thumbnailHeight =
              (image.height / image.width) * thumbnailWidth;
            canvas.width = thumbnailWidth;
            canvas.height = thumbnailHeight;

            ctx.drawImage(image, 0, 0, thumbnailWidth, thumbnailHeight);
            const thumbnailDataURL = canvas.toDataURL();
            setThumbnailURL(thumbnailDataURL);
          }
        })
        .catch((error) => {
          console.error("Error decoding image:", error);
        });
    };

    createThumbnail();
  }, [resultURL]);

  const getMimeType = (dataURL: string) => {
    const mimeTypeMatch = dataURL.match(/^data:(.*?);base64,/);
    return mimeTypeMatch ? mimeTypeMatch[1] : "";
  };

  const importAndAddImage = async () => {
    try {
      // Detect MIME type from the result URL
      const mimeType = getMimeType(resultURL) as ImageMimeType;

      // Start uploading the image with the detected MIME type
      const image = await upload({
        type: "IMAGE",
        mimeType: mimeType,
        url: resultURL,
        thumbnailUrl: thumbnailURL || "",
      });

      // Add the image to the design
      await addNativeElement({
        type: "IMAGE",
        ref: image.ref,
      });

      // Wait for the upload to finish
      await image.whenUploaded();

      console.log("Upload complete!");
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  return (
    <div>
      <Button
        variant="secondary"
        stretch
        onClick={importAndAddImage}
        disabled={loading}
        loading={loading || !thumbnailURL}
      >
        Add & Save Image
      </Button>
    </div>
  );
};
