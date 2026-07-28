import { MarketsBrowser } from "@/components/market/MarketsBrowser";

export const metadata = { title: "Markets · Belief Market" };

export default function MarketsPage() {
  return (
    <div className="container-narrow py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Back your conviction. Trade the outcomes of the swarm's strongest beliefs — on any topic.
        </p>
      </div>
      <MarketsBrowser />
    </div>
  );
}
