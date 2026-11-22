import { GameControls } from './game/GameControls';
import { GameStage } from './game/GameStage';
import { useGame } from './game/useGame';
import { Dashboard } from './live/Dashboard';
import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';

export default function App() {
  const {
    status,
    caiDat,
    audioCfg,
    adminMonitor,
    stageCount,
    audioBlocked,
    serverStopped,
    weeklyTop,
    sleepEndsAt,
    snapshot,
    toggleAdminMonitor,
    unlockAudio,
  } = useGame();

  const stageElement = (
    <GameStage
      snapshot={snapshot}
      caiDat={caiDat}
      weeklyTop={weeklyTop}
      viewerCount={status?.viewerCount ?? 0}
      audioBlocked={IS_STAGE && audioBlocked}
      serverStopped={serverStopped}
      onUnlockAudio={unlockAudio}
    />
  );

  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
        <StageFrame>{stageElement}</StageFrame>
      </div>
    );
  }

  return (
    <Dashboard
      status={status}
      channelName={caiDat.channelName}
      audioCfg={audioCfg}
      adminMonitor={adminMonitor}
      stageCount={stageCount}
      onToggleAdminMonitor={toggleAdminMonitor}
      sampleAnswer={snapshot.sampleAnswer}
      preview={<StageFrame maxHeight={720}>{stageElement}</StageFrame>}
      extra={<GameControls caiDat={caiDat} snapshot={snapshot} sleepEndsAt={sleepEndsAt} />}
    />
  );
}
