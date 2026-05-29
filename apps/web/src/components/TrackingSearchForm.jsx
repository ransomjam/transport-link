import TrackingForm from "./TrackingForm";

export default function TrackingSearchForm({ large = false }) {
  return <TrackingForm horizontal={large} showDescription={false} />;
}
