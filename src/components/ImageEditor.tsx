import { Box, Title, Slider, Rows, Button } from "@canva/app-ui-kit";
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as deeplab from "@tensorflow-models/deeplab";
import { DeepLabOutput } from "@tensorflow-models/deeplab/dist/types";
import { Uploadlibrary } from "./Uploadlibrary";
import "../../styles/style.css";

interface ImageEditorProps {
  imageUrl: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl }) => {
  const originalcanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const [model, setModel] = useState<deeplab.SemanticSegmentation | null>(null);
  const [filterIntensity, setFilterIntensity] = useState<number>(0.5);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [resultImageURL, setResultImageURL] = useState<string>(imageUrl);

  useEffect(() => {
    const setBackend = async () => {
      try {
        await tf.setBackend("webgl");
      } catch (error) {
        console.error("Error setting backend:", error);
      }
    };
    setBackend();
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await deeplab.load({
        base: "pascal",
        quantizationBytes: 2,
      });
      setModel(loadedModel);
      setModelLoaded(true);
    };
    loadModel();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.crossOrigin = "anonymous";
    image
      .decode()
      .then(() => {
        const canvas = originalcanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            // 在首次加载图像后，保存原始图像数据
            originalImageDataRef.current = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
          }
        }
      })
      .catch((error) => {
        console.error("Error decoding image:", error);
      });
  }, [imageUrl]);

  useEffect(() => {
    // Update the displayed image URL when a new image is uploaded
    setResultImageURL(imageUrl);
  }, [imageUrl]);

  const applyBlackAndWhiteEffect = async (intensity: number) => {
    setIsLoaded(true);
    const BACKGROUND_COLOR = [0, 0, 0]; // 背景色（RGB）
    const BACKGROUND_ALPHA = 255; // 背景透明度（Alpha）
    const canvas = originalcanvasRef.current;
    if (canvas && model && originalImageDataRef.current) {
      try {
        const output: DeepLabOutput = await model.segment(canvas);

        // 打印分割结果中的类别标签
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.putImageData(originalImageDataRef.current, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          console.log(imageData);
          const data = imageData.data;

          // 模型输出的尺寸
          const outputWidth = output.width;
          const outputHeight = output.height;

          // 计算宽度和高度的比例因子
          const scaleX = canvas.width / outputWidth;
          const scaleY = canvas.height / outputHeight;

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              // 映射到 segmentation map 的位置
              const mapX = Math.floor(x / scaleX);
              const mapY = Math.floor(y / scaleY);
              const mapIndex = mapY * outputWidth + mapX;
              // 检查是否为背景
              if (
                output.segmentationMap[mapIndex * 4] === BACKGROUND_COLOR[0] &&
                output.segmentationMap[mapIndex * 4 + 1] ===
                  BACKGROUND_COLOR[1] &&
                output.segmentationMap[mapIndex * 4 + 2] ===
                  BACKGROUND_COLOR[2] &&
                output.segmentationMap[mapIndex * 4 + 3] === BACKGROUND_ALPHA
              ) {
                const i = (y * canvas.width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.3 * r + 0.59 * g + 0.11 * b;
                data[i] = gray * intensity + r * (1 - intensity);
                data[i + 1] = gray * intensity + g * (1 - intensity);
                data[i + 2] = gray * intensity + b * (1 - intensity);
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);

          const resultCanvas = document.createElement("canvas");
          resultCanvas.width = canvas.width;
          resultCanvas.height = canvas.height;
          const resultCtx = resultCanvas.getContext("2d");
          if (resultCtx) {
            resultCtx.drawImage(canvas, 0, 0);
            const resultDataURL = resultCanvas.toDataURL();
            setResultImageURL(resultDataURL);
          }
        }
      } catch (error) {
        console.error("Error applying black and white effect:", error);
      } finally {
        setIsLoaded(false); // 处理完成后，设置处理状态为 false
      }
    }
  };

  return (
    <Rows spacing="1u">
      <Box alignItems="center" padding="1u" paddingEnd="3u">
        <img src={resultImageURL} />
        <canvas ref={originalcanvasRef} className="hidden" />
      </Box>
      <Box alignItems="center" padding="1u" paddingEnd="3u">
        <Title size="xsmall">Filter Intensity:</Title>
        <Slider
          min={0}
          max={100}
          value={filterIntensity * 100}
          onChange={(value) => setFilterIntensity(value / 100)}
        />
      </Box>
      <Box alignItems="center" padding="1u" paddingEnd="3u">
        <Button
          variant="primary"
          stretch
          onClick={() => {
            if (modelLoaded && !isLoaded) {
              applyBlackAndWhiteEffect(filterIntensity);
            }
          }}
          disabled={!modelLoaded || isLoaded}
          loading={!modelLoaded || isLoaded}
        >
          Apply Background Filter
        </Button>
      </Box>
      <Box alignItems="center" padding="1u" paddingEnd="3u">
        <Uploadlibrary
          resultURL={resultImageURL}
          loading={!modelLoaded || isLoaded}
        />
      </Box>
    </Rows>
  );
};

export { ImageEditor };
