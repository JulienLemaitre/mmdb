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
          className="btn btn-primary"
          onClick={() => {
            console.log(`Create a new ${entityName}`);
            if (typeof onClick === "function") onClick();
            if (router && createUrl) router.push(createUrl);
          }}
        >
          {`Create a new ${entityName}`}
        </button>
      </div>
    );
  };
}
