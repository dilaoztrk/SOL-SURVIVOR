import { useState } from "react";
import { useGame } from "./game/useGame";
import { MISSION_CONFIG } from "./game/config";
import { missionCards } from "./game/data/missionCards";
import type { NasaEvent } from "./types/game";
import MainMenu from "./pages/MainMenu";
import MissionDashboard from "./pages/MissionDashboard";

const nasaEvents: readonly NasaEvent[] = [];

function App() {
  const [currentPage, setCurrentPage] = useState<"menu" | "dashboard">("menu");
  const game = useGame(missionCards, nasaEvents, MISSION_CONFIG);

  const handleStartMission = () => {
    setCurrentPage("dashboard");
  };

  const handleBackToMenu = () => {
    setCurrentPage("menu");
  };

  const handleRestartMission = () => {
    game.restart();
    setCurrentPage("dashboard");
  };

  return currentPage === "menu" ? (
    <MainMenu onStart={handleStartMission} />
  ) : (
    <MissionDashboard
      onBack={handleBackToMenu}
      onRestart={handleRestartMission}
      game={game}
    />
  );
}

export default App;
