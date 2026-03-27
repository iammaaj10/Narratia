"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  MeshDistortMaterial,
  Float,
  Environment,
  Stars,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";


function BookAnimation({ onComplete }: { onComplete: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04040e);

    // Scale book size based on viewport so it always looks good
    const isMobile = W < 640;
    const isTablet = W < 1024;
    const bookScale = isMobile ? 0.62 : isTablet ? 0.82 : 1.0;

    const camera = new THREE.PerspectiveCamera(isMobile ? 55 : 48, W / H, 0.1, 300);
    camera.position.set(0, 2.0 * bookScale, 9.5 * bookScale);
    camera.lookAt(0, 0, 0);

    // ── Lighting ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a0f40, 1.4));

    const key = new THREE.DirectionalLight(0x8080ff, 4.0);
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

    // ── Ground + Grid ──────────────────────────────────────────────
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x050512, roughness: 0.6, metalness: 0.4 })
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.y = -2.8 * bookScale;
    gnd.receiveShadow = true;
    scene.add(gnd);

    const grid = new THREE.GridHelper(50, 60, 0x1a1040, 0x0a0820);
    grid.position.y = -2.79 * bookScale;
    scene.add(grid);

    // ── Stars ──────────────────────────────────────────────────────
    const sp = new Float32Array(5000 * 3);
    for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 300;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const starsMesh = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.45, sizeAttenuation: true })
    );
    scene.add(starsMesh);

    // ── Ambient dust ───────────────────────────────────────────────
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

    // ── Burst particles ────────────────────────────────────────────
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

    // ── God-ray beam ───────────────────────────────────────────────
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

    // ── Rune glyphs ────────────────────────────────────────────────
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

    // ── BOOK GEOMETRY ──────────────────────────────────────────────
    const BW = 2.5 * bookScale;
    const BH = 3.4 * bookScale;
    const BD = 0.22 * bookScale;

    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const mFront = new THREE.MeshStandardMaterial({ color: 0x1a0e68, roughness: 0.14, metalness: 0.78 });
    const mBack  = new THREE.MeshStandardMaterial({ color: 0x0d0840, roughness: 0.25, metalness: 0.58 });
    const mSpine = new THREE.MeshStandardMaterial({ color: 0x251590, roughness: 0.11, metalness: 0.88 });
    const mEdge  = new THREE.MeshStandardMaterial({ color: 0xe0d8ff, roughness: 0.9,  metalness: 0.0  });
    const mGold  = new THREE.MeshStandardMaterial({
      color: 0xffc830, roughness: 0.06, metalness: 1.0,
      emissive: new THREE.Color(0xb86000), emissiveIntensity: 0.3,
    });
    const mEmboss = new THREE.MeshStandardMaterial({
      color: 0x7070ff, roughness: 0.07, metalness: 1.0,
      emissive: new THREE.Color(0x3030aa), emissiveIntensity: 0.55,
    });
    const mInnerGlow = new THREE.MeshStandardMaterial({
      color: 0x8060ff, emissive: new THREE.Color(0x4020a0), emissiveIntensity: 1.6,
      transparent: true, opacity: 0.0, side: THREE.BackSide,
    });
    const mOpenPage = new THREE.MeshStandardMaterial({
      color: 0xf5eeff, roughness: 0.78, metalness: 0.0,
      emissive: new THREE.Color(0x1a0035), emissiveIntensity: 0,
    });

    // Spine
    bookGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(BD, BH, BD), mSpine), { castShadow: true }));

    // Spine inner glow strip
    const spineGlow = new THREE.Mesh(new THREE.BoxGeometry(BD * 0.3, BH * 0.9, BD * 0.08), mInnerGlow);
    spineGlow.position.set(0, 0, BD * 0.4);
    bookGroup.add(spineGlow);

    // Back cover
    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD * 0.38), mBack);
    backMesh.position.set(-BW / 2, 0, 0);
    backMesh.castShadow = backMesh.receiveShadow = true;
    bookGroup.add(backMesh);

    // Page block
    const pbMesh = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.965, BH * 0.97, BD * 0.32), mEdge);
    pbMesh.position.set(-BW / 2, 0, BD * 0.05);
    pbMesh.receiveShadow = true;
    bookGroup.add(pbMesh);

    // Open page (visible on inside when cover opens)
    const openPage = new THREE.Mesh(new THREE.PlaneGeometry(BW * 0.96, BH * 0.96), mOpenPage);
    openPage.position.set(-BW / 2, 0, BD * 0.21);
    openPage.receiveShadow = true;
    bookGroup.add(openPage);

    // Front cover pivot
    const frontGroup = new THREE.Group();
    frontGroup.position.set(BD * 0.5, 0, BD * 0.5);
    bookGroup.add(frontGroup);

    const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD * 0.38), mFront);
    frontMesh.position.set(BW / 2, 0, 0);
    frontMesh.castShadow = frontMesh.receiveShadow = true;
    frontGroup.add(frontMesh);

    // Gold outer border
    ([
      [BW / 2,       BH / 2 - 0.06 * bookScale,  BD * 0.2, BW * 0.92, 0.018 * bookScale, 0.018 * bookScale],
      [BW / 2,      -BH / 2 + 0.06 * bookScale,  BD * 0.2, BW * 0.92, 0.018 * bookScale, 0.018 * bookScale],
      [0.09 * bookScale,  0, BD * 0.2, 0.018 * bookScale, BH * 0.9, 0.018 * bookScale],
      [BW - 0.09 * bookScale, 0, BD * 0.2, 0.018 * bookScale, BH * 0.9, 0.018 * bookScale],
    ] as [number,number,number,number,number,number][]).forEach(([x,y,z,w,h,d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mGold);
      m.position.set(x, y, z);
      frontGroup.add(m);
    });

    // Gold inner border
    ([
      [BW / 2,       BH / 2 - 0.18 * bookScale, BD * 0.2, BW * 0.78, 0.014 * bookScale, 0.014 * bookScale],
      [BW / 2,      -BH / 2 + 0.18 * bookScale, BD * 0.2, BW * 0.78, 0.014 * bookScale, 0.014 * bookScale],
      [0.24 * bookScale,  0, BD * 0.2, 0.014 * bookScale, BH * 0.74, 0.014 * bookScale],
      [BW - 0.24 * bookScale, 0, BD * 0.2, 0.014 * bookScale, BH * 0.74, 0.014 * bookScale],
    ] as [number,number,number,number,number,number][]).forEach(([x,y,z,w,h,d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mGold);
      m.position.set(x, y, z);
      frontGroup.add(m);
    });

    // Corner diamonds
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

    // Horizontal accent lines
    [-0.72 * bookScale, -1.02 * bookScale, -1.32 * bookScale].forEach((y) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.68, 0.014 * bookScale, 0.014 * bookScale), mGold);
      l.position.set(BW / 2, y, BD * 0.2);
      frontGroup.add(l);
    });

    // N emboss (3 bars)
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

    // Title bars under N
    [{ y: 0.06 * bookScale, w: 0.88 * bookScale }, { y: -0.06 * bookScale, w: 0.58 * bookScale }].forEach(({ y, w }) => {
      const tb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05 * bookScale, 0.018 * bookScale), mGold);
      tb.position.set(BW / 2, y, BD * 0.21);
      frontGroup.add(tb);
    });

    // ── Page fans ──────────────────────────────────────────────────
    const NUM_PAGES = 26;
    const pageGroup = new THREE.Group();
    pageGroup.position.copy(frontGroup.position);
    bookGroup.add(pageGroup);

    const pages: THREE.Mesh[] = [];
    for (let i = 0; i < NUM_PAGES; i++) {
      // Subdivided for curl
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

    // ── Curl helper ────────────────────────────────────────────────
    function applyCurl(mesh: THREE.Mesh, openFrac: number) {
      const geo  = mesh.geometry as THREE.BufferGeometry;
      const attr = geo.attributes.position as THREE.BufferAttribute;
      const cols = 11; // 10 segs + 1
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

    // ── Animation state ────────────────────────────────────────────
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

    // Smooth easing
    const easeInOutSine  = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
    const easeOutCubic   = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    const easeOutQuart   = (t: number) => 1 - Math.pow(1 - t, 4);
    const easeOutElastic = (t: number) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)) + 1;
    };

    const clock = new THREE.Clock();
    let rafId: number;
    let finished = false;

    function tick() {
      rafId = requestAnimationFrame(tick);
      if (finished) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t  = clock.getElapsedTime();

      // Stars drift
      starsMesh.rotation.y += 0.00006;

      // Dust drift
      const dattr = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        let x = dattr.getX(i) + dustVel[i*3];
        let y = dattr.getY(i) + dustVel[i*3+1];
        let z = dattr.getZ(i) + dustVel[i*3+2];
        if (y > 9) y = -9;
        if (Math.abs(x) > 14) dustVel[i*3]   *= -1;
        if (Math.abs(z) > 14) dustVel[i*3+2] *= -1;
        dattr.setXYZ(i, x, y, z);
      }
      dattr.needsUpdate = true;

      // Runes float + fade
      runes.forEach((r) => {
        const ud = (r as any).userData;
        r.position.y = ud.baseY + Math.sin(t * ud.spd + ud.phase) * 0.3;
        r.rotation.y = t * 0.22 + ud.phase;
        r.rotation.z = Math.sin(t * 0.38 + ud.phase) * 0.16;
        const mat = r.material as THREE.MeshStandardMaterial;
        mat.opacity += (ud.targetOp - mat.opacity) * 0.03; // smooth lerp
      });

      // Burst update
      if (burstActive) {
        burstTimer += dt;
        const battr = burstGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < BURST; i++) {
          bLife[i] += dt * 0.55;
          if (bLife[i] < 1.0) {
            battr.setXYZ(i,
              battr.getX(i) + bVel[i*3],
              battr.getY(i) + bVel[i*3+1],
              battr.getZ(i) + bVel[i*3+2]
            );
            bVel[i*3+1] -= 0.0007;
          }
        }
        battr.needsUpdate = true;
        burstMat.opacity = Math.max(0, 0.9 * (1 - burstTimer * 0.65));
        if (burstTimer > 2.5) burstActive = false;
      }

      // Gold shimmer
      mGold.emissiveIntensity = 0.3 + Math.sin(t * 1.8) * 0.1;

      // ── INTRO: book descends smoothly from above ─────────────────
      if (phase === "intro") {
        phaseT += dt * 0.5;
        if (phaseT > 1) phaseT = 1;
        const e = easeOutCubic(phaseT);
        bookGroup.position.y = 5 * bookScale * (1 - e);
        bookGroup.rotation.y = Math.sin(t * 0.4) * 0.06 - 0.06;
        bookGroup.rotation.x = 0.12 * (1 - e);
        if (phaseT >= 1) { phase = "tilt"; phaseT = 0; }
      }

      // ── TILT: camera orbits for drama ────────────────────────────
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

      // ── OPEN: cover swings open, pages fan + curl ────────────────
      if (phase === "open") {
        phaseT += dt * 0.38; // slightly slower = more satisfying
        if (phaseT > 1) phaseT = 1;

        const eCover = easeInOutCubic(Math.min(phaseT * 1.05, 1));
        const eElastic = easeOutElastic(phaseT);

        frontGroup.rotation.y = TARGET_ANGLE * eCover;

        pages.forEach((pg, i) => {
          const delay = (i / NUM_PAGES) * 0.32;
          const pT    = Math.max(0, Math.min(1, (phaseT - delay) * 1.45));
          pg.rotation.y = TARGET_ANGLE * easeOutQuart(pT) * ((i + 1) / NUM_PAGES) * 0.58;
          // curl peaks mid-turn then flattens
          applyCurl(pg, Math.sin(pT * Math.PI) * Math.abs(pg.rotation.y / TARGET_ANGLE));
        });

        // Camera glide to open position
        const camE = easeInOutSine(Math.min(phaseT * 1.15, 1));
        camera.position.lerpVectors(camTilt, camOpen, camE);
        camera.lookAt(new THREE.Vector3().lerpVectors(lookTilt, lookOpen, camE));

        bookGroup.rotation.y = 0.09 - eElastic * 0.04;
        bookGroup.position.y = Math.sin(t * 1.1) * 0.035 * bookScale;

        // Lights ramp up smoothly
        fillR.intensity     = 3.5 + eCover * 6.5;
        rimBack.intensity   = 5.5 + eCover * 7.0;
        spineLight.intensity = eCover * 9;
        pageGlow.intensity   = eCover * 6;
        mInnerGlow.opacity   = eCover * 0.65;
        mOpenPage.emissiveIntensity = eCover * 0.85;
        beamMat.opacity      = eCover * 0.11;

        runes.forEach((r) => { (r as any).userData.targetOp = eCover * 0.5; });

        // Trigger burst once at peak
        if (phaseT > 0.42 && !burstActive && burstTimer === 0) {
          burstActive = true;
          const battr = burstGeo.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < BURST; i++) { battr.setXYZ(i, 0, 0, 0); bLife[i] = 0; }
          battr.needsUpdate = true;
          burstMesh.position.copy(bookGroup.position);
        }

        if (phaseT >= 1) { phase = "rise"; phaseT = 0; }
      }

      // ── RISE: camera pulls back, fog rolls in ────────────────────
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
        scene.fog = new THREE.FogExp2(0x04040e, 0.008 + e * 0.18);

        if (phaseT >= 1) {
          phase = "done";
          finished = true;
          onComplete();
        }
      }

      renderer.render(scene, camera);
    }

    tick();
    // Small initial pause so renderer is ready before animation begins
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

  return (
    <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 9999 }} />
  );
}


