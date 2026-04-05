import { TankScene } from "@/scene/TankScene";
import { TopHud } from "@/ui/hud/TopHud";
import { FishInspector } from "@/ui/inspector/FishInspector";
import { TankStatusPanel } from "@/ui/panels/TankStatusPanel";
import { ShopPanel } from "@/ui/shop/ShopPanel";
import { useGameStore } from "@/store/useGameStore";

export function MainLayout() {
	const activePanel = useGameStore((s) => s.activePanel);
	const setActivePanel = useGameStore((s) => s.setActivePanel);

	return (
		<div className="main-layout">
			<TopHud />

			<div className="content-area">
				<div className="tank-container">
					<TankScene />
					<div className="tank-controls">
						<button
							type="button"
							className={`control-btn ${activePanel === "status" ? "active" : ""}`}
							onClick={() => setActivePanel(activePanel === "status" ? "none" : "status")}
						>
							Status
						</button>
						<button
							type="button"
							className={`control-btn ${activePanel === "shop" ? "active" : ""}`}
							onClick={() => setActivePanel(activePanel === "shop" ? "none" : "shop")}
						>
							Shop
						</button>
					</div>
				</div>

				<div className="side-panels">
					<FishInspector />
					{activePanel === "status" && <TankStatusPanel />}
					{activePanel === "shop" && <ShopPanel />}
				</div>
			</div>
		</div>
	);
}
