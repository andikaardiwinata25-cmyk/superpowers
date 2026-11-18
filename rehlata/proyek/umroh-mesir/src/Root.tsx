import { Composition } from "remotion";
import { Kumpul, KUMPUL_FRAMES } from "./Kumpul";
import { Main } from "./Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="UmrohMesir" component={Main} durationInFrames={2979} fps={30} width={1080} height={1920} />
      <Composition id="KumpulDulu" component={Kumpul} durationInFrames={KUMPUL_FRAMES} fps={30} width={1080} height={1920} />
    </>
  );
};
