import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { ENEMY_MAP } from "../game/data/enemies";
import { CombatState, Position } from "../game/engine/types";

interface CombatBoardProps {
  combat: CombatState;
  mode: string | null;
  moveTargets: Position[];
  highlightedEnemyIds: string[];
  onTileClick: (position: Position) => void;
  onUnitClick: (enemyId: string) => void;
}

interface BoardSnapshot {
  combat: CombatState;
  mode: string | null;
  moveTargets: Position[];
  highlightedEnemyIds: string[];
}

class RuleThiefBoardScene extends Phaser.Scene {
  snapshot: BoardSnapshot | null = null;
  onTileClick: ((position: Position) => void) | null = null;
  onUnitClick: ((enemyId: string) => void) | null = null;

  constructor() {
    super("rule-thief-board");
  }

  create() {
    this.cameras.main.setBackgroundColor("#081018");
    this.redraw();
  }

  setSnapshot(snapshot: BoardSnapshot) {
    this.snapshot = snapshot;
    this.redraw();
  }

  setHandlers(
    onTileClick: (position: Position) => void,
    onUnitClick: (enemyId: string) => void
  ) {
    this.onTileClick = onTileClick;
    this.onUnitClick = onUnitClick;
  }

  redraw() {
    if (!this.scene.isActive() || !this.snapshot) {
      return;
    }

    const size = 56;
    const offsetX = 18;
    const offsetY = 18;
    const boardSize = size * 9;

    this.children.removeAll();

    const frame = this.add.rectangle(offsetX + boardSize / 2, offsetY + boardSize / 2, boardSize + 22, boardSize + 22, 0x05080d, 1);
    frame.setStrokeStyle(2, 0x2cf4ff, 0.35);

    const moveKey = new Set(this.snapshot.moveTargets.map((position) => `${position.x},${position.y}`));
    const enemyKey = new Set(this.snapshot.highlightedEnemyIds);
    const threatened = new Set(
      this.snapshot.combat.enemies.flatMap((enemy) =>
        enemy.intent?.threatenedTiles.map((tile) => `${tile.x},${tile.y}`) ?? []
      )
    );

    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        const tile = this.snapshot.combat.tiles.find(
          (entry) => entry.position.x === x && entry.position.y === y
        );
        const key = `${x},${y}`;
        const centerX = offsetX + x * size + size / 2;
        const centerY = offsetY + y * size + size / 2;
        let fill = 0x0d1520;
        let alpha = 1;

        if (tile?.kind === "wall") {
          fill = 0x13222d;
        } else if (tile?.kind === "hazard") {
          fill = 0x3a1423;
        } else if (tile?.kind === "console") {
          fill = 0x182f35;
        }

        if (moveKey.has(key)) {
          fill = 0x11384b;
        }

        const rect = this.add.rectangle(centerX, centerY, size - 4, size - 4, fill, alpha);
        rect.setStrokeStyle(1, threatened.has(key) ? 0xff5d8f : 0x274151, threatened.has(key) ? 0.8 : 0.5);
        rect.setInteractive({ cursor: "pointer" });
        rect.on("pointerdown", () => {
          this.onTileClick?.({ x, y });
        });

        if (tile?.kind === "console") {
          this.add.text(centerX, centerY, "C", {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#2cf4ff"
          }).setOrigin(0.5);
        }

        if (tile?.kind === "hazard") {
          this.add.text(centerX, centerY, "^", {
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#ff5d8f"
          }).setOrigin(0.5);
        }

        const corpse = this.snapshot.combat.corpses.find(
          (entry) => entry.position.x === x && entry.position.y === y
        );

        if (corpse) {
          const corpseRect = this.add.rectangle(centerX, centerY, size - 18, size - 18, corpse.hazardous ? 0xff7c5e : 0x8290a3, 0.65);
          corpseRect.setStrokeStyle(1, corpse.hazardous ? 0xffd26e : 0xb7c4d5, 0.7);
        }

        const shard = this.snapshot.combat.shards.find(
          (entry) => entry.position.x === x && entry.position.y === y
        );

        if (shard) {
          this.add.star(centerX, centerY, 4, 4, 10, 0xafff58, 1).setStrokeStyle(1, 0xf5ffc4, 0.85);
        }
      }
    }

    const player = this.snapshot.combat.player;
    if (player.alive) {
      const playerX = offsetX + player.position.x * size + size / 2;
      const playerY = offsetY + player.position.y * size + size / 2;
      this.add.rectangle(playerX, playerY, size - 16, size - 16, 0x2cf4ff, 0.9).setStrokeStyle(2, 0xf3ffff, 0.9);
      this.add.text(playerX, playerY - 4, "패", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#041018"
      }).setOrigin(0.5);
      this.add.text(playerX, playerY + 16, `${player.hp}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#e6fbff"
      }).setOrigin(0.5);
    }

    this.snapshot.combat.enemies
      .filter((enemy) => enemy.alive)
      .forEach((enemy) => {
        const enemyX = offsetX + enemy.position.x * size + size / 2;
        const enemyY = offsetY + enemy.position.y * size + size / 2;
        const color = Number.parseInt(ENEMY_MAP[enemy.templateId]?.color.replace("#", ""), 16) || 0xff5d8f;
        const circle = this.add.circle(enemyX, enemyY, size / 2 - 9, color, 0.88);
        circle.setStrokeStyle(2, enemyKey.has(enemy.id) || enemy.theftMarked ? 0xf5ff6b : 0x101822, enemyKey.has(enemy.id) || enemy.theftMarked ? 0.95 : 0.7);
        circle.setInteractive({ cursor: "pointer" });
        circle.on("pointerdown", () => {
          this.onUnitClick?.(enemy.id);
        });

        this.add.text(enemyX, enemyY - 4, enemy.koreanName.slice(0, 1), {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#02060a"
        }).setOrigin(0.5);

        this.add.text(enemyX, enemyY + 16, `${enemy.hp}`, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#eefbff"
        }).setOrigin(0.5);

        if (enemy.theftMarked) {
          this.add.text(enemyX + 18, enemyY - 20, "◎", {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#f5ff6b"
          }).setOrigin(0.5);
        }

        if (enemy.intent) {
          this.add.text(enemyX, enemyY - 30, enemy.intent.label, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#ffe6f1",
            backgroundColor: "#0d1520"
          }).setOrigin(0.5);
        }
      });

    const overlay = this.add.rectangle(offsetX + boardSize / 2, offsetY + boardSize / 2, boardSize, boardSize, 0xffffff, 0);
    overlay.setStrokeStyle(1, 0x00ffbf, 0.08);
  }
}

export default function CombatBoard({
  combat,
  mode,
  moveTargets,
  highlightedEnemyIds,
  onTileClick,
  onUnitClick
}: CombatBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<RuleThiefBoardScene | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    const scene = new RuleThiefBoardScene();
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 540,
      height: 540,
      transparent: true,
      backgroundColor: "#081018",
      scene,
      render: {
        antialias: true,
        pixelArt: false
      }
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

    scene.setHandlers(onTileClick, onUnitClick);
    scene.setSnapshot({
      combat,
      mode,
      moveTargets,
      highlightedEnemyIds
    });
  }, [combat, highlightedEnemyIds, mode, moveTargets, onTileClick, onUnitClick]);

  return <div className="combat-board-canvas" ref={containerRef} />;
}