function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.25;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.2}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.35}
          speed={1.5}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>
    </Float>
  );
}

function FloatingParticles() {
  const count = 150;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return positions;
  }, [count]);
  const particlesRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (particlesRef.current)
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.03;
  });
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#818cf8"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.25}
        penumbra={1}
        intensity={0.8}
      />
      <AnimatedSphere />
      <FloatingParticles />
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.8}
      />
      <Environment preset="night" />
    </>
  );
}


function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}


function FeatureCard({ icon, title, description, index }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)`;
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
        }}
        className="group relative p-6 sm:p-8 rounded-2xl border border-indigo-500/20 bg-gray-900/50 backdrop-blur-sm hover:border-indigo-500/40 overflow-hidden h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="text-4xl sm:text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" />
      </div>
    </motion.div>
  );
}

export default function Page() {
  const [scrollY, setScrollY] = useState(0);
  const [bookDone, setBookDone] = useState(false);
  const [showPage, setShowPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBookComplete = () => {
    setBookDone(true);
    setTimeout(() => setShowPage(true), 50);
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");
        * {
          scroll-behavior: smooth;
          font-family: "Inter", sans-serif;
        }

        @keyframes float-gentle {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float-gentle {
          animation: float-gentle 4s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
          }
        }
        .glow-button {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .glass-card {
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }
      `}</style>

      {/* Book animation overlay */}
      <AnimatePresence>
        {!bookDone && (
          <motion.div
            key="book-overlay"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          >
            <BookAnimation onComplete={handleBookComplete} />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.2 }}
              style={{
                position: "absolute",
                bottom: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "clamp(0.6rem, 1.5vw, 0.72rem)",
                color: "rgba(167,139,250,0.4)",
                letterSpacing: "0.22em",
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

      {/* Original Narratia page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showPage ? 1 : 0 }}
        transition={{ duration: 0.9, ease: "easeIn" }}
      >
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-hidden relative">
          {/* 3D Background */}
          <div className="fixed inset-0 z-0 opacity-60">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <Suspense fallback={null}>
                <Scene3D />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.3}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Gradient Overlays */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          </div>

          {/* Navigation */}
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
              scrollY > 50 ? "glass-card shadow-lg" : "bg-transparent"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <a href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg transform group-hover:scale-105 transition-transform">
                    N
                  </div>
                  <span className="text-xl sm:text-2xl font-semibold text-white">
                    Narratia
                  </span>
                </a>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    className="hidden sm:block px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    onClick={() => router.push("/login")}
                  >
                    Sign in
                  </button>
                  <button
                    className="px-5 sm:px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25"
                    onClick={() => router.push("/register")}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20">
            <div className="relative z-10 max-w-6xl mx-auto text-center">
             

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="text-white">Where stories evolve</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  into experiences.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                Experience the future of storytelling with immersive
                collaboration, AI-powered insights, and real-time team
                synchronization.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <button
                  onClick={() => router.push("/register")}
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/30 glow-button"
                >
                  Start Writing for Free
                </button>
                <button className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white glass-card rounded-xl hover:bg-white/5 transition-all">
                  Watch Demo →
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto"
              >
                {[
                  {
                    icon: "✨",
                    value: 10,
                    suffix: "K+",
                    label: "Active Writers",
                  },
                  {
                    icon: "📚",
                    value: 50,
                    suffix: "K+",
                    label: "Stories Created",
                  },
                  { icon: "⚡", value: 99, suffix: "%", label: "Satisfaction" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                    className="glass-card p-6 sm:p-8 rounded-xl text-center"
                  >
                    <div className="text-3xl sm:text-4xl mb-3 animate-float-gentle">
                      {stat.icon}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                      <Counter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-gray-400 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section className="relative py-20 sm:py-32 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  Everything you need to{" "}
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    build stories
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                  Powerful tools designed for writers who think big
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: "🎭",
                    title: "Story Arcs",
                    description:
                      "Organize your narrative into well defined arcs with clear progression and structure",
                  },
                  {
                    icon: "✍️",
                    title: "AI Co-Pilot",
                    description:
                      "Real-time AI assistance that understands your vision and enhances every word.",
                  },
                  {
                    icon: "⚡",
                    title: "Team Collaboration",
                    description:
                      "Instant collaboration with zero-latency team synchronization and real-time editing.",
                  },
                  {
                    icon: "📖",
                    title: "Multi-Format Export",
                    description:
                      "Transform your stories into any format: books, scripts, or screenplays",
                  },
                ].map((feature, index) => (
                  <FeatureCard key={index} {...feature} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-20 sm:py-32 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Ready to start your{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    epic story?
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Join thousands of writers building their worlds on Narratia.
                  Free to start, scales with your ambition.
                </p>
                <button
                  onClick={() => router.push("/register")}
                  className="px-10 sm:px-12 py-4 sm:py-5 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-2xl shadow-indigo-500/30 glow-button"
                >
                  Get Started for Free →
                </button>
              </motion.div>
            </div>
          </section>

          <footer className="relative border-t border-indigo-500/10 py-12 sm:py-16 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              {/* Centered Brand Section */}
              <div className="flex flex-col items-center justify-center text-center mb-12">
                <a
                  href="/"
                  className="flex items-center gap-3 mb-4 group w-fit"
                >
                  <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold transform group-hover:scale-105 transition-transform">
                    N
                  </div>
                  <span className="text-lg font-semibold text-white">
                    Narratia
                  </span>
                </a>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  The AI-powered storytelling platform for writers who dream big
                  and create without limits to give the world some mindblowing stories.
                </p>
              </div>

              {/* Footer Bottom */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-indigo-500/10">
                <p className="text-sm text-gray-600">
                  © 2026 Narratia Inc. All rights reserved by <span className="font-bold">Maaj Bhadgaonkar</span>
                </p>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  {[
                    "Privacy Policy",
                    "Terms of Service",
                    "Cookie Settings",
                  ].map((item, i) => (
                    <a
                      key={i}
                      href="#"
                      className="text-sm text-gray-600 hover:text-indigo-400 transition-colors"
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