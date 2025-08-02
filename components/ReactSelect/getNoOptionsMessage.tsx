import PlusIcon from "@/components/svg/PlusIcon";

type GetNoOptionsMessageProps = {
  router?: any;
  entityName: string;
  createUrl?: string;
  onClick?: () => void;
};

export default function getNoOptionsMessage({
  router,
  entityName,
  createUrl,
  onClick,
}: GetNoOptionsMessageProps) {
  return function noOptionMessage() {
    return (
      <div className="text-left">
        <div className="ml-4 mb-2">{`No ${entityName} found`}</div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => {
            console.log(`Create a new ${entityName}`);
            if (typeof onClick === "function") onClick();
            if (router && createUrl) router.push(createUrl);
          }}
        >
          <PlusIcon className="w-5 h-5" />
          {`Create a new ${entityName}`}
        </button>
      </div>
    );
  };
}
