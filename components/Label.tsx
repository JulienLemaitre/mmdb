export default function Label({ label, isRequired = false }) {
  return (
    <label className="label">
      <span className="label-text">
        {label}
        {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
      </span>
    </label>
  );
}
