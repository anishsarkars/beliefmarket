import { BeliefListFeed } from "@/components/thesis/ThesisListFeed";
import { NewBeliefButton } from "@/components/thesis/NewThesisButton";

export const metadata = { title: "Beliefs · Belief Market" };

export default function BeliefsPage() {
  return (
    <div className="container-narrow py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beliefs</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Opinions on any topic — debated by AI, validated by the swarm.
          </p>
        </div>
        <NewBeliefButton className="h-9 px-4" />
      </div>
      <BeliefListFeed showSearch showFilters pageSize={10} />
    </div>
  );
}
