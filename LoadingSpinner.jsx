import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner({ label = "Loading issues..." }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  );
}
