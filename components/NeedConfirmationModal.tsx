import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/components/hooks/usePortal";

type NeedConfirmationModalProps = {
  modalId: string;
  onConfirm: () => void;
  onCancel: () => void;
  description: string;
  isOpened?: boolean;
};

function NeedConfirmationModal({
  modalId,
  onConfirm,
  onCancel,
  description,
  isOpened = false,
}: NeedConfirmationModalProps) {
  const portalContainer = usePortal();

  useEffect(() => {
    if (isOpened) {
      // @ts-ignore => Daisy UI modal has an unconventional showModal method
      document?.getElementById(modalId)?.showModal();
    } else {
      // @ts-ignore => Daisy UI modal has an unconventional close method
      document.getElementById(modalId)?.close();
    }
  }, [isOpened, modalId]);

  if (!portalContainer) return null;

  return createPortal(
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">
          {`Confirmation needed`}
          <span className="py-2 block text-sm">{`The following action that cannot be undone`}</span>
        </h3>
        <p className="py-2 bold">{description}</p>
        <div className="modal-action">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </dialog>,
    portalContainer,
  );
}

export default NeedConfirmationModal;
