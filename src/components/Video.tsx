import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "react-three-fiber";
import Frame from "./misc/Frame";
import { Material } from "three";

type Props = JSX.IntrinsicElements["group"] & {
  src: string;
  size: [number, number];
  framed?: boolean;
  muted?: boolean;
  doubleSided?: boolean;
  material?: Material;
};

export const Video = (props: Props) => {
  const { src, size, framed, muted, doubleSided, material } = props;

  const { camera } = useThree();

  const [width, height] = size;
  const listener = useRef<THREE.AudioListener>();
  const [speaker, setSpeaker] = useState<THREE.PositionalAudio>();

  const video = useMemo(() => {
    const v = document.createElement("video");
    // @ts-ignore
    v.playsInline = true;
    v.crossOrigin = "Anonymous";
    v.loop = true;
    v.src = src;
    v.muted = muted ? muted : false;
    return v;
  }, []);

  const playVideo = useCallback(() => {
    if (video) {
      video.play();
    }
  }, [video]);

  const setupAudio = useCallback(() => {
    if (!muted && video && !speaker) {
      listener.current = new THREE.AudioListener();
      camera.add(listener.current);

      const speak = new THREE.PositionalAudio(listener.current);
      speak.setMediaElementSource(video);
      speak.setRefDistance(0.75);
      speak.setRolloffFactor(1);
      speak.setVolume(1);
      speak.setDirectionalCone(180, 230, 0.1);

      setSpeaker(speak);
    }
  }, [speaker, muted, video]);

  useEffect(() => {
    setupAudio();
    playVideo();
    document.addEventListener("click", playVideo);
    return () => {
      document.removeEventListener("click", playVideo);
    };
  }, [playVideo, setupAudio]);

  useEffect(() => {
    return () => {
      if (listener.current) {
        camera.remove(listener.current);
        listener.current.clear();
      }
      if (speaker) {
        speaker.clear();
        speaker.disconnect();
      }
      if (video) {
        video.pause();
        video.remove();
      }
    };
  }, []);

  return (
    <group {...props}>
      {video && (
        <mesh scale={[width, height, 1]}>
          <planeBufferGeometry attach="geometry" args={[1, 1]} />
          <meshBasicMaterial>
            <videoTexture attach="map" args={[video]} />
          </meshBasicMaterial>
        </mesh>
      )}
      {speaker && <primitive object={speaker} />}
      {framed && (
        <Frame
          back={!doubleSided}
          width={width}
          height={height}
          material={material}
        />
      )}
    </group>
  );
};
