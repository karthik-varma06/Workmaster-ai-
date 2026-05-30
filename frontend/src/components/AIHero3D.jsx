// src/components/AIHero3D.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AIHero3D({ className }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const warmLight = new THREE.PointLight(0xffe2b5, 1.5, 20);
    warmLight.position.set(0, 2, 4);
    scene.add(warmLight);

    // helper: create roundedRect shape you provided
    function roundedRect(w, h, r) {
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return s;
    }

    // FRAME
    const frameGeo = new THREE.ExtrudeGeometry(roundedRect(3.6, 3.2, 0.9), {
      depth: 0.6,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 4,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf1d59c, roughness: 0.35, metalness: 0.25 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    scene.add(frame);

    // SCREEN
    const screenGeo = new THREE.ExtrudeGeometry(roundedRect(2.8, 2.4, 0.6), { depth: 0.35, bevelEnabled: false });
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x030405, roughness: 0.95 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.4;
    frame.add(screen);

    // EYES
    function createEye() {
      const geo = new THREE.ExtrudeGeometry(roundedRect(0.9, 0.55, 0.25), {
        depth: 0.18,
        bevelEnabled: true,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        bevelSegments: 3,
      });
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8fffe8,
        emissive: 0x19ffd8,
        emissiveIntensity: 0.8,
        roughness: 0.25,
        metalness: 0.1,
      });
      const eye = new THREE.Mesh(geo, mat);
      const highlight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.75, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
      );
      highlight.position.set(0, 0.12, 0.2);
      eye.add(highlight);
      return eye;
    }

    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(0, 0, 0.55);
    screen.add(eyeGroup);

    const leftEye = createEye();
    const rightEye = createEye();
    leftEye.position.set(-0.65, 0, 0);
    rightEye.position.set(0.65, 0, 0);
    eyeGroup.add(leftEye, rightEye);

    // Floor shadow
    const floorShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
    );
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.y = -2;
    scene.add(floorShadow);

    // cursor tracking
    const mouse = new THREE.Vector2();
    function onMouseMove(e) {
      mouse.x = (e.clientX / mount.clientWidth) * 2 - 1;
      mouse.y = -(e.clientY / mount.clientHeight) * 2 + 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    let tx = 0,
      ty = 0;
    function animate() {
      tx += (mouse.x - tx) * 0.08;
      ty += (mouse.y - ty) * 0.08;
      frame.rotation.y = tx * 0.35;
      frame.rotation.x = ty * 0.18;
      eyeGroup.position.x = tx * 0.22;
      eyeGroup.position.y = ty * 0.12;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    let raf = requestAnimationFrame(animate);

    // responsive resize
    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);
    onResize();

    // cleanup
    return () => {
      if (mount && renderer.domElement.parentNode === mount) {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onMouseMove);
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // dispose geometries & materials to avoid memory leaks:
      [frameGeo, screenGeo].forEach((g) => g.dispose && g.dispose());
    };
  }, []);

  return <div ref={mountRef} className={`ai-3d-wrapper ${className || ""}`} />;
}