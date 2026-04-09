import React from "react";

export interface CertificateHoverPreviewPosition {
  left: number;
  placement: "top" | "bottom";
  top: number;
  width: number;
}

interface CertificateHoverPreviewProps extends CertificateHoverPreviewPosition {
  label: string;
  previewUrl: string;
}

const PREVIEW_GAP = 14;
const PREVIEW_MARGIN = 12;
const PREVIEW_MAX_WIDTH = 320;
const PREVIEW_HEAD_HEIGHT = 58;

export function getCertificateHoverPreviewPosition(anchorRect: DOMRect): CertificateHoverPreviewPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(PREVIEW_MAX_WIDTH, viewportWidth - PREVIEW_MARGIN * 2);
  const estimatedHeight = Math.min(viewportHeight - PREVIEW_MARGIN * 2, width * (297 / 210) + PREVIEW_HEAD_HEIGHT);

  let left = anchorRect.left + anchorRect.width / 2 - width / 2;
  left = Math.max(PREVIEW_MARGIN, Math.min(left, viewportWidth - width - PREVIEW_MARGIN));

  const canPlaceAbove = anchorRect.top >= estimatedHeight + PREVIEW_GAP + PREVIEW_MARGIN;
  const top = canPlaceAbove
    ? Math.max(PREVIEW_MARGIN, anchorRect.top - estimatedHeight - PREVIEW_GAP)
    : Math.min(viewportHeight - estimatedHeight - PREVIEW_MARGIN, anchorRect.bottom + PREVIEW_GAP);

  return {
    top,
    left,
    width,
    placement: canPlaceAbove ? "top" : "bottom"
  };
}

function CertificateHoverPreview({
  label,
  left,
  placement,
  previewUrl,
  top,
  width
}: CertificateHoverPreviewProps): JSX.Element {
  return (
    <div
      className={`certificate-hover-preview is-${placement}`}
      style={{ top: `${top}px`, left: `${left}px`, width: `${width}px` }}
      aria-hidden="true"
    >
      <div className="certificate-hover-preview-shell">
        <div className="certificate-hover-preview-head">
          <span className="certificate-hover-preview-label">Award Preview</span>
          <strong>{label}</strong>
        </div>
        <div className="certificate-hover-preview-media">
          <img src={previewUrl} alt="" className="certificate-hover-preview-image" />
        </div>
      </div>
    </div>
  );
}

export default CertificateHoverPreview;
