import React from "react";
import { createPortal } from "react-dom";
import { MODAL_AREA_ID } from "@/utils/constants";

type DataLossWarningModalProps = {
  modalId: string;
  action: () => void;
};

function DataLossWarningModal({ modalId, action }: DataLossWarningModalProps) {
  const portalDomNode = document.getElementById(MODAL_AREA_ID);
  const onClose = () => {
    //@ts-ignore
    document.getElementById(modalId)?.close();
  };
  if (!portalDomNode) return null;

  return createPortal(
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{`Warning!`}</h3>
        <p className="py-2">{`You're about to lose your changes. Are you sure you want to proceed?`}</p>
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
    portalDomNode,
  );
}

export default DataLossWarningModal;
