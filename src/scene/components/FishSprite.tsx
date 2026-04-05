import type { FishEntity } from "@/domain/fish/fishTypes";
import { FISH_SIZE } from "@/domain/constants/tuning";

interface FishSpriteProps {
	fish: FishEntity;
	isSelected: boolean;
	onClick: () => void;
}

export function FishSprite({ fish, isSelected, onClick }: FishSpriteProps) {
	const size = FISH_SIZE[fish.ageStage];
	const hw = size.width / 2;
	const hh = size.height / 2;

	// Slight bob animation based on time
	const bobY = Math.sin(Date.now() * 0.002 + fish.x * 0.01) * 2;

	// Tail wag based on speed
	const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
	const tailWag = Math.sin(Date.now() * 0.008) * (3 + speed * 5);

	// Color based on fish's hue
	const bodyColor = `hsl(${fish.colorHue}, 85%, 55%)`;
	const bellyColor = `hsl(${fish.colorHue}, 70%, 75%)`;
	const finColor = `hsl(${fish.colorHue}, 80%, 45%)`;

	return (
		<g
			transform={`translate(${fish.x}, ${fish.y + bobY}) scale(${fish.facingDirection}, 1)`}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			style={{ cursor: "pointer" }}
		>
			{/* Selection ring */}
			{isSelected && (
				<ellipse
					cx={0}
					cy={0}
					rx={hw + 8}
					ry={hh + 8}
					fill="none"
					stroke="rgba(255, 255, 100, 0.6)"
					strokeWidth={2}
					strokeDasharray="4 3"
				/>
			)}

			{/* Tail */}
			<path
				d={`M${-hw + 2},0 L${-hw - 12},${-8 + tailWag} L${-hw - 12},${8 + tailWag} Z`}
				fill={finColor}
				opacity={0.9}
			/>

			{/* Body */}
			<ellipse cx={0} cy={0} rx={hw} ry={hh} fill={bodyColor} />

			{/* Belly */}
			<ellipse cx={0} cy={hh * 0.3} rx={hw * 0.7} ry={hh * 0.5} fill={bellyColor} opacity={0.6} />

			{/* Dorsal fin */}
			<path
				d={`M${-4},${-hh + 2} Q${2},${-hh - 8} ${8},${-hh + 2}`}
				fill={finColor}
				opacity={0.8}
			/>

			{/* Eye */}
			<circle cx={hw * 0.5} cy={-hh * 0.2} r={3} fill="white" />
			<circle cx={hw * 0.55} cy={-hh * 0.2} r={1.5} fill="#222" />

			{/* Mouth */}
			<ellipse cx={hw - 1} cy={hh * 0.1} rx={1.5} ry={1} fill="#c84" opacity={0.7} />
		</g>
	);
}
