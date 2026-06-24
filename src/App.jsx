import { useEffect, useMemo, useRef, useState } from 'react';
import { PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';

const MINIMAP_CANVAS_SIZE = 240;

function toCssHex (value)
{
    const safe = Number.isFinite(value) ? value : 0xffffff;
    return `#${safe.toString(16).padStart(6, '0')}`;
}

function formatTimer (elapsedMs)
{
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function App ()
{
    const phaserRef = useRef();
    const minimapCanvasRef = useRef(null);
    const [activeSceneKey, setActiveSceneKey] = useState('');
    const [isMobileViewport, setIsMobileViewport] = useState(() => {
        if (typeof window === 'undefined')
        {
            return false;
        }

        return window.innerWidth <= 1180;
    });
    const [hudCollapsed, setHudCollapsed] = useState(() => {
        if (typeof window === 'undefined')
        {
            return false;
        }

        return window.innerWidth <= 1180;
    });
    const [minimapCollapsed, setMinimapCollapsed] = useState(() => {
        if (typeof window === 'undefined')
        {
            return false;
        }

        return window.innerWidth <= 1180;
    });
    const [hud, setHud] = useState({
        playerName: 'Joueur',
        score: 0,
        aliveCount: 0,
        totalSnakes: 10,
        viewMode: 'single',
        cameraTargets: { left: 'Aucun', right: 'Aucun' },
        cameraFrames: [],
        localPlayers: [],
        elapsedTimeMs: 0,
        world: { width: 1, height: 1 },
        oranges: [],
        poisonProjectiles: [],
        snakes: []
    });

    const currentScene = (scene) => {
        setActiveSceneKey(scene.scene.key);

        if (scene.scene.key !== 'Game')
        {
            setHud((previous) => ({
                ...previous,
                score: 0,
                aliveCount: 0,
                viewMode: 'single',
                cameraTargets: { left: 'Aucun', right: 'Aucun' },
                cameraFrames: [],
                localPlayers: [],
                elapsedTimeMs: 0,
                oranges: [],
                poisonProjectiles: [],
                snakes: []
            }));
        }
    };

    useEffect(() => {
        const onHudUpdate = (nextHud) => {
            setHud(nextHud);
        };

        EventBus.on('game-hud-update', onHudUpdate);

        return () => {
            EventBus.off('game-hud-update', onHudUpdate);
        };
    }, []);

    useEffect(() => {
        const onResize = () => {
            const mobile = window.innerWidth <= 1180;
            setIsMobileViewport(mobile);

            if (!mobile)
            {
                setHudCollapsed(false);
                setMinimapCollapsed(false);
            }
        };

        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, []);

    useEffect(() => {
        const canvas = minimapCanvasRef.current;

        if (!canvas)
        {
            return;
        }

        const ctx = canvas.getContext('2d');
        const size = MINIMAP_CANVAS_SIZE;

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#07131e';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

        if (!hud.world || !hud.world.width || !hud.world.height)
        {
            return;
        }

        const sx = size / hud.world.width;
        const sy = size / hud.world.height;

        ctx.fillStyle = '#ff8c00';
        for (const orange of hud.oranges)
        {
            ctx.beginPath();
            ctx.arc(orange.x * sx, orange.y * sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#a945ff';
        for (const projectile of (hud.poisonProjectiles || []))
        {
            ctx.beginPath();
            ctx.arc(projectile.x * sx, projectile.y * sy, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const snake of hud.snakes)
        {
            const color = snake.isPlayer ? toCssHex(snake.color) : '#ffffff';

            if (snake.segments.length > 0)
            {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = snake.isPlayer ? 2.2 : 1.8;
                ctx.moveTo(snake.head.x * sx, snake.head.y * sy);

                for (const segment of snake.segments)
                {
                    ctx.lineTo(segment.x * sx, segment.y * sy);
                }

                ctx.stroke();
            }

            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(snake.head.x * sx, snake.head.y * sy, snake.isPlayer ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [hud]);

    const timerText = useMemo(() => formatTimer(hud.elapsedTimeMs || 0), [hud.elapsedTimeMs]);
    const localPlayersText = useMemo(() => {
        if (!Array.isArray(hud.localPlayers) || hud.localPlayers.length === 0)
        {
            return 'Aucun';
        }

        return hud.localPlayers
            .map((player) => `${player.name} [${player.inputProfile}] (${player.score})${player.alive ? '' : ' x'}`)
            .join(' | ');
    }, [hud.localPlayers]);

    const hudStats = (
        <>
            <div className="hudLine"><span>Scene:</span><strong>{activeSceneKey || 'Chargement'}</strong></div>
            <div className="hudLine"><span>Joueur:</span><strong>{hud.playerName}</strong></div>
            <div className="hudLine"><span>Score:</span><strong>{hud.score}</strong></div>
            <div className="hudLine"><span>Locaux:</span><strong>{localPlayersText}</strong></div>
            <div className="hudLine"><span>Vue:</span><strong>{hud.viewMode === 'split' ? 'Split-screen' : 'Unique'}</strong></div>
            <div className="hudLine"><span>Cam gauche:</span><strong>{hud.cameraTargets?.left || 'Aucun'}</strong></div>
            <div className="hudLine"><span>Cam droite:</span><strong>{hud.cameraTargets?.right || 'Aucun'}</strong></div>
            <div className="hudLine"><span>Serpents vivants:</span><strong>{hud.aliveCount}/{hud.totalSnakes}</strong></div>
            <div className="hudLine"><span>Timer:</span><strong>{timerText}</strong></div>
        </>
    );

    const minimapContent = (
        <div className="minimapWrap">
            <div className="minimapLabel">Mini-map</div>
            <canvas
                ref={minimapCanvasRef}
                width={MINIMAP_CANVAS_SIZE}
                height={MINIMAP_CANVAS_SIZE}
                className="minimapCanvas"
            />
        </div>
    );

    return (
        <div id="app">
            {!isMobileViewport && (
                <aside className="hudPanel">
                    <div className="hudHeader">
                        <h2 className="hudTitle">Basilics - Tableau de bord</h2>
                    </div>

                    <div className="hudPanelBody">
                        {hudStats}
                        {minimapContent}
                    </div>
                </aside>
            )}

            <div className="gameArea">
                {isMobileViewport && (
                    <div className="mobileHudControls">
                        <button
                            type="button"
                            className="hudToggle"
                            onClick={() => setHudCollapsed((previous) => !previous)}
                            aria-expanded={!hudCollapsed}
                            aria-label={hudCollapsed ? 'Afficher le tableau de bord' : 'Masquer le tableau de bord'}
                        >
                            {hudCollapsed ? 'HUD' : 'Fermer HUD'}
                        </button>
                        <button
                            type="button"
                            className="hudToggle"
                            onClick={() => setMinimapCollapsed((previous) => !previous)}
                            aria-expanded={!minimapCollapsed}
                            aria-label={minimapCollapsed ? 'Afficher la mini-map' : 'Masquer la mini-map'}
                        >
                            {minimapCollapsed ? 'Map' : 'Fermer map'}
                        </button>
                    </div>
                )}

                {isMobileViewport && !hudCollapsed && (
                    <aside className="mobileHudPanel">
                        <div className="hudHeader">
                            <h2 className="hudTitle">Tableau de bord</h2>
                        </div>

                        <div className="hudPanelBody">
                            {hudStats}
                        </div>
                    </aside>
                )}

                {isMobileViewport && !minimapCollapsed && (
                    <div className="mobileMinimapPanel">
                        {minimapContent}
                    </div>
                )}

                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                {Array.isArray(hud.cameraFrames) && hud.cameraFrames.length > 1 && hud.cameraFrames.map((frame, index) => (
                    <div
                        key={`frame-${index}`}
                        className="splitBorder"
                        title={frame.playerName || 'Aucun'}
                        style={{
                            left: `${(frame.x / 1024) * 100}%`,
                            top: `${(frame.y / 768) * 100}%`,
                            width: `${(frame.width / 1024) * 100}%`,
                            height: `${(frame.height / 768) * 100}%`,
                            borderColor: toCssHex(frame.color)
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
