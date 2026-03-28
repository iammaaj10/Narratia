"use client";

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  MeshDistortMaterial,
  Float,
  Environment,
  Stars,
} from "@react-three/drei";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// BOOK ANIMATION  (unchanged logic, enhanced visual polish)
// ─────────────────────────────────────────────────────────────────────────────
function BookAnimation({ onComplete }: { onComplete: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02020a);

    const isMobile = W < 640;
    const isTablet = W < 1024;
    const bookScale = isMobile ? 0.62 : isTablet ? 0.82 : 1.0;

    const camera = new THREE.PerspectiveCamera(isMobile ? 55 : 48, W / H, 0.1, 300);
    camera.position.set(0, 2.0 * bookScale, 9.5 * bookScale);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x1a0f40, 1.6));

    const key = new THREE.DirectionalLight(0x8080ff, 4.5);
    key.position.set(-4, 10, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 50;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    key.shadow.bias = -0.0003;
    scene.add(key);

    const fillR = new THREE.PointLight(0xff9030, 3.5, 30);
    fillR.position.set(8, 2, 5);
    scene.add(fillR);

    const rimBack = new THREE.PointLight(0x7c3aed, 5.5, 24);
    rimBack.position.set(0, 4, -8);
    scene.add(rimBack);

    const underGlow = new THREE.PointLight(0x4f46e5, 3.0, 16);
    underGlow.position.set(0, -3.5, 3);
    scene.add(underGlow);

    const spineLight = new THREE.PointLight(0xa78bfa, 0, 12);
    spineLight.position.set(0, 0, 1.5);
    scene.add(spineLight);

    const pageGlow = new THREE.PointLight(0xfff4e0, 0, 18);
    pageGlow.position.set(-1.5, 0, 2);
    scene.add(pageGlow);

    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x030310, roughness: 0.6, metalness: 0.4 })
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.y = -2.8 * bookScale;
    gnd.receiveShadow = true;
    scene.add(gnd);

    const grid = new THREE.GridHelper(50, 60, 0x1a1040, 0x0a0820);
    grid.position.y = -2.79 * bookScale;
    scene.add(grid);

    const sp = new Float32Array(5000 * 3);
    for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 300;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const starsMesh = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.45, sizeAttenuation: true })
    );
    scene.add(starsMesh);

    const DUST = 1800;
    const dustPos = new Float32Array(DUST * 3);
    const dustVel = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 26;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 26;
      dustVel[i * 3]     = (Math.random() - 0.5) * 0.0025;
      dustVel[i * 3 + 1] = Math.random() * 0.0018 + 0.0008;
      dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.0025;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMesh = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xb4a0ff, size: 0.032, transparent: true, opacity: 0.22, sizeAttenuation: true })
    );
    scene.add(dustMesh);

    const BURST = 280;
    const bPos = new Float32Array(BURST * 3);
    const bVel = new Float32Array(BURST * 3);
    const bLife = new Float32Array(BURST);
    for (let i = 0; i < BURST; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = (Math.random() - 0.5) * Math.PI;
      const spd   = 0.035 + Math.random() * 0.09;
      bVel[i * 3]     = Math.cos(theta) * Math.cos(phi) * spd;
      bVel[i * 3 + 1] = Math.sin(phi) * spd + 0.018;
      bVel[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * spd;
      bLife[i] = 0;
    }
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
    const burstMat = new THREE.PointsMaterial({
      color: 0xffc040,
      size: 0.065,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    const burstMesh = new THREE.Points(burstGeo, burstMat);
    scene.add(burstMesh);
    let burstActive = false;
    let burstTimer = 0;

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x8b6fff,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 8, 32, 1, true), beamMat);
    beam.position.set(0, 4, 0);
    beam.rotation.z = Math.PI;
    scene.add(beam);

    const rColors = [0x6366f1, 0x8b5cf6, 0xa78bfa, 0xc4b5fd, 0x818cf8, 0xe879f9];
    const runes: THREE.Mesh[] = [];
    for (let i = 0; i < (isMobile ? 8 : 12); i++) {
      const s = 0.08 + Math.random() * 0.16;
      const rm = new THREE.MeshStandardMaterial({
        color: rColors[i % rColors.length],
        emissive: new THREE.Color(rColors[i % rColors.length]),
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const r = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 1.6), rm);
      const ang = (i / (isMobile ? 8 : 12)) * Math.PI * 2;
      const rad = (4 + Math.random() * 2.5) * bookScale;
      r.position.set(Math.cos(ang) * rad, -0.8 + Math.random() * 3.5, Math.sin(ang) * rad - 0.5);
      (r as any).userData = { baseY: r.position.y, phase: Math.random() * Math.PI * 2, spd: 0.3 + Math.random() * 0.5, targetOp: 0 };
      scene.add(r);
      runes.push(r);
    }

    const BW = 2.5 * bookScale;
    const BH = 3.4 * bookScale;
    const BD = 0.22 * bookScale;

    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const mFront = new THREE.MeshStandardMaterial({ color: 0x1a0e68, roughness: 0.12, metalness: 0.82 });
    const mBack  = new THREE.MeshStandardMaterial({ color: 0x0d0840, roughness: 0.25, metalness: 0.58 });
    const mSpine = new THREE.MeshStandardMaterial({ color: 0x251590, roughness: 0.10, metalness: 0.90 });
    const mEdge  = new THREE.MeshStandardMaterial({ color: 0xe0d8ff, roughness: 0.9, metalness: 0.0 });
    const mGold  = new THREE.MeshStandardMaterial({
      color: 0xffc830, roughness: 0.04, metalness: 1.0,
      emissive: new THREE.Color(0xb86000), emissiveIntensity: 0.35,
    });
    const mEmboss = new THREE.MeshStandardMaterial({
      color: 0x7070ff, roughness: 0.06, metalness: 1.0,
      emissive: new THREE.Color(0x3030aa), emissiveIntensity: 0.60,
    });
    const mInnerGlow = new THREE.MeshStandardMaterial({
      color: 0x8060ff, emissive: new THREE.Color(0x4020a0), emissiveIntensity: 1.8,
      transparent: true, opacity: 0.0, side: THREE.BackSide,
    });
    const mOpenPage = new THREE.MeshStandardMaterial({
      color: 0xf5eeff, roughness: 0.78, metalness: 0.0,
      emissive: new THREE.Color(0x1a0035), emissiveIntensity: 0,
    });

    bookGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(BD, BH, BD), mSpine), { castShadow: true }));

    const spineGlow = new THREE.Mesh(new THREE.BoxGeometry(BD * 0.3, BH * 0.9, BD * 0.08), mInnerGlow);
    spineGlow.position.set(0, 0, BD * 0.4);
    bookGroup.add(spineGlow);

    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD * 0.38), mBack);
    backMesh.position.set(-BW / 2, 0, 0);
    backMesh.castShadow = backMesh.receiveShadow = true;
    bookGroup.add(backMesh);

    const pbMesh = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.965, BH * 0.97, BD * 0.32), mEdge);
    pbMesh.position.set(-BW / 2, 0, BD * 0.05);
    pbMesh.receiveShadow = true;
    bookGroup.add(pbMesh);

    const openPage = new THREE.Mesh(new THREE.PlaneGeometry(BW * 0.96, BH * 0.96), mOpenPage);
    openPage.position.set(-BW / 2, 0, BD * 0.21);
    openPage.receiveShadow = true;
    bookGroup.add(openPage);

    const frontGroup = new THREE.Group();
    frontGroup.position.set(BD * 0.5, 0, BD * 0.5);
    bookGroup.add(frontGroup);

    const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD * 0.38), mFront);
    frontMesh.position.set(BW / 2, 0, 0);
    frontMesh.castShadow = frontMesh.receiveShadow = true;
    frontGroup.add(frontMesh);

    ([
      [BW / 2, BH / 2 - 0.06 * bookScale, BD * 0.2, BW * 0.92, 0.018 * bookScale, 0.018 * bookScale],
      [BW / 2, -BH / 2 + 0.06 * bookScale, BD * 0.2, BW * 0.92, 0.018 * bookScale, 0.018 * bookScale],
      [0.09 * bookScale, 0, BD * 0.2, 0.018 * bookScale, BH * 0.9, 0.018 * bookScale],
      [BW - 0.09 * bookScale, 0, BD * 0.2, 0.018 * bookScale, BH * 0.9, 0.018 * bookScale],
    ] as [number, number, number, number, number, number][]).forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mGold);
      m.position.set(x, y, z);
      frontGroup.add(m);
    });

    ([
      [BW / 2, BH / 2 - 0.18 * bookScale, BD * 0.2, BW * 0.78, 0.014 * bookScale, 0.014 * bookScale],
      [BW / 2, -BH / 2 + 0.18 * bookScale, BD * 0.2, BW * 0.78, 0.014 * bookScale, 0.014 * bookScale],
      [0.24 * bookScale, 0, BD * 0.2, 0.014 * bookScale, BH * 0.74, 0.014 * bookScale],
      [BW - 0.24 * bookScale, 0, BD * 0.2, 0.014 * bookScale, BH * 0.74, 0.014 * bookScale],
    ] as [number, number, number, number, number, number][]).forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mGold);
      m.position.set(x, y, z);
      frontGroup.add(m);
    });

    [[0.09 * bookScale, BH / 2 - 0.06 * bookScale],
     [BW - 0.09 * bookScale, BH / 2 - 0.06 * bookScale],
     [0.09 * bookScale, -BH / 2 + 0.06 * bookScale],
     [BW - 0.09 * bookScale, -BH / 2 + 0.06 * bookScale],
    ].forEach(([cx, cy]) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.11 * bookScale, 0.11 * bookScale, 0.035 * bookScale), mGold);
      c.position.set(cx, cy, BD * 0.21);
      c.rotation.z = Math.PI / 4;
      frontGroup.add(c);
    });

    [-0.72 * bookScale, -1.02 * bookScale, -1.32 * bookScale].forEach((y) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.68, 0.014 * bookScale, 0.014 * bookScale), mGold);
      l.position.set(BW / 2, y, BD * 0.2);
      frontGroup.add(l);
    });

    const nG = new THREE.Group();
    nG.position.set(BW / 2, 0.5 * bookScale, BD * 0.21);
    const nBar = (x: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.08 * bookScale, 0.72 * bookScale, 0.042 * bookScale), mEmboss);
      b.position.set(x * bookScale, 0, 0);
      nG.add(b);
    };
    nBar(-0.20); nBar(0.20);
    const nD = new THREE.Mesh(new THREE.BoxGeometry(0.07 * bookScale, 0.82 * bookScale, 0.038 * bookScale), mEmboss);
    nD.rotation.z = -0.5;
    nG.add(nD);
    frontGroup.add(nG);

    [{ y: 0.06 * bookScale, w: 0.88 * bookScale }, { y: -0.06 * bookScale, w: 0.58 * bookScale }].forEach(({ y, w }) => {
      const tb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05 * bookScale, 0.018 * bookScale), mGold);
      tb.position.set(BW / 2, y, BD * 0.21);
      frontGroup.add(tb);
    });

    const NUM_PAGES = 26;
    const pageGroup = new THREE.Group();
    pageGroup.position.copy(frontGroup.position);
    bookGroup.add(pageGroup);

    const pages: THREE.Mesh[] = [];
    for (let i = 0; i < NUM_PAGES; i++) {
      const pGeo = new THREE.PlaneGeometry(BW * 0.95, BH * 0.95, 10, 1);
      const pMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().lerpColors(new THREE.Color(0xfaf6ff), new THREE.Color(0xd8ccff), (i / (NUM_PAGES - 1)) * 0.28),
        roughness: 0.88, metalness: 0.0, side: THREE.DoubleSide,
      });
      const pg = new THREE.Mesh(pGeo, pMat);
      pg.position.set(BW / 2, 0, -BD * 0.15 + (i / NUM_PAGES) * BD * 0.3);
      pg.castShadow = pg.receiveShadow = true;
      pages.push(pg);
      pageGroup.add(pg);
    }

    function applyCurl(mesh: THREE.Mesh, openFrac: number) {
      const geo  = mesh.geometry as THREE.BufferGeometry;
      const attr = geo.attributes.position as THREE.BufferAttribute;
      const cols = 11;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cols; col++) {
          const u    = col / (cols - 1);
          const curl = Math.sin(u * Math.PI * 0.6) * openFrac * 0.18;
          attr.setZ(row * cols + col, curl);
        }
      }
      attr.needsUpdate = true;
      geo.computeVertexNormals();
    }

    type Phase = "intro" | "tilt" | "open" | "rise" | "done";
    let phase: Phase = "intro";
    let phaseT = 0;

    const TARGET_ANGLE = -Math.PI * 0.97;

    const camIntro = new THREE.Vector3(0, 2.0 * bookScale, 9.5 * bookScale);
    const camTilt  = new THREE.Vector3(1.2 * bookScale, 1.8 * bookScale, 9.0 * bookScale);
    const camOpen  = new THREE.Vector3(-0.4 * bookScale, 1.6 * bookScale, 8.2 * bookScale);
    const camRise  = new THREE.Vector3(0, 7.5 * bookScale, 17 * bookScale);

    const lookIntro = new THREE.Vector3(0, 0, 0);
    const lookTilt  = new THREE.Vector3(0, -0.2, 0);
    const lookOpen  = new THREE.Vector3(-0.2, 0, 0);
    const lookRise  = new THREE.Vector3(0, 1.5, 0);

    const easeInOutSine  = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
    const easeOutCubic   = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuart   = (t: number) => 1 - Math.pow(1 - t, 4);
    const easeOutElastic = (t: number) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    };

    const clock = new THREE.Clock();
    let rafId: number;
    let finished = false;

    function tick() {
      rafId = requestAnimationFrame(tick);
      if (finished) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.getElapsedTime();

      starsMesh.rotation.y += 0.00006;

      const dattr = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        let x = dattr.getX(i) + dustVel[i * 3];
        let y = dattr.getY(i) + dustVel[i * 3 + 1];
        let z = dattr.getZ(i) + dustVel[i * 3 + 2];
        if (y > 9) y = -9;
        if (Math.abs(x) > 14) dustVel[i * 3]   *= -1;
        if (Math.abs(z) > 14) dustVel[i * 3 + 2] *= -1;
        dattr.setXYZ(i, x, y, z);
      }
      dattr.needsUpdate = true;

      runes.forEach((r) => {
        const ud = (r as any).userData;
        r.position.y = ud.baseY + Math.sin(t * ud.spd + ud.phase) * 0.3;
        r.rotation.y = t * 0.22 + ud.phase;
        r.rotation.z = Math.sin(t * 0.38 + ud.phase) * 0.16;
        const mat = r.material as THREE.MeshStandardMaterial;
        mat.opacity += (ud.targetOp - mat.opacity) * 0.03;
      });

      if (burstActive) {
        burstTimer += dt;
        const battr = burstGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < BURST; i++) {
          bLife[i] += dt * 0.55;
          if (bLife[i] < 1.0) {
            battr.setXYZ(i,
              battr.getX(i) + bVel[i * 3],
              battr.getY(i) + bVel[i * 3 + 1],
              battr.getZ(i) + bVel[i * 3 + 2]
            );
            bVel[i * 3 + 1] -= 0.0007;
          }
        }
        battr.needsUpdate = true;
        burstMat.opacity = Math.max(0, 0.9 * (1 - burstTimer * 0.65));
        if (burstTimer > 2.5) burstActive = false;
      }

      mGold.emissiveIntensity = 0.35 + Math.sin(t * 1.8) * 0.12;

      if (phase === "intro") {
        phaseT += dt * 0.5;
        if (phaseT > 1) phaseT = 1;
        const e = easeOutCubic(phaseT);
        bookGroup.position.y = 5 * bookScale * (1 - e);
        bookGroup.rotation.y = Math.sin(t * 0.4) * 0.06 - 0.06;
        bookGroup.rotation.x = 0.12 * (1 - e);
        if (phaseT >= 1) { phase = "tilt"; phaseT = 0; }
      }

      if (phase === "tilt") {
        phaseT += dt * 0.65;
        if (phaseT > 1) phaseT = 1;
        const e = easeInOutSine(phaseT);
        camera.position.lerpVectors(camIntro, camTilt, e);
        camera.lookAt(new THREE.Vector3().lerpVectors(lookIntro, lookTilt, e));
        bookGroup.rotation.y = -0.06 + e * 0.15;
        bookGroup.position.y = Math.sin(t * 0.6) * 0.05 * bookScale;
        if (phaseT >= 1) { phase = "open"; phaseT = 0; }
      }

      if (phase === "open") {
        phaseT += dt * 0.38;
        if (phaseT > 1) phaseT = 1;

        const eCover   = easeInOutCubic(Math.min(phaseT * 1.05, 1));
        const eElastic = easeOutElastic(phaseT);

        frontGroup.rotation.y = TARGET_ANGLE * eCover;

        pages.forEach((pg, i) => {
          const delay = (i / NUM_PAGES) * 0.32;
          const pT    = Math.max(0, Math.min(1, (phaseT - delay) * 1.45));
          pg.rotation.y = TARGET_ANGLE * easeOutQuart(pT) * ((i + 1) / NUM_PAGES) * 0.58;
          applyCurl(pg, Math.sin(pT * Math.PI) * Math.abs(pg.rotation.y / TARGET_ANGLE));
        });

        const camE = easeInOutSine(Math.min(phaseT * 1.15, 1));
        camera.position.lerpVectors(camTilt, camOpen, camE);
        camera.lookAt(new THREE.Vector3().lerpVectors(lookTilt, lookOpen, camE));

        bookGroup.rotation.y = 0.09 - eElastic * 0.04;
        bookGroup.position.y = Math.sin(t * 1.1) * 0.035 * bookScale;

        fillR.intensity      = 3.5 + eCover * 6.5;
        rimBack.intensity    = 5.5 + eCover * 7.0;
        spineLight.intensity = eCover * 9;
        pageGlow.intensity   = eCover * 6;
        mInnerGlow.opacity   = eCover * 0.65;
        mOpenPage.emissiveIntensity = eCover * 0.85;
        beamMat.opacity      = eCover * 0.11;

        runes.forEach((r) => { (r as any).userData.targetOp = eCover * 0.5; });

        if (phaseT > 0.42 && !burstActive && burstTimer === 0) {
          burstActive = true;
          const battr = burstGeo.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < BURST; i++) { battr.setXYZ(i, 0, 0, 0); bLife[i] = 0; }
          battr.needsUpdate = true;
          burstMesh.position.copy(bookGroup.position);
        }

        if (phaseT >= 1) { phase = "rise"; phaseT = 0; }
      }

      if (phase === "rise") {
        phaseT += dt * 0.4;
        if (phaseT > 1) phaseT = 1;
        const e = easeOutQuart(phaseT);

        camera.position.lerpVectors(camOpen, camRise, e);
        camera.lookAt(new THREE.Vector3().lerpVectors(lookOpen, lookRise, e));

        frontGroup.rotation.y = TARGET_ANGLE;
        bookGroup.position.y  = Math.sin(t * 0.55) * 0.07 * bookScale;
        bookGroup.rotation.y  = 0.05 + Math.sin(t * 0.28) * 0.03;

        beamMat.opacity = 0.11 * (1 - e * 0.7);
        scene.fog = new THREE.FogExp2(0x02020a, 0.008 + e * 0.18);

        if (phaseT >= 1) {
          phase = "done";
          finished = true;
          onComplete();
        }
      }

      renderer.render(scene, camera);
    }

    tick();
    const kickOff = setTimeout(() => { phase = "tilt"; }, 500);

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(kickOff);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onComplete]);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 9999 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D SCENE — cursor-reactive sphere + scroll drift
// ─────────────────────────────────────────────────────────────────────────────
function CursorReactiveSphere({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Breathing scale
    const breathe = 1 + Math.sin(t * 0.8) * 0.04;
    meshRef.current.scale.setScalar(breathe * 2.2);
    meshRef.current.rotation.x = t * 0.15 + mouseY * 0.3;
    meshRef.current.rotation.y = t * 0.25 + mouseX * 0.3;
    // Reactive glow via emissive
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      const glowPulse = 0.5 + Math.sin(t * 1.2) * 0.25 + (Math.abs(mouseX) + Math.abs(mouseY)) * 0.4;
      (mat as any).distort = 0.3 + Math.abs(mouseX) * 0.15 + Math.sin(t * 0.6) * 0.05;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={meshRef} args={[1, 128, 128]}>
        <MeshDistortMaterial
          color="#5b5ef4"
          attach="material"
          distort={0.35}
          speed={1.8}
          roughness={0.15}
          metalness={0.85}
          emissive="#2020aa"
          emissiveIntensity={0.4}
        />
      </Sphere>
    </Float>
  );
}

