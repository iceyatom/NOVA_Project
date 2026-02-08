// src/app/info/[slug]/loading.tsx
import InfoTemplate from "../../components/InfoTemplate";

export default function Loading() {
  return (
    <main className="info-demo-page">
      <InfoTemplate isLoading={true} />
    </main>
  );
}
