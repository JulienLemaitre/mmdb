import React from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";

type ModalType = "warning" | "info" | "error" | "success";
type InfoModalProps = {
  type: ModalType;
  modalId: string;
  onClose?: () => void;
  description?: string;
  content?: React.ReactNode;
};

function getTitleFromType(type: ModalType) {
  switch (type) {
    case "warning":
      return "Warning";
    case "info":
      return "Info";
    case "error":
      return "Error";
    case "success":
      return "Success";
  }
}

function InfoModal({
  type,
  modalId,
  onClose,
  description,
  content = null,
}: InfoModalProps) {
  const portalContainer = usePortal();
  const onCloseFn = () => {
    if (typeof onClose === "function") onClose();
    //@ts-ignore
    document.getElementById(modalId)?.close();
  };
  if (!portalContainer) return null;

  return createPortal(
    <dialog id={modalId} className="modal">
      <div className="modal-box w-11/12 max-w-7xl">
        <h3 className={`font-bold text-lg text-${type}`}>
          {getTitleFromType(type)}
        </h3>
        {description && <p className="py-2">{description}</p>}
        {content}
        <div className="modal-action">
          <button role="button" className="btn btn-primary" onClick={onCloseFn}>
            Close
          </button>
        </div>
      </div>
    </dialog>,
    portalContainer,
  );
}

export default InfoModal;
