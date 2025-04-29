import { createPortal } from "react-dom";
import { usePortal } from "@/components/hooks/usePortal";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";

type DuplicatePlateNumberWarningModalProps = {
  modalId: string;
  onConfirm: () => void;
  onCancel: () => void;
  refValue?: string;
  mMSourceListToCheck?: any[];
};

function DuplicatePlateNumberWarningModal({
  modalId,
  onConfirm,
  onCancel,
  refValue,
  mMSourceListToCheck,
}: DuplicatePlateNumberWarningModalProps) {
  const portalContainer = usePortal();
  console.log(`[] refValue :`, refValue);
  console.log(`[] mMSourceListToCheck :`, mMSourceListToCheck);

  const onClose = () => {
    //@ts-ignore
    document.getElementById(modalId)?.close();
  };
  if (!portalContainer) return null;

  return createPortal(
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{`Warning!`}</h3>
        <p className="py-2">
          {`The Plate Number `}
          <em>{refValue}</em>
          {` you entered is already used in the database.`}
        </p>
        <p>{`Please check the existing piece informations here below, and be sure you are not registering a duplicate of the same piece. Cancel or continue your reference submission, accordingly.`}</p>
        {mMSourceListToCheck?.map((mMSource: any, index) => (
          <div key={index} className="border-t py-2">
            <h4 className="font-bold text-sm">{`MMSource ${index + 1}:`}</h4>
            <p>{`Title: ${mMSource.title}`}</p>
            <p>{`Type: ${mMSource.type}`}</p>
            <p>{`Year: ${mMSource.year}`}</p>
            <p>
              {`Link: `}
              <a
                className="link"
                href={getIMSLPPermaLink(mMSource.link)}
                target="_blank"
              >
                {getIMSLPPermaLink(mMSource.link)}
              </a>
            </p>
            <p>{`Comment: ${mMSource.comment}`}</p>
          </div>
        ))}
        <div className="modal-action">
          <button
            className="btn"
            onClick={() => {
              onCancel();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </dialog>,
    portalContainer,
  );
}

export default DuplicatePlateNumberWarningModal;
