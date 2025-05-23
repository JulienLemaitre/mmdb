import React from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/components/hooks/usePortal";

type DataLossWarningModalProps = {
  modalId: string;
  action: () => void;
  dirtyFields?: any;
};

function DataLossWarningModal({
  modalId,
  action,
  dirtyFields = {},
}: DataLossWarningModalProps) {
  const portalContainer = usePortal();
  const onClose = () => {
    //@ts-ignore
    document.getElementById(modalId)?.close();
  };
  if (!portalContainer) return null;

  const dirtyFieldsKeys = Object.keys(dirtyFields);

  return createPortal(
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{`Warning!`}</h3>
        <p className="py-2">{`You're about to lose your changes${dirtyFieldsKeys.length ? ` in field${dirtyFieldsKeys.length > 1 ? "s" : ""} : ${Object.keys(dirtyFields).join(", ")}` : ""}. Are you sure you want to proceed?`}</p>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={action}>
            Continue
          </button>
        </div>
      </div>
    </dialog>,
    portalContainer,
  );
}

export default DataLossWarningModal;
