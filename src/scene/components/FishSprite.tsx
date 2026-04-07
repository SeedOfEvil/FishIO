import type { FishEntity } from "@/domain/fish/fishTypes";
import { SPECIES } from "@/domain/fish/fishSpecies";
import { FISH_SIZE, FISH_BASE_SPEED } from "@/domain/constants/tuning";

interface FishSpriteProps {
	fish: FishEntity;
	isSelected: boolean;
	onClick: () => void;
}

export function FishSprite({ fish, isSelected, onClick }: FishSpriteProps) {
	const speciesDef = SPECIES[fish.species] ?? SPECIES.goldfish;
	const baseSize = FISH_SIZE[fish.ageStage];

	const shapeScale = getShapeScale(speciesDef.bodyShape);
	const hw = (baseSize.width / 2) * speciesDef.sizeMultiplier * shapeScale.x;
	const hh = (baseSize.height / 2) * speciesDef.sizeMultiplier * shapeScale.y;

	const now = Date.now();
	const ps = fish.phaseSeed ?? (fish.colorHue * 100 + fish.x * 0.3) % 1000;

	const rawSpeed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
	const swim = Math.min(rawSpeed / FISH_BASE_SPEED, 1);

	// ---- Use SECONDS as time base for clarity (not raw Date.now) ----
	// This avoids huge floating-point values and makes frequencies easy to reason about.
	const t = now * 0.001; // time in seconds
	const psR = ps * 0.01; // phase in radians (small)

	// Bigger fish = slower everything
	const sizeSlow = Math.max(0.5, 1.1 - speciesDef.sizeMultiplier * 0.3);

	// --- Tail wag ---
	// Idle: ~0.04 Hz (~25 sec/cycle). Full swim: ~0.12 Hz (~8 sec/cycle).
	// Frequencies in radians/second.
	const wagFreqRad = (0.25 + (ps % 60) * 0.001) * sizeSlow;
	const wagSpeedAdd = swim * 0.5 * sizeSlow;
	const tailWag = Math.sin(t * (wagFreqRad + wagSpeedAdd) + psR)
		* (0.4 + swim * 1.0) * speciesDef.tailSize;

	// --- Body sway (rotation only, very subtle) ---
	const swayFreqRad = 0.2 + (ps % 80) * 0.001;
	const swayAngle = Math.sin(t * swayFreqRad + psR * 1.3) * (0.3 + swim * 0.4);

	// --- Pitch from vertical velocity ---
	const normalizedVy = FISH_BASE_SPEED > 0 ? fish.vy / FISH_BASE_SPEED : 0;
	const pitchAngle = normalizedVy * 5;

	// --- Breathing (body scale pulse) ---
	const breatheFreqRad = 0.25 + (ps % 90) * 0.0008;
	const breathe = 1 + Math.sin(t * breatheFreqRad + psR * 0.7) * 0.008;

	// --- Dorsal fin flutter ---
	const dorsalFreqRad = 0.3 + (ps % 70) * 0.001;
	const dorsalFlutter = Math.sin(t * dorsalFreqRad + psR) * 0.5;

	// --- Pectoral fin sweep ---
	const pectFreqRad = 0.25 + (ps % 50) * 0.001;
	const pectSweep = Math.sin(t * pectFreqRad + psR * 1.4) * 0.5;

	// Colors
	const hue = fish.colorHue;
	const { saturation: sat, lightness: lit } = speciesDef;
	const bodyColor = `hsl(${hue}, ${sat}%, ${lit}%)`;
	const bellyColor = `hsl(${hue}, ${Math.max(sat - 15, 0)}%, ${Math.min(lit + 20, 95)}%)`;
	const finColor = `hsl(${hue}, ${Math.max(sat - 5, 0)}%, ${Math.max(lit - 10, 10)}%)`;

	// Tail geometry
	const tailLen = 12 * speciesDef.tailSize * speciesDef.sizeMultiplier;
	const tailSpread = 8 * speciesDef.tailSize * speciesDef.sizeMultiplier;

	return (
		<g
			transform={`translate(${fish.x}, ${fish.y}) scale(${fish.facingDirection}, 1) rotate(${swayAngle + pitchAngle * fish.facingDirection})`}
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
			{speciesDef.hasFlowingTail ? (
				<>
					{/* Flowing tail — elegant trailing fins */}
					<path
						d={`M${-hw + 2},0 Q${-hw - tailLen * 0.7},${-tailSpread * 0.5 + tailWag} ${-hw - tailLen},${-tailSpread + tailWag * 1.2}`}
						fill="none"
						stroke={finColor}
						strokeWidth={3 * speciesDef.sizeMultiplier}
						opacity={0.7}
					/>
					<path
						d={`M${-hw + 2},0 L${-hw - tailLen},${-tailSpread * 0.5 + tailWag} L${-hw - tailLen},${tailSpread * 0.5 + tailWag} Z`}
						fill={finColor}
						opacity={0.75}
					/>
					<path
						d={`M${-hw + 2},0 Q${-hw - tailLen * 0.7},${tailSpread * 0.5 + tailWag} ${-hw - tailLen},${tailSpread + tailWag * 1.2}`}
						fill="none"
						stroke={finColor}
						strokeWidth={3 * speciesDef.sizeMultiplier}
						opacity={0.7}
					/>
				</>
			) : speciesDef.bodyShape === "elongated" && fish.species === "swordtail" ? (
				<>
					{/* Swordtail */}
					<path
						d={`M${-hw + 2},0 L${-hw - tailLen},${-tailSpread * 0.6 + tailWag} L${-hw - tailLen},${tailSpread * 0.6 + tailWag} Z`}
						fill={finColor}
						opacity={0.9}
					/>
					<path
						d={`M${-hw - tailLen},${tailSpread * 0.3 + tailWag} L${-hw - tailLen * 2.2},${tailSpread * 0.5 + tailWag * 0.5} L${-hw - tailLen},${tailSpread * 0.6 + tailWag}`}
						fill={`hsl(${hue}, ${sat}%, ${Math.max(lit - 15, 10)}%)`}
						opacity={0.85}
					/>
				</>
			) : (
				/* Standard tail */
				<path
					d={`M${-hw + 2},0 L${-hw - tailLen},${-tailSpread + tailWag} L${-hw - tailLen},${tailSpread + tailWag} Z`}
					fill={finColor}
					opacity={0.9}
				/>
			)}

			{/* Body */}
			<ellipse cx={0} cy={0} rx={hw * breathe} ry={hh / breathe} fill={bodyColor} />

			{/* Belly */}
			<ellipse cx={0} cy={hh * 0.3} rx={hw * 0.7} ry={hh * 0.5} fill={bellyColor} opacity={0.6} />

			{/* Stripes */}
			{speciesDef.hasStripes && (
				<g opacity={0.35}>
					{fish.species === "clownfish" ? (
						<>
							<rect x={-hw * 0.1} y={-hh} width={hw * 0.15} height={hh * 2} fill="white" rx={2} />
							<rect x={hw * 0.35} y={-hh * 0.9} width={hw * 0.12} height={hh * 1.8} fill="white" rx={2} />
							<rect x={-hw * 0.5} y={-hh * 0.85} width={hw * 0.12} height={hh * 1.7} fill="white" rx={2} />
						</>
					) : (
						<>
							{[-0.4, 0, 0.4].map((offset) => (
								<ellipse
									key={offset}
									cx={0}
									cy={hh * offset}
									rx={hw * 0.85}
									ry={hh * 0.08}
									fill={speciesDef.stripeHue !== undefined
										? `hsl(${speciesDef.stripeHue}, 50%, 30%)`
										: "#333"}
								/>
							))}
						</>
					)}
				</g>
			)}

			{/* Spots */}
			{speciesDef.hasSpots && (
				<g opacity={0.3}>
					{[0.2, -0.15, 0.35, -0.3, 0.05].map((xOff, i) => (
						<circle
							key={i}
							cx={hw * xOff * 1.2}
							cy={hh * (((i * 0.37 + 0.1) % 0.8) - 0.4)}
							r={2 + (i % 3)}
							fill={`hsl(${hue}, ${Math.max(sat - 20, 0)}%, ${Math.max(lit - 20, 10)}%)`}
						/>
					))}
				</g>
			)}

			{/* Dorsal fin */}
			{speciesDef.hasLongDorsal ? (
				<path
					d={`M${-hw * 0.3},${-hh + 2} Q${0},${-hh - 14 * speciesDef.sizeMultiplier + dorsalFlutter} ${hw * 0.3},${-hh + 2}`}
					fill={finColor}
					opacity={speciesDef.finOpacity}
				/>
			) : (
				<path
					d={`M${-4},${-hh + 2} Q${2},${-hh - 8 + dorsalFlutter * 0.6} ${8},${-hh + 2}`}
					fill={finColor}
					opacity={speciesDef.finOpacity}
				/>
			)}

			{/* Pectoral fin */}
			<path
				d={`M${-2},${hh * 0.2} Q${-8},${hh * 0.6 + pectSweep} ${-4},${hh * 0.8}`}
				fill={finColor}
				opacity={speciesDef.finOpacity * 0.65}
			/>

			{/* Whiskers */}
			{speciesDef.hasWhiskers && (
				<g opacity={0.6}>
					<line
						x1={hw * 0.6}
						y1={hh * 0.3}
						x2={hw * 1.1 + dorsalFlutter * 0.5}
						y2={hh * 0.6}
						stroke={finColor}
						strokeWidth={1}
					/>
					<line
						x1={hw * 0.6}
						y1={hh * 0.35}
						x2={hw * 1.0 + pectSweep * 0.4}
						y2={hh * 0.8}
						stroke={finColor}
						strokeWidth={1}
					/>
				</g>
			)}

			{/* Eye */}
			<circle cx={hw * 0.5} cy={-hh * 0.2} r={3 * speciesDef.eyeSize} fill="white" />
			<circle cx={hw * 0.55} cy={-hh * 0.2} r={1.5 * speciesDef.eyeSize} fill="#222" />

			{/* Pufferfish special */}
			{fish.species === "pufferfish" ? (
				<>
					<path
						d={`M${hw * 0.65},${hh * 0.15} Q${hw * 0.8},${hh * 0.05} ${hw * 0.9},${hh * 0.2}`}
						fill="none"
						stroke="#555"
						strokeWidth={1.2}
						opacity={0.8}
					/>
					{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
						const rad = (angle * Math.PI) / 180;
						const spineLen = 3 * speciesDef.sizeMultiplier;
						return (
							<line
								key={angle}
								x1={Math.cos(rad) * hw * 0.85}
								y1={Math.sin(rad) * hh * 0.85}
								x2={Math.cos(rad) * (hw * 0.85 + spineLen)}
								y2={Math.sin(rad) * (hh * 0.85 + spineLen)}
								stroke={finColor}
								strokeWidth={0.8}
								opacity={0.5}
							/>
						);
					})}
				</>
			) : (
				<ellipse
					cx={hw - 1}
					cy={hh * 0.1}
					rx={1.5 + dorsalFlutter * 0.08}
					ry={1 + dorsalFlutter * 0.05}
					fill={`hsl(${hue}, ${Math.max(sat - 10, 0)}%, ${Math.max(lit - 20, 15)}%)`}
					opacity={0.7}
				/>
			)}
		</g>
	);
}

function getShapeScale(shape: string): { x: number; y: number } {
	switch (shape) {
		case "round": return { x: 1.0, y: 1.15 };
		case "slender": return { x: 1.1, y: 0.75 };
		case "tall": return { x: 0.85, y: 1.4 };
		case "flat": return { x: 1.15, y: 0.7 };
		case "elongated": return { x: 1.25, y: 0.8 };
		default: return { x: 1.0, y: 1.0 };
	}
}
