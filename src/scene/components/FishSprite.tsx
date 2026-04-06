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

	const now = Date.now();
	// Per-fish phase offset so fish don't all bob in unison
	const phase = (fish.colorHue * 100 + fish.x * 0.3) % 1000;

	// Slight bob animation — always present, amplitude varies with speed
	const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
	const bobAmplitude = 1.5 + speed * 2;
	const bobY = Math.sin(now * 0.003 + phase) * bobAmplitude;

	// Body sway — subtle lateral oscillation that makes fish look alive
	const swayAngle = Math.sin(now * 0.004 + phase * 1.3) * (1.5 + speed * 2);

	// Tail wag — always present even at low speed, faster when swimming
	const baseWag = 4; // minimum wag so idle fish still look alive
	const speedWag = speed * 8;
	const tailWag = Math.sin(now * (0.01 + speed * 0.008) + phase) * (baseWag + speedWag);

	// Slight body tilt based on vertical velocity — fish pitch up/down when moving vertically
	const pitchAngle = fish.vy * 8; // degrees of tilt

	// Body squash/stretch — subtle scale modulation synced with swim cycle
	const breathe = 1 + Math.sin(now * 0.005 + phase * 0.7) * 0.02;

	// Color based on fish's hue
	const bodyColor = `hsl(${fish.colorHue}, 85%, 55%)`;
	const bellyColor = `hsl(${fish.colorHue}, 70%, 75%)`;
	const finColor = `hsl(${fish.colorHue}, 80%, 45%)`;

	return (
		<g
			transform={`translate(${fish.x}, ${fish.y + bobY}) scale(${fish.facingDirection}, 1) rotate(${swayAngle + pitchAngle * fish.facingDirection})`}
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

			{/* Tail — wags continuously */}
			<path
				d={`M${-hw + 2},0 L${-hw - 12},${-8 + tailWag} L${-hw - 12},${8 + tailWag} Z`}
				fill={finColor}
				opacity={0.9}
			/>

			{/* Body — subtle breathe effect */}
			<ellipse cx={0} cy={0} rx={hw * breathe} ry={hh / breathe} fill={bodyColor} />

			{/* Belly */}
			<ellipse cx={0} cy={hh * 0.3} rx={hw * 0.7} ry={hh * 0.5} fill={bellyColor} opacity={0.6} />

			{/* Dorsal fin — slight flutter */}
			<path
				d={`M${-4},${-hh + 2} Q${2},${-hh - 8 + Math.sin(now * 0.006 + phase) * 1.5} ${8},${-hh + 2}`}
				fill={finColor}
				opacity={0.8}
			/>

			{/* Pectoral fin (small, visible on near side) */}
			<path
				d={`M${-2},${hh * 0.2} Q${-8},${hh * 0.6 + Math.sin(now * 0.007 + phase) * 2} ${-4},${hh * 0.8}`}
				fill={finColor}
				opacity={0.5}
			/>

			{/* Eye */}
			<circle cx={hw * 0.5} cy={-hh * 0.2} r={3} fill="white" />
			<circle cx={hw * 0.55} cy={-hh * 0.2} r={1.5} fill="#222" />

			{/* Mouth — subtle open/close */}
			<ellipse
				cx={hw - 1}
				cy={hh * 0.1}
				rx={1.5 + Math.sin(now * 0.004 + phase) * 0.3}
				ry={1 + Math.sin(now * 0.004 + phase) * 0.2}
				fill="#c84"
				opacity={0.7}
			/>
		</g>
	);
}
