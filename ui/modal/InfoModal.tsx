import React from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";

type ModalType = "warning" | "info" | "error" | "success";
type InfoModalProps = {
  type: ModalType;
  modalId: string;
  onClose?: () => void;
  description: string;
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

function InfoModal({ type, modalId, onClose, description }: InfoModalProps) {
  const portalContainer = usePortal();
  const onCloseFn = () => {
    if (typeof onClose === "function") onClose();
    //@ts-ignore
    document.getElementById(modalId)?.close();
  };
  if (!portalContainer) return null;

  return createPortal(
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{getTitleFromType(type)}</h3>
        <p className="py-2">{description}</p>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onCloseFn}>
            Continue
          </button>
        </div>
      </div>
    </dialog>,
    portalContainer,
  );
}

export default InfoModal;
