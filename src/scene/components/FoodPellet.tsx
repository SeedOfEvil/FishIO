import type { FoodPellet as FoodPelletType } from "@/domain/fish/fishTypes";

interface FoodPelletProps {
	pellet: FoodPelletType;
}

export function FoodPellet({ pellet }: FoodPelletProps) {
	const opacity = Math.min(1, pellet.lifetime / 10);

	return (
		<circle
			cx={pellet.x}
			cy={pellet.y}
			r={3}
			fill="#c88030"
			opacity={opacity}
			stroke="#a06020"
			strokeWidth={0.5}
		/>
	);
}