function FloatingParticles({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    return pos;
  }, []);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const t = clock.getElapsedTime();
    particlesRef.current.rotation.y = t * 0.025 + mouseX * 0.05;
    particlesRef.current.rotation.x = mouseY * 0.03;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#818cf8" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function ScrollDriftCamera({ scrollY }: { scrollY: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const drift = scrollY * 0.0008;
    camera.position.y += (-drift - camera.position.y) * 0.04;
    camera.position.z += (5 + scrollY * 0.003 - camera.position.z) * 0.04;
  });
  return null;
}

function Scene3D({ mouseX, mouseY, scrollY }: { mouseX: number; mouseY: number; scrollY: number }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={0.9} color="#8888ff" />
      <spotLight position={[0, 15, 0]} angle={0.25} penumbra={1} intensity={0.9} color="#a070ff" />
      <pointLight position={[-8, -5, 3]} intensity={0.5} color="#ff6030" />
      <CursorReactiveSphere mouseX={mouseX} mouseY={mouseY} />
      <FloatingParticles mouseX={mouseX} mouseY={mouseY} />
      <Stars radius={120} depth={60} count={4000} factor={3} saturation={0} fade speed={0.6} />
      <Environment preset="night" />
      <ScrollDriftCamera scrollY={scrollY} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2200;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(target * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return <span>{count}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAGNETIC BUTTON — Apple/Linear-level hover magnetic pull
// ─────────────────────────────────────────────────────────────────────────────
function MagneticButton({ children, className, onClick, style }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 22 });
  const sy = useSpring(y, { stiffness: 300, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.35);
    y.set((e.clientY - cy) * 0.35);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    onClick?.();
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden ${className}`}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          style={{ left: r.x, top: r.y }}
          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 animate-ping pointer-events-none"
        />
      ))}
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE CARD — premium tilt + glow + sweep
// ─────────────────────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, index }: {
  icon: string; title: string; description: string; index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !sweepRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(1200px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(16px) scale(1.01)`;
    // Moving gradient sweep
    const nx = ((e.clientX - rect.left) / rect.width) * 100;
    const ny = ((e.clientY - rect.top) / rect.height) * 100;
    sweepRef.current.style.background = `radial-gradient(circle at ${nx}% ${ny}%, rgba(99,102,241,0.18) 0%, transparent 65%)`;
    sweepRef.current.style.opacity = "1";
  };
  const handleMouseLeave = () => {
    if (!cardRef.current || !sweepRef.current) return;
    cardRef.current.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)";
    sweepRef.current.style.opacity = "0";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: "preserve-3d", transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease" }}
        className="group relative p-7 sm:p-8 rounded-2xl border border-white/[0.07] bg-[#0a0a1a]/70 backdrop-blur-xl hover:border-indigo-500/30 overflow-hidden h-full hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]"
      >
        {/* Animated gradient sweep on hover */}
        <div
          ref={sweepRef}
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
        />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
        {/* Bottom gradient bar */}
        <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out" />
        {/* Top-right corner glow */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="relative w-14 h-14 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl blur-md group-hover:blur-lg group-hover:from-indigo-500/35 group-hover:to-purple-500/35 transition-all duration-400" />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.07] to-white/[0.03] border border-white/[0.08] text-3xl transform group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white/90 mb-3 group-hover:text-indigo-200 transition-colors duration-300 tracking-tight">
            {title}
          </h3>
          <p className="text-sm sm:text-[0.95rem] text-white/40 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED GRADIENT TEXT — slow cinematic flow
// ─────────────────────────────────────────────────────────────────────────────
function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: "linear-gradient(135deg, #818cf8 0%, #a78bfa 25%, #e879f9 50%, #f472b6 75%, #818cf8 100%)",
        backgroundSize: "300% 300%",
        animation: "gradientFlow 6s ease infinite",
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO PARALLAX LAYER — tied to mouse movement
// ─────────────────────────────────────────────────────────────────────────────
function ParallaxLayer({ children, depth, mouseX, mouseY }: {
  children: React.ReactNode;
  depth: number;
  mouseX: number;
  mouseY: number;
}) {
  const x = useSpring(useMotionValue(mouseX * depth), { stiffness: 80, damping: 20 });
  const y = useSpring(useMotionValue(mouseY * depth), { stiffness: 80, damping: 20 });

  useEffect(() => {
    x.set(mouseX * depth);
    y.set(mouseY * depth);
  }, [mouseX, mouseY, depth]);

  return (
    <motion.div style={{ x, y }} className="will-change-transform">
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT SWEEP — cinematic heading sweep effect
// ─────────────────────────────────────────────────────────────────────────────
function LightSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
          animation: "lightSweep 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Page() {
  const [scrollY, setScrollY] = useState(0);
  const [bookDone, setBookDone] = useState(false);
  const [showPage, setShowPage] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
      setMouseY((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const handleBookComplete = useCallback(() => {
    setBookDone(true);
    setTimeout(() => setShowPage(true), 50);
  }, []);

  // Parallax transforms for hero text
  const heroY = useTransform(
    useMotionValue(scrollY),
    [0, 600],
    [0, -80]
  );

  const navScrolled = scrollY > 50;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");

        *, *::before, *::after { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #02020a;
        }

        /* Noise texture utility */
        .noise::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          border-radius: inherit;
        }

        /* Cinematic gradient text flow */
        @keyframes gradientFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Light sweep across headings */
        @keyframes lightSweep {
          0%   { background-position: -100% 0; }
          50%  { background-position: 200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Gentle float */
        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        .float-gentle { animation: floatGentle 4.5s ease-in-out infinite; }

        /* CTA glow pulse */
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 24px 0 rgba(99,102,241,0.35), 0 0 0 0 rgba(99,102,241,0.12); }
          50%       { box-shadow: 0 0 36px 4px rgba(99,102,241,0.55), 0 0 80px 0 rgba(139,92,246,0.18); }
        }
        .cta-glow { animation: ctaGlow 2.8s ease-in-out infinite; }

        /* Underline hover slide */
        .nav-link { position: relative; }
        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #818cf8, #a78bfa);
          transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nav-link:hover::after { width: 100%; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #02020a; }
        ::-webkit-scrollbar-thumb { background: #3730a3; border-radius: 2px; }
      `}</style>

      {/* ─── Book animation overlay ─────────────────────────────── */}
      <AnimatePresence>
        {!bookDone && (
          <motion.div
            key="book-overlay"
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          >
            <BookAnimation onComplete={handleBookComplete} />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1.2 }}
              style={{
                position: "absolute",
                bottom: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "clamp(0.58rem, 1.4vw, 0.68rem)",
                color: "rgba(167,139,250,0.38)",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                pointerEvents: "none",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              Opening your world…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main page ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showPage ? 1 : 0 }}
        transition={{ duration: 1.1, ease: "easeIn" }}
      >
        <div className="min-h-screen bg-[#02020a] overflow-hidden relative">

          {/* ── 3D Background ─────────────────────────────────── */}
          <div className="fixed inset-0 z-0" style={{ opacity: 0.55 }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 72 }} dpr={[1, 1.5]}>
              <Suspense fallback={null}>
                <Scene3D mouseX={mouseX} mouseY={mouseY} scrollY={scrollY} />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.22}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* ── Ambient glow orbs ─────────────────────────────── */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div
              className="absolute rounded-full blur-[130px]"
              style={{
                top: "8%", left: "18%",
                width: 520, height: 520,
                background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)",
                transform: `translate(${mouseX * 20}px, ${mouseY * 20}px)`,
                transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <div
              className="absolute rounded-full blur-[160px]"
              style={{
                bottom: "10%", right: "14%",
                width: 480, height: 480,
                background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
                transform: `translate(${-mouseX * 14}px, ${-mouseY * 14}px)`,
                transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <div
              className="absolute rounded-full blur-[100px]"
              style={{
                top: "45%", left: "50%",
                width: 300, height: 300,
                marginLeft: -150, marginTop: -150,
                background: "radial-gradient(circle, rgba(232,121,249,0.06) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* ── NAVBAR ────────────────────────────────────────── */}
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              backdropFilter: navScrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
              WebkitBackdropFilter: navScrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
              background: navScrolled
                ? "rgba(2,2,10,0.75)"
                : "transparent",
              borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
              boxShadow: navScrolled ? "0 1px 40px rgba(0,0,0,0.4)" : "none",
            }}
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between"
                style={{ height: navScrolled ? "3.75rem" : "4.5rem", transition: "height 0.4s ease" }}>
                <motion.a
                  href="/"
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="relative flex items-center justify-center text-white font-bold text-lg rounded-xl"
                    style={{
                      width: navScrolled ? 38 : 42,
                      height: navScrolled ? 38 : 42,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
                      boxShadow: "0 0 18px rgba(99,102,241,0.4)",
                      transition: "all 0.4s ease",
                    }}
                  >
                    <span>N</span>
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa, #e879f9)", boxShadow: "0 0 28px rgba(139,92,246,0.6)" }} />
                  </div>
                  <span className="text-xl font-semibold text-white tracking-tight">Narratia</span>
                </motion.a>

                <div className="flex items-center gap-4 sm:gap-5">
                  <button
                    className="nav-link hidden sm:block text-sm font-medium text-white/50 hover:text-white/90 transition-colors duration-200"
                    onClick={() => router.push("/login")}
                  >
                    Sign in
                  </button>
                  <MagneticButton
                    onClick={() => router.push("/register")}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      boxShadow: "0 0 20px rgba(79,70,229,0.35)",
                    } as any}
                  >
                    Get Started
                  </MagneticButton>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* ── HERO SECTION ──────────────────────────────────── */}
          <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20">
            {/* Parallax content wrapper */}
            <div
              className="relative z-10 max-w-6xl mx-auto text-center"
              style={{ transform: `translateY(${scrollY * -0.18}px)` }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.08] tracking-tight"
              >
                <ParallaxLayer depth={8} mouseX={mouseX} mouseY={mouseY}>
                  <span
                    className="text-white block"
                    style={{ textShadow: "0 0 60px rgba(99,102,241,0.15)" }}
                  >
                    Where stories evolve
                  </span>
                </ParallaxLayer>
                <ParallaxLayer depth={14} mouseX={mouseX} mouseY={mouseY}>
                  <span className="block mt-1">
                    <GradientText className="">
                      into experiences.
                    </GradientText>
                  </span>
                </ParallaxLayer>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg md:text-xl text-white/40 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
              >
                Experience the future of storytelling with immersive
                collaboration, AI-powered insights, and real-time team
                synchronization.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
              >
                <MagneticButton
                  onClick={() => router.push("/register")}
                  className="w-full sm:w-auto px-9 py-4 text-[0.95rem] font-semibold text-white rounded-xl cta-glow transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)",
                    backgroundSize: "200% 200%",
                    animation: "gradientFlow 4s ease infinite, ctaGlow 2.8s ease-in-out infinite",
                  } as any}
                >
                  Start Writing for Free
                </MagneticButton>

                <MagneticButton
                  className="w-full sm:w-auto px-9 py-4 text-[0.95rem] font-semibold text-white/80 rounded-xl transition-all duration-300 hover:text-white"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  } as any}
                >
                  Watch Demo →
                </MagneticButton>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto"
              >
                {[
                  { icon: "✨", value: 10, suffix: "K+", label: "Active Writers" },
                  { icon: "📚", value: 50, suffix: "K+", label: "Stories Created" },
                  { icon: "⚡", value: 99, suffix: "%", label: "Satisfaction" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.55, delay: 0.56 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, transition: { duration: 0.25 } }}
                    className="relative noise p-6 sm:p-7 rounded-2xl text-center overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    <LightSweep />
                    <div className="text-3xl sm:text-4xl mb-3 float-gentle" style={{ animationDelay: `${i * 0.7}s` }}>
                      {stat.icon}
                    </div>
                    <div
                      className="text-3xl sm:text-4xl font-bold mb-1.5 bg-clip-text text-transparent"
                      style={{
                        backgroundImage: "linear-gradient(135deg, #818cf8, #a78bfa, #e879f9)",
                        backgroundSize: "300% 300%",
                        animation: "gradientFlow 5s ease infinite",
                        animationDelay: `${i * 0.5}s`,
                      }}
                    >
                      <Counter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs text-white/35 font-medium tracking-wide uppercase">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
            >
              <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="w-1 h-1 rounded-full bg-white/25" style={{ animation: "floatGentle 2s ease-in-out infinite" }} />
            </motion.div>
          </section>

          {/* ── FEATURES SECTION ──────────────────────────────── */}
          <section className="relative py-24 sm:py-36 px-4 sm:px-6">
            {/* Subtle section divider */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mb-16 sm:mb-20"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-medium tracking-widest uppercase text-indigo-300/80"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" style={{ animation: "floatGentle 2s ease-in-out infinite" }} />
                  Platform Features
                </motion.div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                  Everything you need to{" "}
                  <GradientText>build stories</GradientText>
                </h2>
                <p className="text-base sm:text-lg text-white/35 max-w-xl mx-auto font-light leading-relaxed">
                  Powerful tools designed for writers who think big
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[
                  { icon: "🎭", title: "Story Arcs", description: "Organize your narrative into well defined arcs with clear progression and structure" },
                  { icon: "✍️", title: "AI Co-Pilot", description: "Real-time AI assistance that understands your vision and enhances every word." },
                  { icon: "⚡", title: "Team Collaboration", description: "Instant collaboration with zero-latency team synchronization and real-time editing." },
                  { icon: "📖", title: "Multi-Format Export", description: "Transform your stories into any format: books, scripts, or screenplays" },
                ].map((feature, index) => (
                  <FeatureCard key={index} {...feature} index={index} />
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
          </section>

          {/* ── CTA SECTION ───────────────────────────────────── */}
          <section className="relative py-24 sm:py-36 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Background glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(79,70,229,0.08) 0%, transparent 70%)",
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium tracking-widest uppercase text-purple-300/70"
                  style={{
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.14)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" style={{ animation: "floatGentle 2.5s ease-in-out infinite" }} />
                  Join the Community
                </motion.div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                  Ready to start your{" "}
                  <GradientText>epic story?</GradientText>
                </h2>
                <p className="text-lg sm:text-xl text-white/35 mb-12 leading-relaxed max-w-xl mx-auto font-light">
                  Join thousands of writers building their worlds on Narratia.
                  Free to start, scales with your ambition.
                </p>

                <MagneticButton
                  onClick={() => router.push("/register")}
                  className="px-12 py-5 text-base font-semibold text-white rounded-xl cta-glow transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)",
                    backgroundSize: "200% 200%",
                    animation: "gradientFlow 4s ease infinite, ctaGlow 2.8s ease-in-out infinite",
                    letterSpacing: "0.01em",
                  } as any}
                >
                  Get Started for Free →
                </MagneticButton>
              </motion.div>
            </div>
          </section>

          {/* ── FOOTER ────────────────────────────────────────── */}
          <footer className="relative border-t px-4 sm:px-6 py-14 sm:py-18"
            style={{ borderColor: "rgba(255,255,255,0.045)" }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center justify-center text-center mb-12">
                <motion.a
                  href="/"
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 mb-5 group w-fit"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      boxShadow: "0 0 14px rgba(99,102,241,0.35)",
                    }}
                  >
                    N
                  </div>
                  <span className="text-lg font-semibold text-white/80 tracking-tight">Narratia</span>
                </motion.a>
                <p className="text-sm text-white/25 leading-relaxed max-w-xs font-light">
                  The AI-powered storytelling platform for writers who dream big
                  and create without limits to give the world some mindblowing stories.
                </p>
              </div>

              <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                <p className="text-xs text-white/20">
                  © 2026 Narratia Inc. All rights reserved by{" "}
                  <span className="font-semibold text-white/35">Maaj Bhadgaonkar</span>
                </p>
                <div className="flex flex-wrap justify-center gap-5 sm:gap-7">
                  {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((item, i) => (
                    <a
                      key={i}
                      href="#"
                      className="nav-link text-xs text-white/20 hover:text-indigo-400/80 transition-colors duration-200"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </footer>

          <div className="h-20" />
        </div>
      </motion.div>
    </>
  );
}