import { useSelectedFish } from "@/store/selectors";
import { useGameStore } from "@/store/useGameStore";
import { SPECIES } from "@/domain/fish/fishSpecies";

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<div className="stat-bar">
			<div className="stat-label">{label}</div>
			<div className="stat-track">
				<div className="stat-fill" style={{ width: `${value}%`, backgroundColor: color }} />
			</div>
			<div className="stat-value">{Math.round(value)}</div>
		</div>
	);
}

export function FishInspector() {
	const fish = useSelectedFish();
	const selectFish = useGameStore((s) => s.selectFish);

	if (!fish) {
		return (
			<div className="fish-inspector empty">
				<p className="inspector-hint">Click a fish to inspect it</p>
			</div>
		);
	}

	return (
		<div className="fish-inspector">
			<div className="inspector-header">
				<h3>{fish.name}</h3>
				<button type="button" className="close-btn" onClick={() => selectFish(null)}>
					x
				</button>
			</div>

			<div className="inspector-meta">
				<span>{SPECIES[fish.species]?.name ?? "Unknown"}</span>
				<span className="separator">|</span>
				<span>{fish.sex === "male" ? "Male" : "Female"}</span>
				<span className="separator">|</span>
				<span>{fish.ageStage}</span>
				<span className="separator">|</span>
				<span>{fish.state}</span>
			</div>

			<div className="inspector-stats">
				<StatBar label="Hunger" value={100 - fish.hunger} color="#f59e0b" />
				<StatBar label="Health" value={fish.health} color="#ef4444" />
				<StatBar label="Happy" value={fish.happiness} color="#8b5cf6" />
				<StatBar label="Energy" value={fish.energyLevel} color="#3b82f6" />
			</div>

			<div className="inspector-personality">
				<h4>Personality</h4>
				<div className="trait">Active: {"*".repeat(Math.round(fish.personality.energy * 5))}</div>
				<div className="trait">Social: {"*".repeat(Math.round(fish.personality.sociability * 5))}</div>
				<div className="trait">Bold: {"*".repeat(Math.round(fish.personality.boldness * 5))}</div>
				<div className="trait">Appetite: {"*".repeat(Math.round(fish.personality.appetite * 5))}</div>
			</div>
		</div>
	);
}
