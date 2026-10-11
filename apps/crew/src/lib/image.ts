// Portfolio uploads in the demo are kept in the browser, so shrink them first:
// longest side 900px, JPEG, which keeps each piece around 100 KB.
export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((ok, no) => {
    if (!file.type.startsWith("image/")) return no(new Error("Images only for now (JPG, PNG, WebP)."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error("Couldn't read this image.")); };
    img.src = url;
  });
}
