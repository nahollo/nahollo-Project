import React, { useEffect } from "react";
import { IoClose } from "react-icons/io5";

interface CertificateModalProps {
  label: string;
  onClose: () => void;
  url: string;
}

function CertificateModal({ label, onClose, url }: CertificateModalProps): JSX.Element {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="certificate-modal-backdrop" role="dialog" aria-modal="true" aria-label={`${label} preview`} onClick={onClose}>
      <div className="certificate-modal" onClick={(event) => event.stopPropagation()}>
        <div className="certificate-modal-head">
          <div>
            <span className="certificate-modal-label">Award Preview</span>
            <strong>{label}</strong>
          </div>
          <button type="button" className="certificate-modal-close" onClick={onClose} aria-label="Close award preview">
            <IoClose />
          </button>
        </div>
        <div className="certificate-modal-frame-wrap">
          <iframe
            src={`${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
            title={`${label} preview`}
            className="certificate-modal-frame"
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;
