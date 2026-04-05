import { useGameStore } from "@/store/useGameStore";
import { FoodPellet } from "../components/FoodPellet";
import { DirtySpot } from "../components/DirtySpot";

export function OverlayLayer() {
	const foodPellets = useGameStore((s) => s.foodPellets);
	const dirtySpots = useGameStore((s) => s.tank.dirtySpots);
	const cleanDirtySpot = useGameStore((s) => s.cleanDirtySpot);

	return (
		<g>
			{foodPellets.map((p) => (
				<FoodPellet key={p.id} pellet={p} />
			))}
			{dirtySpots.map((spot) => (
				<DirtySpot
					key={spot.id}
					spot={spot}
					onClick={() => cleanDirtySpot(spot.id)}
				/>
			))}
		</g>
	);
}
