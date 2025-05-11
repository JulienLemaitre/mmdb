import { createPortal } from "react-dom";
import { usePortal } from "@/components/hooks/usePortal";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";
import getSourceTypeLabel from "@/utils/getSourceTypeLabel";

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
          {` you entered is already in use within the database.`}
        </p>
        <p>{`Please review the details of the existing entries listed below to ensure that you are not registering a duplicate of the same piece. Based on the information provided, you can choose to cancel or proceed with your submission accordingly.`}</p>
        {(mMSourceListToCheck || []).length === 0 ? (
          <p>{`An Metronome Mark Source exists in the database with this plate number, but a technical problem prevented us from fetching its details.`}</p>
        ) : null}
        {mMSourceListToCheck?.map((mMSource: any, index) => (
          <div key={"mmSourceCheck" + index} className="border-t py-2">
            <h4 className="font-bold text-sm">{`${index + 1} - ${mMSource.title || `Untitled MMSource`}`}</h4>
            <div>{`Type: ${getSourceTypeLabel(mMSource.type)}`}</div>
            <div>{`Year: ${mMSource.year}`}</div>
            <div>
              {`Online score: `}
              <a
                className="link"
                href={getIMSLPPermaLink(mMSource.link)}
                target="_blank"
              >
                {getIMSLPPermaLink(mMSource.link)}
              </a>
            </div>
            {mMSource.comment ? (
              <div>{`Comment: ${mMSource.comment}`}</div>
            ) : null}
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
