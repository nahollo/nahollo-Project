import React, { useEffect } from "react";
import { IoClose, IoOpenOutline } from "react-icons/io5";

interface CertificateModalProps {
  label: string;
  onClose: () => void;
  previewUrl?: string;
  url: string;
}

function CertificateModal({ label, onClose, previewUrl, url }: CertificateModalProps): JSX.Element {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="certificate-modal-backdrop" role="dialog" aria-modal="true" aria-label={`${label} preview`} onClick={onClose}>
      <div className="certificate-modal" onClick={(event) => event.stopPropagation()}>
        <div className="certificate-modal-head">
          <div>
            <span className="certificate-modal-label">Award Preview</span>
            <strong>{label}</strong>
          </div>
          <div className="certificate-modal-actions">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="certificate-modal-open"
              aria-label={`${label} 원본 PDF 열기`}
            >
              <IoOpenOutline />
              <span>원본 PDF</span>
            </a>
            <button type="button" className="certificate-modal-close" onClick={onClose} aria-label="Close award preview">
              <IoClose />
            </button>
          </div>
        </div>

        <div className="certificate-modal-frame-wrap">
          <div className="certificate-modal-page">
            {previewUrl ? (
              <img src={previewUrl} alt={`${label} 전체 미리보기`} className="certificate-modal-image" />
            ) : (
              <iframe
                src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`}
                title={`${label} preview`}
                className="certificate-modal-frame"
                scrolling="no"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;
