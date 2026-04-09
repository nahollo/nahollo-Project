import { useEffect } from "react";

const preloadedImageUrls = new Set<string>();

function usePreloadedImages(urls: string[]): void {
  const cacheKey = urls.join("|");

  useEffect(() => {
    urls.forEach((url) => {
      if (!url || preloadedImageUrls.has(url)) {
        return;
      }

      preloadedImageUrls.add(url);

      const image = new Image();
      image.decoding = "async";
      image.src = url;
    });
  }, [cacheKey, urls]);
}

export default usePreloadedImages;
