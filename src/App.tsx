import { useState } from "react";
import { useGame } from "./game/useGame";
import { MISSION_CONFIG } from "./game/config";
import { missionCards } from "./game/data/missionCards";
import type { NasaEvent } from "./types/game";
import MainMenu from "./pages/MainMenu";
import MissionDashboard from "./pages/MissionDashboard";
import MissionIntro from "./pages/MissionIntro";

const nasaEvents: readonly NasaEvent[] = [];

function App() {
  const [currentPage, setCurrentPage] = useState<
    "menu" | "intro" | "dashboard"
  >("menu");

  const game = useGame(missionCards, nasaEvents, MISSION_CONFIG);

  const handleStartMission = () => {
    const isNewMission =
      game.state.sol === 1 &&
      game.state.history.length === 0 &&
      game.state.status === "playing";

    setCurrentPage(isNewMission ? "intro" : "dashboard");
  };

  const handleBackToMenu = () => {
    setCurrentPage("menu");
  };

  const handleRestartMission = () => {
    game.restart();
    setCurrentPage("intro");
  };

  if (currentPage === "menu") {
    return <MainMenu onStart={handleStartMission} />;
  }

  if (currentPage === "intro") {
    return (
      <MissionIntro
        onBack={handleBackToMenu}
        onContinue={() => setCurrentPage("dashboard")}
      />
    );
  }

  return (
    <MissionDashboard
      onBack={handleBackToMenu}
      onRestart={handleRestartMission}
      game={game}
    />
  );
}

export default App;