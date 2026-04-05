import { GameProvider } from "./providers/GameProvider";
import { MainLayout } from "./layout/MainLayout";

export function App() {
	return (
		<GameProvider>
			<MainLayout />
		</GameProvider>
	);
}
