import { useGameStore } from "@/store/useGameStore";
import { FishSprite } from "../components/FishSprite";

export function FishLayer() {
	const fish = useGameStore((s) => s.fish);
	const selectedFishId = useGameStore((s) => s.selectedFishId);
	const selectFish = useGameStore((s) => s.selectFish);

	return (
		<g>
			{fish.map((f) => (
				<FishSprite
					key={f.id}
					fish={f}
					isSelected={f.id === selectedFishId}
					onClick={() => selectFish(f.id)}
				/>
			))}
		</g>
	);
}
