/**
 * GameSimulation.js — Pure game simulation core (no Phaser dependency).
 *
 * Exports:
 *   - GAME_CONSTANTS                : configuration constants
 *   - generateSnakeColors(count)    : color palette helper
 *   - buildRoster(setup)            : build normalized snake roster from a setup object
 *   - createUniformSpawnPoints(n)   : evenly distributed spawn points around center
 *   - createGameState(setup)        : build a full initial game state (plain objects)
 *   - stepGame(state, dt, now, inputDirections) : advance one tick; returns {events}
 *
 * State shape (GameState):
 *   {
 *     config: GameConfig,
 *     snakes: Snake[],
 *     oranges: Orange[],
 *     isGameOver: boolean,
 *     winnerName: string|null,
 *     finalScore: number,
 *     elapsedTimeMs: number,
 *     _nextOrangeId: number
 *   }
 *
 * Snake shape:
 *   { id, name, type, isPlayer, isLocalHuman, inputProfile, power, color, alive,
 *     score, x, y, direction:{x,y}, segments:[{x,y}],
 *     turnCooldown, botLevel, lizardBoostUntil, lizardCooldownUntil,
 *     basilicBoostUntil, basilicCooldownUntil,
 *     livesRemaining, maxLives,
 *     pendingLizardRestoreSegments, pendingLizardRestoreAt, history:[{x,y}] }
 *
 * Orange shape: { id, x, y }
 *
 * Events returned by stepGame:
 *   { type: 'score_popup',    x, y, label, color }
 *   { type: 'impact_flash',   x, y, major: bool }
 *   { type: 'orange_spawned', id, x, y }
 *   { type: 'orange_removed', id }
 *   { type: 'snake_died',     snakeId, spawnOranges: bool }
 *   { type: 'lezard_boost',   snakeId }
 *   { type: 'lezard_restored',snakeId, added: number }
 *   { type: 'game_over',      reason, winnerName, score }
 *
 * inputDirections: Map<snakeId, {x, y}> — desired direction per player this tick.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GAME_CONSTANTS = {
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 4000,
    INITIAL_SCORE: 0,
    INITIAL_SIZE: 4,
    INITIAL_SPAWN_GROWTH: 3,
    SELF_COLLISION_NON_LETHAL_SEGMENTS: 3,
    TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS: 5,
    TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS_AFTER_SPAWN: 1,
    TORTUE_SEGMENT_SPACING_MULTIPLIER: 1.5,
    TORTUE_HEAD_GAP_SEGMENTS: 1.5,
    TORTUE_SELF_COLLISION_GRACE_MS: 1200,
    SNAKE_SPEED: 165,
    DEFAULT_SEGMENT_SPACING: 3,
    HEAD_RADIUS: 10,
    HEAD_TO_HEAD_DISTANCE: 18,   // (HEAD_RADIUS * 2) - 2
    HEAD_TO_BODY_DISTANCE: 18,
    ORANGE_COUNT: 100,
    DEFAULT_TOTAL_SNAKES: 10,
    DEFAULT_BOT_LEVEL: 4,
    BOT_VISION_UNIT: 200,
    BOT_LOOK_AHEAD: 110,
    BOT_TRAP_STEP: 80,
    DEFAULT_BOT_DANGER_THRESHOLD: 640,
    BOT_DANGER_THRESHOLD_MIN: 300,
    BOT_DANGER_THRESHOLD_MAX: 1100,
    DEFAULT_BOT_AGGRESSIVITY_ACTIVE_LEVEL: 6,
    DEFAULT_LIZARD_BOOST_MULTIPLIER: 2,
    DEFAULT_LIZARD_BOOST_DURATION_SEC: 3,
    DEFAULT_LIZARD_COOLDOWN_SEC: 50,
    DEFAULT_BASILIC_BOOST_MULTIPLIER: 2,
    DEFAULT_BASILIC_BOOST_DURATION_SEC: 2,
    DEFAULT_BASILIC_COOLDOWN_SEC: 30,
    DEFAULT_CAMELEON_INVISIBILITY_DURATION_SEC: 10,
    DEFAULT_CAMELEON_COOLDOWN_SEC: 40,
    DEFAULT_CRACHEUR_SHOT_DISTANCE: 500,
    DEFAULT_CRACHEUR_COOLDOWN_SEC: 45,
    DEFAULT_CRACHEUR_PARALYSIS_DURATION_SEC: 5,
    DEFAULT_MAMBA_BOOST_MULTIPLIER: 2,
    DEFAULT_MAMBA_BOOST_DURATION_SEC: 0.2,
    DEFAULT_WORM_VIRUS_COOLDOWN_SEC: 35,
    DEFAULT_WORM_VIRUS_CAMERA_MOVE_SPEED: 520,
    WORM_VIRUS_TARGETING_DURATION_MS: 5000,
    WORM_VIRUS_ARRIVAL_STEP_MS: 80,
    CRACHEUR_PROJECTILE_SPEED: 620,
    CRACHEUR_PROJECTILE_RADIUS: 5,
    LEURRE_VISUAL_MAX_SIZE: 6,
    DEFAULT_BOA_GROWTH_MULTIPLIER: 2,
    DEFAULT_BOA_SLOW_TARGET_SPEED_MULTIPLIER: 0.8,
    DEFAULT_BOA_SELF_SLOW_SPEED_MULTIPLIER: 0.5,
    DEFAULT_ASPIRATEUR_RADIUS: 80,
    TIME_VICTORY_BONUS_MAX: 500,
    TIME_VICTORY_BONUS_WINDOW_MS: 5 * 60 * 1000,
    PHOENIX_LIVES: 3,
    DEFAULT_PHOENIX_RESPAWN_SCORE_PENALTY: 10,
    PHOENIX_RESPAWN_BONUS_GROWTH: 5,
    PHOENIX_RESPAWN_GROWTH_STEP_MS: 90,
    PHOENIX_RESPAWN_DELAY_MS: 5000,
    KILL_BONUS_THRESHOLD: 8,
    KILL_BONUS_LARGE_SCORE: 25,
    KILL_BONUS_SMALL_SCORE: 10,
    CRASH_KILL_BONUS_SCORE: 5,
    DIABLE_CORNU_SCORE_BONUS: 3,
    SANS_SCORE_MULTIPLIER: 2,
    PLACEMENT_BONUS_1ST: 100,
    PLACEMENT_BONUS_2ND: 50,
    PLACEMENT_BONUS_3RD: 25,
    TORTUE_SPEED_MULTIPLIER: 0.4,
    DIABLE_CORNU_DAMAGE: 4
};

const {
    WORLD_WIDTH, WORLD_HEIGHT, INITIAL_SCORE, INITIAL_SPAWN_GROWTH, SELF_COLLISION_NON_LETHAL_SEGMENTS, TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS, TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS_AFTER_SPAWN, TORTUE_SEGMENT_SPACING_MULTIPLIER, TORTUE_HEAD_GAP_SEGMENTS, TORTUE_SELF_COLLISION_GRACE_MS, SNAKE_SPEED,
    DEFAULT_SEGMENT_SPACING, HEAD_RADIUS, HEAD_TO_HEAD_DISTANCE,
    HEAD_TO_BODY_DISTANCE, ORANGE_COUNT, DEFAULT_TOTAL_SNAKES,
    DEFAULT_BOT_LEVEL, BOT_VISION_UNIT, BOT_LOOK_AHEAD, BOT_TRAP_STEP,
    DEFAULT_BOT_DANGER_THRESHOLD, BOT_DANGER_THRESHOLD_MIN,
    BOT_DANGER_THRESHOLD_MAX, DEFAULT_BOT_AGGRESSIVITY_ACTIVE_LEVEL,
    DEFAULT_LIZARD_BOOST_MULTIPLIER, DEFAULT_LIZARD_BOOST_DURATION_SEC,
    DEFAULT_LIZARD_COOLDOWN_SEC, DEFAULT_BASILIC_BOOST_MULTIPLIER,
    DEFAULT_BASILIC_BOOST_DURATION_SEC, DEFAULT_BASILIC_COOLDOWN_SEC,
    DEFAULT_CAMELEON_INVISIBILITY_DURATION_SEC, DEFAULT_CAMELEON_COOLDOWN_SEC,
    DEFAULT_CRACHEUR_SHOT_DISTANCE, DEFAULT_CRACHEUR_COOLDOWN_SEC,
    DEFAULT_CRACHEUR_PARALYSIS_DURATION_SEC, DEFAULT_MAMBA_BOOST_MULTIPLIER,
    DEFAULT_MAMBA_BOOST_DURATION_SEC, DEFAULT_WORM_VIRUS_COOLDOWN_SEC,
    DEFAULT_WORM_VIRUS_CAMERA_MOVE_SPEED, WORM_VIRUS_TARGETING_DURATION_MS,
    WORM_VIRUS_ARRIVAL_STEP_MS, CRACHEUR_PROJECTILE_SPEED, CRACHEUR_PROJECTILE_RADIUS,
    LEURRE_VISUAL_MAX_SIZE, DEFAULT_BOA_GROWTH_MULTIPLIER,
    DEFAULT_BOA_SLOW_TARGET_SPEED_MULTIPLIER, DEFAULT_BOA_SELF_SLOW_SPEED_MULTIPLIER,
    DEFAULT_ASPIRATEUR_RADIUS, TIME_VICTORY_BONUS_MAX, TIME_VICTORY_BONUS_WINDOW_MS,
    PHOENIX_LIVES, DEFAULT_PHOENIX_RESPAWN_SCORE_PENALTY, PHOENIX_RESPAWN_BONUS_GROWTH,
    PHOENIX_RESPAWN_GROWTH_STEP_MS, PHOENIX_RESPAWN_DELAY_MS,
    KILL_BONUS_THRESHOLD, KILL_BONUS_LARGE_SCORE, KILL_BONUS_SMALL_SCORE,
    CRASH_KILL_BONUS_SCORE, DIABLE_CORNU_SCORE_BONUS, SANS_SCORE_MULTIPLIER,
    PLACEMENT_BONUS_1ST, PLACEMENT_BONUS_2ND, PLACEMENT_BONUS_3RD, TORTUE_SPEED_MULTIPLIER,
    DIABLE_CORNU_DAMAGE, INITIAL_SIZE
} = GAME_CONSTANTS;

const DEFAULT_PLAYER_COLORS = [0x2f6bff, 0x7dff7a, 0xff47d7, 0xffe45a];

const DIRECTIONS = [
    { x: 1,  y: 0  },
    { x: -1, y: 0  },
    { x: 0,  y: 1  },
    { x: 0,  y: -1 }
];

// ---------------------------------------------------------------------------
// Utility helpers (pure)
// ---------------------------------------------------------------------------

function clamp (value, min, max)
{
    return Math.max(min, Math.min(max, value));
}

function distanceBetween (ax, ay, bx, by)
{
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
}

function distancePointToSegment (px, py, ax, ay, bx, by)
{
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const abLenSq = abx * abx + aby * aby;

    if (abLenSq <= 0.0001)
    {
        return Math.hypot(px - ax, py - ay);
    }

    const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function randomBetween (min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomInWorld (padding, dimension)
{
    return randomBetween(padding, dimension - padding);
}

function getSnakeSize (snake)
{
    return Number.isFinite(snake?.size)
        ? Math.max(1, Math.floor(snake.size))
        : Math.max(1, (snake?.segments?.length || 0) + 1);
}

function addScore (snake, amount, config)
{
    const baseAmount = Math.max(0, Math.floor(amount));
    if (baseAmount <= 0)
    {
        return;
    }

    const multiplier = snake.power === 'sans' ? (config?.sansScoreMultiplier || SANS_SCORE_MULTIPLIER) : 1;
    snake.score += baseAmount * multiplier;
}

function changeSize (snake, delta)
{
    snake.size = Math.max(0, getSnakeSize(snake) + Math.floor(delta));
}

function triggerMambaBoost (snake, now, config)
{
    if (!snake?.alive || snake.power !== 'mamba')
    {
        return;
    }

    snake.mambaBoostUntil = Math.max(
        snake.mambaBoostUntil || 0,
        now + (config.mambaBoostDurationSec * 1000)
    );
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

export function generateSnakeColors (count)
{
    const colors = [];

    for (let i = 0; i < count; i++)
    {
        const hue = (i * 360 / count) % 360;
        const s = 0.90;
        const l = 0.52;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (hue < 60)        { r = c; g = x; b = 0; }
        else if (hue < 120)  { r = x; g = c; b = 0; }
        else if (hue < 180)  { r = 0; g = c; b = x; }
        else if (hue < 240)  { r = 0; g = x; b = c; }
        else if (hue < 300)  { r = x; g = 0; b = c; }
        else                 { r = c; g = 0; b = x; }

        colors.push(
            (Math.round((r + m) * 255) << 16) |
            (Math.round((g + m) * 255) << 8)  |
             Math.round((b + m) * 255)
        );
    }

    for (let i = 0; i < DEFAULT_PLAYER_COLORS.length && i < colors.length; i++)
    {
        colors[i] = DEFAULT_PLAYER_COLORS[i];
    }

    return colors;
}

const SNAKE_COLORS = generateSnakeColors(100);

// ---------------------------------------------------------------------------
// Spawn points
// ---------------------------------------------------------------------------

export function createUniformSpawnPoints (count)
{
    const points = [];
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;
    const radius = Math.min(WORLD_WIDTH, WORLD_HEIGHT) * 0.35;

    for (let i = 0; i < count; i++)
    {
        const angle = (Math.PI * 2 * i) / count;
        points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            directionIndex: i % DIRECTIONS.length
        });
    }

    return points;
}

// ---------------------------------------------------------------------------
// Roster builder
// ---------------------------------------------------------------------------

export function buildRoster (setup)
{
    const maxSnakes = Number.isFinite(setup?.maxSnakes)
        ? Math.max(1, Math.floor(setup.maxSnakes))
        : DEFAULT_TOTAL_SNAKES;

    const humans = Array.isArray(setup?.humanPlayers) && setup.humanPlayers.length > 0
        ? setup.humanPlayers
        : [{
            id: 'player-1',
            name: setup?.playerName || 'Joueur',
            snakeColorIndex: Number.isFinite(setup?.playerSnakeIndex) ? setup.playerSnakeIndex : 0,
            input: 'keyboard-zqsd',
            isLocal: true
        }];

    const botLevelMap = {};
    const configuredBotLevels = setup?.botSettings?.levelsBySnake || setup?.botLevels || [];

    for (const entry of configuredBotLevels)
    {
        botLevelMap[entry.snakeIndex] = entry.level;
    }

    const defaultBotLevel = Number.isFinite(setup?.botSettings?.extraBotDefaultLevel)
        ? clamp(Math.floor(setup.botSettings.extraBotDefaultLevel), 1, 10)
        : (Number.isFinite(setup?.botSettings?.defaultLevel)
            ? clamp(Math.floor(setup.botSettings.defaultLevel), 1, 10)
            : DEFAULT_BOT_LEVEL);

    const roster = [];

    const normalizedHumans = humans.map((player, index) =>
    {
        const snakeIndex = clamp(
            Number.isFinite(player?.playerSlot) ? Math.floor(player.playerSlot) : index,
            0,
            maxSnakes - 1
        );
        const snakeColorIndex = Number.isFinite(player?.snakeColorIndex)
            ? Math.max(0, Math.floor(player.snakeColorIndex))
            : index;

        return {
            id: player?.id || `player-${index + 1}`,
            name: player?.name || `Joueur ${index + 1}`,
            input: player?.input || 'keyboard-arrows',
            power: player?.power || 'sans',
            isLocal: player?.isLocal !== false,
            isPlayerControlled: player?.isPlayerControlled !== false,
            snakeIndex,
            snakeColorIndex,
            playerSlot: Number.isFinite(player?.playerSlot) ? Math.max(0, Math.floor(player.playerSlot)) : index
        };
    });

    for (const human of normalizedHumans)
    {
        roster[human.snakeIndex] = {
            id: human.id,
            name: human.name,
            type: 'human',
            isPlayer: human.isPlayerControlled,
            isLocalHuman: human.isLocal,
            inputProfile: human.input,
            power: human.power,
            playerSlot: human.playerSlot,
            colorIndex: human.snakeColorIndex,
            botLevel: null
        };
    }

    for (let i = 0; i < maxSnakes; i++)
    {
        if (roster[i])
        {
            continue;
        }

        roster[i] = {
            id: `bot-${i + 1}`,
            name: `Bot ${i + 1}`,
            type: 'bot',
            isPlayer: false,
            isLocalHuman: false,
            inputProfile: null,
            power: 'anguille',
            playerSlot: Number.MAX_SAFE_INTEGER,
            colorIndex: i,
            botLevel: botLevelMap[i] !== undefined ? botLevelMap[i] : defaultBotLevel
        };
    }

    return roster;
}

// ---------------------------------------------------------------------------
// Initial snake state (data only — no display objects)
// ---------------------------------------------------------------------------

function getEffectiveSegmentSpacing (snakePower, segmentSpacing, tortueSegmentSpacingMultiplier)
{
    return snakePower === 'tortue'
        ? Math.max(1, Math.floor(segmentSpacing * tortueSegmentSpacingMultiplier))
        : segmentSpacing;
}

function getHeadGapSegments (snakePower, tortueHeadGapSegments)
{
    return snakePower === 'tortue' ? tortueHeadGapSegments : 0;
}

function getTargetHistoryLength (snakeSize, snakePower, segmentSpacing, tortueSegmentSpacingMultiplier, tortueHeadGapSegments)
{
    const spacing = getEffectiveSegmentSpacing(snakePower, segmentSpacing, tortueSegmentSpacingMultiplier);
    const headGap = getHeadGapSegments(snakePower, tortueHeadGapSegments);
    return Math.max(250, Math.ceil((snakeSize + 10 + headGap) * spacing));
}

function createInitialHistory (spawnX, spawnY, direction, segmentSpacing, snakePower = 'sans', tortueSegmentSpacingMultiplier = TORTUE_SEGMENT_SPACING_MULTIPLIER, tortueHeadGapSegments = TORTUE_HEAD_GAP_SEGMENTS)
{
    const spacing = getEffectiveSegmentSpacing(snakePower, segmentSpacing, tortueSegmentSpacingMultiplier);
    const headGap = getHeadGapSegments(snakePower, tortueHeadGapSegments);
    const historyLength = Math.max(250, Math.ceil((INITIAL_SIZE + 20 + headGap) * spacing));
    const history = [];

    for (let i = 0; i < historyLength; i++)
    {
        history.push({
            // Keep initial history spacing consistent with segment spacing
            // to avoid immediate self-collision on early growth ticks.
            x: spawnX - direction.x * i * spacing,
            y: spawnY - direction.y * i * spacing
        });
    }

    return history;
}

function createSnakeState (rosterEntry, spawn, segmentSpacing, config)
{
    const color = SNAKE_COLORS[rosterEntry.colorIndex % SNAKE_COLORS.length];
    const direction = { ...DIRECTIONS[spawn.directionIndex % DIRECTIONS.length] };
    const power = rosterEntry.power || 'sans';
    const history = createInitialHistory(spawn.x, spawn.y, direction, segmentSpacing, power);
    const segments = [];
    const initialSize = Number.isFinite(config?.initialSize) ? Math.max(1, Math.floor(config.initialSize)) : INITIAL_SIZE;

    for (let i = 1; i < initialSize; i++)
    {
        segments.push({
            x: spawn.x - (direction.x * segmentSpacing * i),
            y: spawn.y - (direction.y * segmentSpacing * i)
        });
    }

    return {
        id: rosterEntry.id,
        name: rosterEntry.name,
        type: rosterEntry.type,
        isPlayer: rosterEntry.isPlayer,
        isLocalHuman: rosterEntry.isLocalHuman,
        inputProfile: rosterEntry.inputProfile,
        power,
        playerSlot: Number.isFinite(rosterEntry.playerSlot) ? rosterEntry.playerSlot : Number.MAX_SAFE_INTEGER,
        botLevel: rosterEntry.botLevel,
        color,
        alive: true,
        score: Number.isFinite(config?.initialScore) ? Math.max(0, Math.floor(config.initialScore)) : INITIAL_SCORE,
        size: initialSize,
        segmentShape: rosterEntry.power === 'tortue' ? 'square' : (rosterEntry.power === 'diable_cornu' ? 'triangle' : 'circle'),
        x: spawn.x,
        y: spawn.y,
        direction,
        segments,
        turnCooldown: 0,
        lizardBoostUntil: 0,
        lizardCooldownUntil: 0,
        basilicBoostUntil: 0,
        basilicCooldownUntil: 0,
        cameleonInvisibleUntil: 0,
        cameleonCooldownUntil: 0,
        cracheurCooldownUntil: 0,
        paralyzedUntil: 0,
        mambaBoostUntil: 0,
        sphinxVisualSizeBonus: power === 'sphinx' ? Math.max(0, initialSize - 1) : 0,
        boaSlowedByEnemy: false,
        boaSelfEntangled: false,
        boaOnEnemyBody: false,
        wormVirusCooldownUntil: 0,
        wormVirusTargetingUntil: 0,
        wormVirusTeleportPending: false,
        wormVirusStoredSize: 0,
        wormVirusArrivalSegmentsRemaining: 0,
        wormVirusArrivalNextAt: 0,
        wormVirusTargetX: spawn.x,
        wormVirusTargetY: spawn.y,
        livesRemaining: rosterEntry.power === 'phoenix' ? PHOENIX_LIVES : 1,
        maxLives: rosterEntry.power === 'phoenix' ? PHOENIX_LIVES : 1,
        phoenixRespawnPending: false,
        phoenixRespawnAtMs: 0,
        phoenixRespawnX: 0,
        phoenixRespawnY: 0,
        phoenixRespawnDirection: null,
        phoenixArrivalGrowthRemaining: INITIAL_SPAWN_GROWTH,
        phoenixArrivalGrowthNextAt: PHOENIX_RESPAWN_GROWTH_STEP_MS,
        selfCollisionGraceRemainingMs: (rosterEntry.power === 'tortue') ? TORTUE_SELF_COLLISION_GRACE_MS : 0,
        pendingLizardRestoreSegments: 0,
        pendingLizardRestoreAt: 0,
        history
    };
}

// ---------------------------------------------------------------------------
// Game state factory
// ---------------------------------------------------------------------------

export function createGameState (setup)
{
        const gameplay = setup?.gameplay || {};
    const botSettings = setup?.botSettings || {};

    const config = {
        maxSnakes: Number.isFinite(setup?.maxSnakes) ? Math.max(1, Math.floor(setup.maxSnakes)) : DEFAULT_TOTAL_SNAKES,
        segmentSpacing: Number.isFinite(gameplay.segmentSpacing)
            ? Math.max(1, Math.floor(gameplay.segmentSpacing))
            : (Number.isFinite(setup?.espacement) ? Math.max(1, Math.floor(setup.espacement)) : DEFAULT_SEGMENT_SPACING),
        botTurnDelayMs: Number.isFinite(gameplay.botTurnDelayMs)
            ? clamp(Math.floor(gameplay.botTurnDelayMs), 50, 1000)
            : (Number.isFinite(botSettings.turnDelayMs)
                ? clamp(Math.floor(botSettings.turnDelayMs), 50, 1000)
                : 250),
        botVisionUnit: Number.isFinite(gameplay.botVisionUnit)
            ? clamp(Math.floor(gameplay.botVisionUnit), 50, 800)
            : (Number.isFinite(botSettings.visionUnit)
                ? clamp(Math.floor(botSettings.visionUnit), 50, 800)
                : BOT_VISION_UNIT),
        botLookAhead: Number.isFinite(gameplay.botLookAhead)
            ? clamp(Math.floor(gameplay.botLookAhead), 20, 400)
            : (Number.isFinite(botSettings.lookAhead)
                ? clamp(Math.floor(botSettings.lookAhead), 20, 400)
                : BOT_LOOK_AHEAD),
        botTrapStep: Number.isFinite(gameplay.botTrapStep)
            ? clamp(Math.floor(gameplay.botTrapStep), 20, 300)
            : (Number.isFinite(botSettings.trapStep)
                ? clamp(Math.floor(botSettings.trapStep), 20, 300)
                : BOT_TRAP_STEP),
        botUseDanger: Number.isFinite(gameplay.botUseDanger)
            ? clamp(Math.floor(gameplay.botUseDanger), 0, 1)
            : (Number.isFinite(botSettings.useDanger)
                ? clamp(Math.floor(botSettings.useDanger), 0, 1)
                : 1),
        botDangerThreshold: Number.isFinite(botSettings.dangerThreshold)
            ? clamp(Math.floor(botSettings.dangerThreshold), BOT_DANGER_THRESHOLD_MIN, BOT_DANGER_THRESHOLD_MAX)
            : (Number.isFinite(gameplay.botDangerThreshold)
                ? clamp(Math.floor(gameplay.botDangerThreshold), BOT_DANGER_THRESHOLD_MIN, BOT_DANGER_THRESHOLD_MAX)
                : (Number.isFinite(setup?.seuilDanger)
                    ? clamp(Math.floor(setup.seuilDanger), BOT_DANGER_THRESHOLD_MIN, BOT_DANGER_THRESHOLD_MAX)
                    : DEFAULT_BOT_DANGER_THRESHOLD)),
        botAggressivityActiveLevel: Number.isFinite(botSettings.aggressivityActiveLevel)
            ? clamp(Math.floor(botSettings.aggressivityActiveLevel), 1, 11)
            : (Number.isFinite(gameplay.botAggressivityActiveLevel)
                ? clamp(Math.floor(gameplay.botAggressivityActiveLevel), 1, 11)
                : (Number.isFinite(setup?.['agressivité_active_niveau'])
                    ? clamp(Math.floor(setup['agressivité_active_niveau']), 1, 11)
                    : DEFAULT_BOT_AGGRESSIVITY_ACTIVE_LEVEL)),
        botClosePreyDistance: Number.isFinite(botSettings.closePreyDistance)
            ? clamp(Math.floor(botSettings.closePreyDistance), 100, 600)
            : (Number.isFinite(gameplay.botClosePreyDistance)
                ? clamp(Math.floor(gameplay.botClosePreyDistance), 100, 600)
                : 300),
        botHuntFerocity: Number.isFinite(botSettings.huntFerocity)
            ? clamp(Number(botSettings.huntFerocity), 0, 3)
            : (Number.isFinite(gameplay.botHuntFerocity)
                ? clamp(Number(gameplay.botHuntFerocity), 0, 3)
                : 1),
        lizardBoostMultiplier: Number.isFinite(gameplay.lizardBoostMultiplier)
            ? clamp(Number(gameplay.lizardBoostMultiplier), 1.2, 4)
            : DEFAULT_LIZARD_BOOST_MULTIPLIER,
        lizardBoostDurationSec: Number.isFinite(gameplay.lizardBoostDurationSec)
            ? clamp(Math.floor(gameplay.lizardBoostDurationSec), 1, 15)
            : DEFAULT_LIZARD_BOOST_DURATION_SEC,
        lizardCooldownSec: Number.isFinite(gameplay.lizardCooldownSec)
            ? clamp(Math.floor(gameplay.lizardCooldownSec), 5, 120)
            : DEFAULT_LIZARD_COOLDOWN_SEC,
        basilicBoostMultiplier: Number.isFinite(gameplay.basilicBoostMultiplier)
            ? clamp(Number(gameplay.basilicBoostMultiplier), 1.2, 4)
            : DEFAULT_BASILIC_BOOST_MULTIPLIER,
        basilicBoostDurationSec: Number.isFinite(gameplay.basilicBoostDurationSec)
            ? clamp(Math.floor(gameplay.basilicBoostDurationSec), 1, 15)
            : DEFAULT_BASILIC_BOOST_DURATION_SEC,
        basilicCooldownSec: Number.isFinite(gameplay.basilicCooldownSec)
            ? clamp(Math.floor(gameplay.basilicCooldownSec), 5, 120)
            : DEFAULT_BASILIC_COOLDOWN_SEC,
        cameleonInvisibilityDurationSec: Number.isFinite(gameplay.cameleonInvisibilityDurationSec)
            ? clamp(Number(gameplay.cameleonInvisibilityDurationSec), 1, 30)
            : DEFAULT_CAMELEON_INVISIBILITY_DURATION_SEC,
        cameleonCooldownSec: Number.isFinite(gameplay.cameleonCooldownSec)
            ? clamp(Math.floor(gameplay.cameleonCooldownSec), 5, 120)
            : DEFAULT_CAMELEON_COOLDOWN_SEC,
        cracheurShotDistance: Number.isFinite(gameplay.cracheurShotDistance)
            ? clamp(Math.floor(gameplay.cracheurShotDistance), 1, 4000)
            : DEFAULT_CRACHEUR_SHOT_DISTANCE,
        cracheurCooldownSec: Number.isFinite(gameplay.cracheurCooldownSec)
            ? clamp(Math.floor(gameplay.cracheurCooldownSec), 5, 120)
            : DEFAULT_CRACHEUR_COOLDOWN_SEC,
        cracheurParalysisDurationSec: Number.isFinite(gameplay.cracheurParalysisDurationSec)
            ? clamp(Number(gameplay.cracheurParalysisDurationSec), 1, 20)
            : DEFAULT_CRACHEUR_PARALYSIS_DURATION_SEC,
        mambaBoostMultiplier: Number.isFinite(gameplay.mambaBoostMultiplier)
            ? clamp(Number(gameplay.mambaBoostMultiplier), 1.1, 5)
            : DEFAULT_MAMBA_BOOST_MULTIPLIER,
        mambaBoostDurationSec: Number.isFinite(gameplay.mambaBoostDurationSec)
            ? clamp(Number(gameplay.mambaBoostDurationSec), 0.05, 2)
            : DEFAULT_MAMBA_BOOST_DURATION_SEC,
        wormVirusCooldownSec: Number.isFinite(gameplay.wormVirusCooldownSec)
            ? clamp(Math.floor(gameplay.wormVirusCooldownSec), 5, 120)
            : DEFAULT_WORM_VIRUS_COOLDOWN_SEC,
        wormVirusCameraMoveSpeed: Number.isFinite(gameplay.wormVirusCameraMoveSpeed)
            ? clamp(Math.floor(gameplay.wormVirusCameraMoveSpeed), 120, 1800)
            : DEFAULT_WORM_VIRUS_CAMERA_MOVE_SPEED,
        tortueSegmentSpacingMultiplier: Number.isFinite(gameplay.tortueSegmentSpacingMultiplier)
            ? clamp(Number(gameplay.tortueSegmentSpacingMultiplier), 1, 3)
            : TORTUE_SEGMENT_SPACING_MULTIPLIER,
        tortueHeadGapSegments: Number.isFinite(gameplay.tortueHeadGapSegments)
            ? clamp(Number(gameplay.tortueHeadGapSegments), 0, 6)
            : TORTUE_HEAD_GAP_SEGMENTS,
        initialScore: Number.isFinite(gameplay.initialScore) ? Math.max(0, Math.floor(gameplay.initialScore)) : INITIAL_SCORE,
        initialSize: Number.isFinite(gameplay.initialSize) ? Math.max(1, Math.floor(gameplay.initialSize)) : INITIAL_SIZE,
        phoenixRespawnScorePenalty: Number.isFinite(gameplay.phoenixRespawnScorePenalty)
            ? Math.max(0, Math.floor(gameplay.phoenixRespawnScorePenalty))
            : (Number.isFinite(gameplay.phoenixRespawnScore)
                ? Math.max(0, Math.floor(gameplay.phoenixRespawnScore))
                : DEFAULT_PHOENIX_RESPAWN_SCORE_PENALTY),
        orangeScoreGain: Number.isFinite(gameplay.orangeScoreGain) ? Math.max(0, Math.floor(gameplay.orangeScoreGain)) : 1,
        orangeSizeGain: Number.isFinite(gameplay.orangeSizeGain) ? Math.max(0, Math.floor(gameplay.orangeSizeGain)) : 1,
        boaGrowthMultiplier: Number.isFinite(gameplay.boaGrowthMultiplier)
            ? clamp(Number(gameplay.boaGrowthMultiplier), 1, 5)
            : DEFAULT_BOA_GROWTH_MULTIPLIER,
        boaSlowTargetSpeedMultiplier: Number.isFinite(gameplay.boaSlowTargetSpeedMultiplier)
            ? clamp(Number(gameplay.boaSlowTargetSpeedMultiplier), 0.1, 1)
            : DEFAULT_BOA_SLOW_TARGET_SPEED_MULTIPLIER,
        boaSelfSlowSpeedMultiplier: Number.isFinite(gameplay.boaSelfSlowSpeedMultiplier)
            ? clamp(Number(gameplay.boaSelfSlowSpeedMultiplier), 0.1, 1)
            : DEFAULT_BOA_SELF_SLOW_SPEED_MULTIPLIER,
        aspirateurRadius: Number.isFinite(gameplay.aspirateurRadius)
            ? clamp(Math.floor(gameplay.aspirateurRadius), 20, 250)
            : DEFAULT_ASPIRATEUR_RADIUS,
        killBonusThresholdSize: Number.isFinite(gameplay.killBonusThresholdSize) ? Math.max(1, Math.floor(gameplay.killBonusThresholdSize)) : KILL_BONUS_THRESHOLD,
        killBonusLargeScore: Number.isFinite(gameplay.killBonusLargeScore) ? Math.max(0, Math.floor(gameplay.killBonusLargeScore)) : KILL_BONUS_LARGE_SCORE,
        killBonusSmallScore: Number.isFinite(gameplay.killBonusSmallScore) ? Math.max(0, Math.floor(gameplay.killBonusSmallScore)) : KILL_BONUS_SMALL_SCORE,
        crashKillBonusScore: Number.isFinite(gameplay.crashKillBonusScore) ? Math.max(0, Math.floor(gameplay.crashKillBonusScore)) : CRASH_KILL_BONUS_SCORE,
        diableCornuScoreBonus: Number.isFinite(gameplay.diableCornuScoreBonus) ? Math.max(0, Math.floor(gameplay.diableCornuScoreBonus)) : DIABLE_CORNU_SCORE_BONUS,
        sansScoreMultiplier: Number.isFinite(gameplay.sansScoreMultiplier) ? clamp(Number(gameplay.sansScoreMultiplier), 1, 10) : SANS_SCORE_MULTIPLIER,
        orangeCount: ORANGE_COUNT
    };

    const roster = buildRoster(setup);
    config.maxSnakes = roster.length;
    const spawnPoints = createUniformSpawnPoints(config.maxSnakes);

    const snakes = roster.map((entry, index) =>
        createSnakeState(entry, spawnPoints[index], config.segmentSpacing, config)
    );

    for (const snake of snakes)
    {
        syncSegmentPositions(snake, config.segmentSpacing, config.tortueSegmentSpacingMultiplier, config.tortueHeadGapSegments);
    }

    let nextOrangeId = 1;
    const oranges = [];

    for (let i = 0; i < config.orangeCount; i++)
    {
        oranges.push({
            id: nextOrangeId++,
            x: randomInWorld(20, WORLD_WIDTH),
            y: randomInWorld(20, WORLD_HEIGHT)
        });
    }

    return {
        config,
        snakes,
        oranges,
        isGameOver: false,
        winnerName: null,
        finalScore: 0,
        elapsedTimeMs: 0,
        poisonProjectiles: [],
        _nextOrangeId: nextOrangeId
    };
}

// ---------------------------------------------------------------------------
// stepGame — advances simulation by one tick
// ---------------------------------------------------------------------------

/**
 * @param {object}  state           - mutable GameState
 * @param {number}  dt              - delta time in seconds
 * @param {number}  now             - current timestamp in ms (e.g. Date.now() or server tick time)
 * @param {Map}     inputDirections - Map<snakeId, {x,y}> desired directions from player input
 * @param {Set}     inputActions    - Set<snakeId> player action requests for this tick
 * @returns {{ events: object[] }}
 */
export function stepGame (state, dt, now, inputDirections = new Map(), inputActions = new Set())
{
    if (state.isGameOver)
    {
        return { events: [] };
    }

    const events = [];
    state.elapsedTimeMs += dt * 1000;

    const { config } = state;

    // --- Bot turn cooldown decrement ---
    for (const snake of state.snakes)
    {
        if (!snake.alive)
        {
            continue;
        }

        if (!snake.isPlayer)
        {
            snake.turnCooldown -= dt * 1000;
        }
    }

    // --- Apply player input ---
    for (const snake of state.snakes)
    {
        if (!snake.alive || !snake.isPlayer)
        {
            continue;
        }

        if (inputActions.has(snake.id))
        {
            triggerActionPower(snake, state, now, events);
        }

        if (now < snake.paralyzedUntil || isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
        {
            continue;
        }

        const desired = inputDirections.get(snake.id);

        if (!desired)
        {
            continue;
        }

        if ((desired.x + snake.direction.x === 0) && (desired.y + snake.direction.y === 0))
        {
            continue;
        }

        snake.direction = desired;
    }

    // --- Bot AI direction ---
    for (const snake of state.snakes)
    {
        if (!snake.alive || snake.isPlayer)
        {
            continue;
        }

        if (now < snake.paralyzedUntil || isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
        {
            continue;
        }

        if (snake.turnCooldown > 0)
        {
            continue;
        }

        snake.turnCooldown = config.botTurnDelayMs;
        updateBotDirection(snake, state, now);
    }

    processPendingPhoenixRespawn(state, now, events);
    processWormVirusState(state, dt, now, inputDirections, events);
    updatePoisonProjectiles(state, dt, now, events);

    // --- Move snakes ---
    for (const snake of state.snakes)
    {
        if (!snake.alive)
        {
            continue;
        }

        snake.boaSlowedByEnemy = false;
        snake.boaSelfEntangled = false;
        snake.boaOnEnemyBody = false;

    }

    updateBoaBodyContactEffects(state, now);

    for (const snake of state.snakes)
    {
        if (!snake.alive)
        {
            continue;
        }

        moveSnake(snake, dt, now, config);
    }

    // --- Resolve collisions ---
    resolveCollisions(state, now, events);

    // --- Orange collection, segment sync, lezard restore ---
    for (const snake of state.snakes)
    {
        if (!snake.alive)
        {
            continue;
        }

        handleOrangeCollection(snake, state, now, events);
        processPendingLizardRestore(snake, now, events);
        processPhoenixArrivalGrowth(snake, now, config, events);
        processWormVirusArrival(snake, now);
        syncSegmentPositions(snake, config.segmentSpacing, config.tortueSegmentSpacingMultiplier, config.tortueHeadGapSegments);
    }

    return { events };
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

function moveSnake (snake, dt, now, config)
{
    if (isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
    {
        return;
    }

    if (now < snake.paralyzedUntil)
    {
        // Keep history untouched while paralyzed so the full body remains still.
        return;
    }

    let speedMultiplier = 1;
    
    if (snake.power === 'tortue')
    {
        speedMultiplier = TORTUE_SPEED_MULTIPLIER;
    }
    else if (snake.power === 'lezard' && now < snake.lizardBoostUntil)
    {
        speedMultiplier = config.lizardBoostMultiplier;
    }
    else if (snake.power === 'basilic' && now < snake.basilicBoostUntil)
    {
        speedMultiplier = config.basilicBoostMultiplier;
    }
    else if (snake.power === 'mamba' && now < snake.mambaBoostUntil)
    {
        speedMultiplier = config.mambaBoostMultiplier;
    }

    if (snake.boaSlowedByEnemy)
    {
        speedMultiplier *= config.boaSlowTargetSpeedMultiplier;
    }

    if (snake.power === 'boa' && snake.boaSelfEntangled)
    {
        speedMultiplier *= config.boaSelfSlowSpeedMultiplier;
    }

    snake.x += snake.direction.x * SNAKE_SPEED * speedMultiplier * dt;
    snake.y += snake.direction.y * SNAKE_SPEED * speedMultiplier * dt;

    if (snake.selfCollisionGraceRemainingMs > 0)
    {
        snake.selfCollisionGraceRemainingMs = Math.max(0, snake.selfCollisionGraceRemainingMs - (dt * 1000));
    }

    snake.history.unshift({ x: snake.x, y: snake.y });

        const targetLength = getTargetHistoryLength(
            getSnakeSize(snake),
            snake.power,
            config.segmentSpacing,
            config.tortueSegmentSpacingMultiplier,
            config.tortueHeadGapSegments
        );

    if (snake.history.length > targetLength)
    {
        snake.history.length = targetLength;
    }
}

function updateBoaBodyContactEffects (state, now)
{
    for (const boa of state.snakes)
    {
        if (!boa.alive || boa.power !== 'boa')
        {
            continue;
        }

        if (isWormVirusTargetingActive(boa, now) || boa.wormVirusTeleportPending)
        {
            continue;
        }

        boa.boaSelfEntangled = isBoaSelfBodyContact(boa);

        for (const target of state.snakes)
        {
            if (!target.alive || target === boa)
            {
                continue;
            }

            if (isWormVirusTargetingActive(target, now) || target.wormVirusTeleportPending)
            {
                continue;
            }

            if (getSnakeSize(boa) <= getSnakeSize(target))
            {
                continue;
            }

            if (isBoaBodyOnOtherBody(boa, target))
            {
                target.boaSlowedByEnemy = true;
                boa.boaOnEnemyBody = true;
            }
        }
    }
}

function isBoaBodyOnOtherBody (boa, target)
{
    if (!boa?.alive || !target?.alive)
    {
        return false;
    }

    if (isPointOnSnakeBody(boa.x, boa.y, target))
    {
        return true;
    }

    for (const segment of boa.segments)
    {
        if (isPointOnSnakeBody(segment.x, segment.y, target))
        {
            return true;
        }
    }

    return false;
}

function isPointOnSnakeBody (px, py, snake)
{
    for (let i = 0; i < snake.segments.length; i++)
    {
        const seg = snake.segments[i];

        if (distanceBetween(px, py, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE)
        {
            return true;
        }

        if (i > 0)
        {
            const prev = snake.segments[i - 1];
            if (distancePointToSegment(px, py, prev.x, prev.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE - 2)
            {
                return true;
            }
        }
    }

    return false;
}

function isBoaSelfBodyContact (snake)
{
    if (!snake?.alive || snake.power !== 'boa')
    {
        return false;
    }

    if (snake.phoenixArrivalGrowthRemaining > 0 || snake.selfCollisionGraceRemainingMs > 0)
    {
        return false;
    }

    for (let i = SELF_COLLISION_NON_LETHAL_SEGMENTS; i < snake.segments.length; i++)
    {
        const seg = snake.segments[i];

        if (distanceBetween(snake.x, snake.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE)
        {
            return true;
        }

        if (i > 0)
        {
            const prev = snake.segments[i - 1];
            if (distancePointToSegment(snake.x, snake.y, prev.x, prev.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE - 2)
            {
                return true;
            }
        }
    }

    for (let first = 1; first < snake.segments.length; first++)
    {
        const a1 = snake.segments[first - 1];
        const a2 = snake.segments[first];

        for (let second = first + 3; second < snake.segments.length; second++)
        {
            const b1 = snake.segments[second - 1];
            const b2 = snake.segments[second];

            if (doSegmentsIntersect(a1, a2, b1, b2))
            {
                return true;
            }

            const closeA = distancePointToSegment(a1.x, a1.y, b1.x, b1.y, b2.x, b2.y);
            const closeB = distancePointToSegment(a2.x, a2.y, b1.x, b1.y, b2.x, b2.y);
            if (Math.min(closeA, closeB) <= 8)
            {
                return true;
            }
        }
    }

    return false;
}

function doSegmentsIntersect (a1, a2, b1, b2)
{
    const orientation = (p, q, r) => {
        const value = ((q.y - p.y) * (r.x - q.x)) - ((q.x - p.x) * (r.y - q.y));
        if (Math.abs(value) < 0.0001)
        {
            return 0;
        }

        return value > 0 ? 1 : 2;
    };

    const onSegment = (p, q, r) => (
        q.x <= Math.max(p.x, r.x)
        && q.x >= Math.min(p.x, r.x)
        && q.y <= Math.max(p.y, r.y)
        && q.y >= Math.min(p.y, r.y)
    );

    const o1 = orientation(a1, a2, b1);
    const o2 = orientation(a1, a2, b2);
    const o3 = orientation(b1, b2, a1);
    const o4 = orientation(b1, b2, a2);

    if (o1 !== o2 && o3 !== o4)
    {
        return true;
    }

    if (o1 === 0 && onSegment(a1, b1, a2)) return true;
    if (o2 === 0 && onSegment(a1, b2, a2)) return true;
    if (o3 === 0 && onSegment(b1, a1, b2)) return true;
    if (o4 === 0 && onSegment(b1, a2, b2)) return true;

    return false;
}

// ---------------------------------------------------------------------------
// Segment positions sync (data only)
// ---------------------------------------------------------------------------

function syncSegmentPositions (snake, segmentSpacing, tortueSegmentSpacingMultiplier, tortueHeadGapSegments)
{
    const logicalSize = getSnakeSize(snake);
    const visualSize = snake.power === 'leurre'
        ? Math.min(LEURRE_VISUAL_MAX_SIZE, logicalSize)
        : (snake.power === 'sphinx'
            ? logicalSize + Math.max(0, Math.floor(snake.sphinxVisualSizeBonus || 0))
            : logicalSize);
    const desired = Math.max(0, visualSize - 1);

    while (snake.segments.length < desired)
    {
        snake.segments.push({ x: snake.x, y: snake.y });
    }

    while (snake.segments.length > desired)
    {
        snake.segments.pop();
    }

    for (let i = 0; i < snake.segments.length; i++)
    {
        const effectiveSpacing = getEffectiveSegmentSpacing(snake.power, segmentSpacing, tortueSegmentSpacingMultiplier);
        const headGap = getHeadGapSegments(snake.power, tortueHeadGapSegments);
        const hi = Math.min(
            snake.history.length - 1,
            Math.floor((i + 1 + headGap) * effectiveSpacing)
        );
        snake.segments[i] = { ...snake.history[hi] };
    }
}

// ---------------------------------------------------------------------------
// Orange collection
// ---------------------------------------------------------------------------

function handleOrangeCollection (snake, state, now, events)
{
    const { config } = state;
    const collectionDistance = HEAD_RADIUS + 6 + (snake.power === 'aspirateur' ? (config.aspirateurRadius * 0.5) : 0);

    for (let i = state.oranges.length - 1; i >= 0; i--)
    {
        const orange = state.oranges[i];

        if (distanceBetween(snake.x, snake.y, orange.x, orange.y) <= collectionDistance)
        {
            events.push({ type: 'orange_removed', id: orange.id });
            state.oranges.splice(i, 1);
            triggerMambaBoost(snake, now, config);
            if (snake.power === 'sphinx')
            {
                snake.sphinxVisualSizeBonus = Math.max(0, Math.floor(snake.sphinxVisualSizeBonus || 0)) + 1;
            }
            
            if (orange.poisoned)
            {
                // Poisoned orange: lose 1 segment
                if (getSnakeSize(snake) <= 1)
                {
                    events.push({ type: 'score_popup', x: snake.x, y: snake.y - 20, label: '-1 POISON', color: snake.color });
                    killSnake(snake, state, now, events, { spawnOranges: true });
                    continue;
                }

                snake.segments.pop();
                changeSize(snake, -1);
                
                events.push({ type: 'score_popup', x: snake.x, y: snake.y - 20, label: '-1 POISON', color: snake.color });
            }
            else
            {
                const growthMultiplier = snake.power === 'boa' ? config.boaGrowthMultiplier : 1;
                const gainedSize = Math.max(0, Math.floor(config.orangeSizeGain * growthMultiplier));
                addScore(snake, config.orangeScoreGain, config);
                changeSize(snake, gainedSize);
                events.push({ type: 'score_popup', x: snake.x, y: snake.y - 20, label: '+1', color: snake.color });
            }

            const newOrange = {
                id: state._nextOrangeId++,
                x: randomInWorld(20, WORLD_WIDTH),
                y: randomInWorld(20, WORLD_HEIGHT)
            };
            state.oranges.push(newOrange);
            events.push({ type: 'orange_spawned', id: newOrange.id, x: newOrange.x, y: newOrange.y });
        }
    }
}

// ---------------------------------------------------------------------------
// Collision resolution
// ---------------------------------------------------------------------------

function resolveCollisions (state, now, events)
{
    const { config } = state;

    for (const snake of state.snakes)
    {
        if (!snake.alive)
        {
            continue;
        }

        if (isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
        {
            continue;
        }

        checkWallDeath(snake, state, now, events);

        if (snake.alive)
        {
            checkSelfCollision(snake, state, now, events);
        }
    }

    // Head-to-head
    for (let a = 0; a < state.snakes.length; a++)
    {
        const snakeA = state.snakes[a];

        if (!snakeA.alive)
        {
            continue;
        }

        if (isWormVirusTargetingActive(snakeA) || snakeA.wormVirusTeleportPending)
        {
            continue;
        }

        for (let b = a + 1; b < state.snakes.length; b++)
        {
            const snakeB = state.snakes[b];

            if (!snakeB.alive)
            {
                continue;
            }

            if (isWormVirusTargetingActive(snakeB) || snakeB.wormVirusTeleportPending)
            {
                continue;
            }

            if (distanceBetween(snakeA.x, snakeA.y, snakeB.x, snakeB.y) <= HEAD_TO_HEAD_DISTANCE)
            {
                handleHeadToHead(snakeA, snakeB, state, now, events);
            }
        }
    }

    // Head-to-body
    for (let ai = 0; ai < state.snakes.length; ai++)
    {
        const attacker = state.snakes[ai];

        if (!attacker.alive)
        {
            continue;
        }

        if (isWormVirusTargetingActive(attacker) || attacker.wormVirusTeleportPending)
        {
            continue;
        }

        for (let di = 0; di < state.snakes.length; di++)
        {
            if (ai === di)
            {
                continue;
            }

            const defender = state.snakes[di];

            if (!defender.alive)
            {
                continue;
            }

            if (isWormVirusTargetingActive(defender) || defender.wormVirusTeleportPending)
            {
                continue;
            }

            const hitIndex = getBodyHitIndex(attacker, defender);

            if (hitIndex === -1)
            {
                continue;
            }

            if (attacker.power === 'boa')
            {
                if (getSnakeSize(attacker) > getSnakeSize(defender))
                {
                    break;
                }

                killSnake(attacker, state, now, events, { spawnOranges: true });
                addScore(defender, defender.power === 'sphinx' ? config.crashKillBonusScore * 2 : config.crashKillBonusScore, config);
                break;
            }

            // Tortue body cannot be crossed or cut: attacker crashes and dies.
            if (defender.power === 'tortue')
            {
                if (attacker.power === 'salamandre' && getSnakeSize(defender) > getSnakeSize(attacker))
                {
                    continue;
                }

                const absorbedSize = getSnakeSize(attacker);
                const defenderIsBoa = defender.power === 'boa';
                killSnake(attacker, state, now, events, { spawnOranges: !defenderIsBoa });
                addScore(defender, defender.power === 'sphinx' ? config.crashKillBonusScore * 2 : config.crashKillBonusScore, config);

                if (defenderIsBoa && defender.alive)
                {
                    changeSize(defender, absorbedSize);
                    addScore(defender, absorbedSize, config);
                }

                break;
            }

            if (getSnakeSize(defender) > getSnakeSize(attacker))
            {
                if (attacker.power === 'salamandre')
                {
                    continue;
                }

                const absorbedSize = getSnakeSize(attacker);
                const defenderIsBoa = defender.power === 'boa';
                killSnake(attacker, state, now, events, { spawnOranges: !defenderIsBoa });
                addScore(defender, defender.power === 'sphinx' ? config.crashKillBonusScore * 2 : config.crashKillBonusScore, config);

                if (defenderIsBoa && defender.alive)
                {
                    changeSize(defender, absorbedSize);
                    addScore(defender, absorbedSize, config);
                }
            }
            else if (getSnakeSize(attacker) > getSnakeSize(defender))
            {
                // Handle Diable Cornu: attacker loses 4 segments
                if (defender.power === 'diable_cornu')
                {
                    // Attacker loses DIABLE_CORNU_DAMAGE segments
                    const damageSegments = Math.min(DIABLE_CORNU_DAMAGE, Math.max(0, getSnakeSize(attacker) - 1));
                    for (let d = 0; d < damageSegments; d++)
                    {
                        if (attacker.segments.length > 0)
                        {
                            attacker.segments.pop();
                        }
                    }

                    changeSize(attacker, -damageSegments);
                    
                    if (getSnakeSize(attacker) < 1)
                    {
                        killSnake(attacker, state, now, events, { spawnOranges: true });
                        break;
                    }
                    
                    // Defender segments are removed and become poisoned oranges
                    const removed = defender.segments.splice(hitIndex);
                    for (const seg of removed)
                    {
                        const o = { id: state._nextOrangeId++, x: seg.x, y: seg.y, poisoned: true };
                        state.oranges.push(o);
                        events.push({ type: 'poisoned_orange_spawned', id: o.id, x: o.x, y: o.y });
                    }
                    
                    addScore(defender, config.diableCornuScoreBonus, config);
                    events.push({ type: 'score_popup', x: attacker.x, y: attacker.y - 25, label: `-${damageSegments} POISON!`, color: attacker.color });
                    
                    if (defender.segments.length <= 0)
                    {
                        killSnake(defender, state, now, events, { spawnOranges: true });
                    }
                }
                else
                {
                    triggerMambaBoost(attacker, now, config);
                    truncateSnakeAt(defender, hitIndex, state, now, events);
                }
            }

            break;
        }
    }

    checkVictoryCondition(state, events);
}

function checkWallDeath (snake, state, now, events)
{
    if (snake.x < 0 || snake.x > WORLD_WIDTH || snake.y < 0 || snake.y > WORLD_HEIGHT)
    {
        killSnake(snake, state, now, events, { spawnOranges: true });
    }
}

function checkSelfCollision (snake, state, now, events)
{
    if (snake.power === 'anguille' || snake.power === 'boa')
    {
        return;
    }

    // During spawn/phoenix growth ticks, segments are still packing in.
    // Skip self-collision for this short phase to avoid instant false deaths.
    if (snake.phoenixArrivalGrowthRemaining > 0)
    {
        return;
    }

    if (snake.selfCollisionGraceRemainingMs > 0)
    {
        return;
    }

    const nonLethalSegments =
        snake.power === 'tortue'
            ? (snake.phoenixArrivalGrowthRemaining > 0
                ? TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS
                : TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS_AFTER_SPAWN)
            : SELF_COLLISION_NON_LETHAL_SEGMENTS;

    for (let i = nonLethalSegments; i < snake.segments.length; i++)
    {
        const seg = snake.segments[i];

        if (distanceBetween(snake.x, snake.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE)
        {
            if (snake.power === 'boa')
            {
                snake.boaSelfEntangled = true;
                return;
            }

            killSnake(snake, state, now, events, { spawnOranges: true });
            return;
        }

        if (i > 0)
        {
            const prev = snake.segments[i - 1];
            if (distancePointToSegment(snake.x, snake.y, prev.x, prev.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE - 2)
            {
                if (snake.power === 'boa')
                {
                    snake.boaSelfEntangled = true;
                    return;
                }

                killSnake(snake, state, now, events, { spawnOranges: true });
                return;
            }
        }
    }
}

function handleHeadToHead (snakeA, snakeB, state, now, events)
{
    if (!snakeA.alive || !snakeB.alive)
    {
        return;
    }

    const ix = (snakeA.x + snakeB.x) * 0.5;
    const iy = (snakeA.y + snakeB.y) * 0.5;
    events.push({ type: 'impact_flash', x: ix, y: iy, major: true });

    if (snakeA.power === 'boa' && snakeB.power === 'boa')
    {
        killSnake(snakeA, state, now, events, { spawnOranges: true });
        killSnake(snakeB, state, now, events, { spawnOranges: true });
        return;
    }

    if (snakeA.power === 'boa' || snakeB.power === 'boa')
    {
        const boaSnake = snakeA.power === 'boa' ? snakeA : snakeB;
        const otherSnake = boaSnake === snakeA ? snakeB : snakeA;
        const absorbed = getSnakeSize(boaSnake);
        killSnake(boaSnake, state, now, events, { spawnOranges: false });

        if (otherSnake.alive)
        {
            changeSize(otherSnake, absorbed);
            addScore(otherSnake, absorbed, state.config);
            triggerMambaBoost(otherSnake, now, state.config);
        }

        return;
    }

    if (getSnakeSize(snakeA) === getSnakeSize(snakeB))
    {
        killSnake(snakeA, state, now, events, { spawnOranges: true });
        killSnake(snakeB, state, now, events, { spawnOranges: true });
        return;
    }

    const bigger  = getSnakeSize(snakeA) > getSnakeSize(snakeB) ? snakeA : snakeB;
    const smaller = bigger === snakeA ? snakeB : snakeA;
    const absorbed = getSnakeSize(smaller);

    killSnake(smaller, state, now, events, { spawnOranges: false });

    if (bigger.alive)
    {
        changeSize(bigger, absorbed);
        addScore(bigger, absorbed, state.config);
        triggerMambaBoost(bigger, now, state.config);
        
        // Kill bonus based on victim size
        if (absorbed >= state.config.killBonusThresholdSize)
        {
            addScore(bigger, state.config.killBonusLargeScore, state.config);
            events.push({ type: 'score_popup', x: bigger.x, y: bigger.y - 25, label: `+${absorbed} +${state.config.killBonusLargeScore} KILL!`, color: bigger.color });
        }
        else
        {
            addScore(bigger, state.config.killBonusSmallScore, state.config);
            events.push({ type: 'score_popup', x: bigger.x, y: bigger.y - 25, label: `+${absorbed} +${state.config.killBonusSmallScore} KILL!`, color: bigger.color });
        }
    }
}

function getBodyHitIndex (attacker, defender)
{
    for (let i = 0; i < defender.segments.length; i++)
    {
        const seg = defender.segments[i];

        if (distanceBetween(attacker.x, attacker.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE)
        {
            return i;
        }

        if (i > 0)
        {
            const prev = defender.segments[i - 1];

            if (distancePointToSegment(attacker.x, attacker.y, prev.x, prev.y, seg.x, seg.y) <= HEAD_TO_BODY_DISTANCE - 2)
            {
                return i;
            }
        }
    }

    return -1;
}

function killSnake (snake, state, now, events, { spawnOranges = true } = {})
{
    if (!snake.alive)
    {
        return;
    }

    if (snake.power === 'phoenix' && snake.livesRemaining > 1)
    {
        snake.livesRemaining -= 1;
        schedulePhoenixRespawn(snake, state, now);
        events.push({ type: 'score_popup', x: snake.x, y: snake.y - 24, label: `PHOENIX ${snake.livesRemaining} vies`, color: snake.color });
        return;
    }

    snake.alive = false;

    if (spawnOranges)
    {
        for (const seg of snake.segments)
        {
            const o = { id: state._nextOrangeId++, x: seg.x, y: seg.y };
            state.oranges.push(o);
            events.push({ type: 'orange_spawned', id: o.id, x: o.x, y: o.y });
        }

        const ho = { id: state._nextOrangeId++, x: snake.x, y: snake.y };
        state.oranges.push(ho);
        events.push({ type: 'orange_spawned', id: ho.id, x: ho.x, y: ho.y });
    }

    snake.segments = [];
    snake.phoenixRespawnPending = false;
    snake.phoenixRespawnAtMs = 0;
    snake.phoenixRespawnDirection = null;
    snake.phoenixArrivalGrowthRemaining = 0;
    snake.phoenixArrivalGrowthNextAt = 0;
    events.push({ type: 'snake_died', snakeId: snake.id, spawnOranges });
}

function schedulePhoenixRespawn (snake, state, now)
{
    const spawn = findSafeRespawnPoint(state, snake.id);
    snake.alive = false;
    snake.score = Math.max(0, snake.score - state.config.phoenixRespawnScorePenalty);
    snake.size = state.config.initialSize;
    snake.segments = [];
    snake.phoenixRespawnPending = true;
    snake.phoenixRespawnAtMs = now + PHOENIX_RESPAWN_DELAY_MS;
    snake.phoenixRespawnX = spawn.x;
    snake.phoenixRespawnY = spawn.y;
    snake.phoenixRespawnDirection = spawn.direction;
    snake.phoenixArrivalGrowthRemaining = 0;
    snake.phoenixArrivalGrowthNextAt = 0;
}

function processPendingPhoenixRespawn (state, now, events)
{
    for (const snake of state.snakes)
    {
        if (!snake.phoenixRespawnPending || snake.alive)
        {
            continue;
        }

        if (now < snake.phoenixRespawnAtMs)
        {
            continue;
        }

        respawnPhoenixSnakeAtTarget(snake, state, now, events);
    }
}

    function respawnPhoenixSnakeAtTarget (snake, state, now, events)
{
    const direction = snake.phoenixRespawnDirection || { ...DIRECTIONS[randomBetween(0, DIRECTIONS.length - 1)] };

    snake.alive = true;
    snake.size = state.config.initialSize;
    snake.x = snake.phoenixRespawnX;
    snake.y = snake.phoenixRespawnY;
    snake.direction = direction;
    snake.turnCooldown = 0;
    snake.lizardBoostUntil = 0;
    snake.lizardCooldownUntil = 0;
    snake.basilicBoostUntil = 0;
    snake.basilicCooldownUntil = 0;
    snake.mambaBoostUntil = 0;
    snake.sphinxVisualSizeBonus = snake.power === 'sphinx' ? Math.max(0, state.config.initialSize - 1) : 0;
    snake.pendingLizardRestoreAt = 0;
    snake.pendingLizardRestoreSegments = 0;
    snake.phoenixRespawnPending = false;
    snake.phoenixRespawnAtMs = 0;
    snake.phoenixRespawnDirection = null;
    snake.phoenixArrivalGrowthRemaining = PHOENIX_RESPAWN_BONUS_GROWTH;
    snake.phoenixArrivalGrowthNextAt = now + PHOENIX_RESPAWN_GROWTH_STEP_MS;
    events.push({ type: 'score_popup', x: snake.x, y: snake.y - 24, label: `+${PHOENIX_RESPAWN_BONUS_GROWTH}`, color: snake.color });

    snake.history = createInitialHistory(snake.x, snake.y, snake.direction, state.config.segmentSpacing);
    snake.segments = [];

    for (let i = 0; i < getSnakeSize(snake) - 1; i++)
    {
        snake.segments.push({
            x: snake.x - (snake.direction.x * state.config.segmentSpacing * (i + 1)),
            y: snake.y - (snake.direction.y * state.config.segmentSpacing * (i + 1))
        });
    }
}

function processPhoenixArrivalGrowth (snake, now, config, events)
{
    if (!snake.alive || snake.phoenixArrivalGrowthRemaining <= 0)
    {
        return;
    }

    let added = 0;

    while (snake.phoenixArrivalGrowthRemaining > 0 && now >= snake.phoenixArrivalGrowthNextAt)
    {
        addScore(snake, config.orangeScoreGain, config);
        changeSize(snake, config.orangeSizeGain);
        snake.phoenixArrivalGrowthRemaining -= 1;
        snake.phoenixArrivalGrowthNextAt += PHOENIX_RESPAWN_GROWTH_STEP_MS;
        added += 1;
    }

    if (added > 0)
    {
        events.push({ type: 'score_popup', x: snake.x, y: snake.y - 20, label: `+${added}`, color: snake.color });
    }

    if (snake.phoenixArrivalGrowthRemaining <= 0)
    {
        snake.phoenixArrivalGrowthNextAt = 0;
    }
}

function findSafeRespawnPoint (state, excludedSnakeId)
{
    for (let attempt = 0; attempt < 80; attempt++)
    {
        const x = randomInWorld(150, WORLD_WIDTH);
        const y = randomInWorld(150, WORLD_HEIGHT);
        const hasNearbyEnemy = state.snakes.some((other) => {
            if (!other.alive || other.id === excludedSnakeId)
            {
                return false;
            }

            if (distanceBetween(x, y, other.x, other.y) < 170)
            {
                return true;
            }

            return other.segments.some((seg) => distanceBetween(x, y, seg.x, seg.y) < 130);
        });

        if (!hasNearbyEnemy)
        {
            return {
                x,
                y,
                direction: { ...DIRECTIONS[randomBetween(0, DIRECTIONS.length - 1)] }
            };
        }
    }

    return {
        x: randomInWorld(150, WORLD_WIDTH),
        y: randomInWorld(150, WORLD_HEIGHT),
        direction: { ...DIRECTIONS[randomBetween(0, DIRECTIONS.length - 1)] }
    };
}

function triggerActionPower (snake, state, now, events)
{
    const { config } = state;

    if (!snake.alive || now < snake.paralyzedUntil)
    {
        return;
    }

    if (snake.power === 'basilic')
    {
        if (now < snake.basilicCooldownUntil)
        {
            return;
        }

        snake.basilicBoostUntil = now + (config.basilicBoostDurationSec * 1000);
        snake.basilicCooldownUntil = now + (config.basilicCooldownSec * 1000);
        events.push({ type: 'score_popup', x: snake.x, y: snake.y - 30, label: 'BASILIC!', color: snake.color });
        return;
    }

    if (snake.power === 'cameleon')
    {
        if (now < snake.cameleonCooldownUntil)
        {
            return;
        }

        snake.cameleonInvisibleUntil = now + (config.cameleonInvisibilityDurationSec * 1000);
        snake.cameleonCooldownUntil = now + (config.cameleonCooldownSec * 1000);
        events.push({ type: 'score_popup', x: snake.x, y: snake.y - 30, label: 'CAMOUFLAGE!', color: snake.color });
        return;
    }

    if (snake.power === 'cracheur')
    {
        if (now < snake.cracheurCooldownUntil)
        {
            return;
        }

        spawnPoisonProjectile(snake, state);
        snake.cracheurCooldownUntil = now + (config.cracheurCooldownSec * 1000);
        events.push({ type: 'score_popup', x: snake.x, y: snake.y - 30, label: 'CRACHE!', color: snake.color });
        return;
    }

    if (snake.power === 'worm_virus')
    {
        startWormVirusTargeting(snake, state, now, events);
    }
}

function isWormVirusTargetingActive (snake, now = Date.now())
{
    return !!snake && snake.power === 'worm_virus' && now < snake.wormVirusTargetingUntil;
}

function startWormVirusTargeting (snake, state, now, events)
{
    if (now < snake.wormVirusCooldownUntil)
    {
        return;
    }

    snake.wormVirusStoredSize = Math.max(getSnakeSize(snake), 1);
    snake.wormVirusCooldownUntil = now + (state.config.wormVirusCooldownSec * 1000);
    snake.wormVirusTargetingUntil = now + WORM_VIRUS_TARGETING_DURATION_MS;
    snake.wormVirusTeleportPending = true;
    snake.wormVirusArrivalSegmentsRemaining = 0;
    snake.wormVirusArrivalNextAt = 0;
    snake.wormVirusTargetX = snake.x;
    snake.wormVirusTargetY = snake.y;
    events.push({ type: 'score_popup', x: snake.x, y: snake.y - 30, label: 'WORM VIRUS', color: snake.color });
}

function processWormVirusState (state, dt, now, inputDirections, events)
{
    for (const snake of state.snakes)
    {
        if (!snake.alive || snake.power !== 'worm_virus')
        {
            continue;
        }

        if (now < snake.wormVirusTargetingUntil)
        {
            const desired = inputDirections.get(snake.id);
            if (desired)
            {
                snake.wormVirusTargetX = clamp(
                    snake.wormVirusTargetX + (desired.x * state.config.wormVirusCameraMoveSpeed * dt),
                    0,
                    WORLD_WIDTH
                );
                snake.wormVirusTargetY = clamp(
                    snake.wormVirusTargetY + (desired.y * state.config.wormVirusCameraMoveSpeed * dt),
                    0,
                    WORLD_HEIGHT
                );
            }

            continue;
        }

        if (snake.wormVirusTeleportPending)
        {
            finalizeWormVirusTeleport(snake, state, now, events);
        }
    }
}

function finalizeWormVirusTeleport (snake, state, now, events)
{
    const restoredSize = Math.max(1, Math.floor(snake.wormVirusStoredSize || getSnakeSize(snake)));

    snake.segments = [];
    snake.wormVirusTargetingUntil = 0;
    snake.wormVirusTeleportPending = false;
    snake.x = snake.wormVirusTargetX;
    snake.y = snake.wormVirusTargetY;
    snake.size = 1;
    snake.history = createInitialHistory(
        snake.x,
        snake.y,
        snake.direction,
        state.config.segmentSpacing,
        snake.power,
        state.config.tortueSegmentSpacingMultiplier,
        state.config.tortueHeadGapSegments
    );
    snake.wormVirusArrivalSegmentsRemaining = Math.max(0, restoredSize - 1);
    snake.wormVirusArrivalNextAt = now + WORM_VIRUS_ARRIVAL_STEP_MS;
    snake.selfCollisionGraceRemainingMs = Math.max(snake.selfCollisionGraceRemainingMs || 0, 700);
    events.push({ type: 'score_popup', x: snake.x, y: snake.y - 24, label: 'TELEPORT', color: snake.color });
}

function processWormVirusArrival (snake, now)
{
    if (!snake.alive || snake.wormVirusArrivalSegmentsRemaining <= 0)
    {
        return;
    }

    while (snake.wormVirusArrivalSegmentsRemaining > 0 && now >= snake.wormVirusArrivalNextAt)
    {
        changeSize(snake, 1);
        snake.wormVirusArrivalSegmentsRemaining -= 1;
        snake.wormVirusArrivalNextAt += WORM_VIRUS_ARRIVAL_STEP_MS;
    }

    if (snake.wormVirusArrivalSegmentsRemaining <= 0)
    {
        snake.wormVirusArrivalNextAt = 0;
        snake.wormVirusStoredSize = 0;
    }
}

function spawnPoisonProjectile (snake, state)
{
    const direction = snake.direction;
    if (!direction || (!direction.x && !direction.y))
    {
        return;
    }

    if (!Array.isArray(state.poisonProjectiles))
    {
        state.poisonProjectiles = [];
    }

    state.poisonProjectiles.push({
        ownerId: snake.id,
        x: snake.x,
        y: snake.y,
        direction: { ...direction },
        traveled: 0,
        maxDistance: state.config.cracheurShotDistance
    });
}

function updatePoisonProjectiles (state, dt, now, events)
{
    if (!Array.isArray(state.poisonProjectiles) || state.poisonProjectiles.length === 0)
    {
        return;
    }

    for (let index = state.poisonProjectiles.length - 1; index >= 0; index--)
    {
        const projectile = state.poisonProjectiles[index];
        const stepDistance = CRACHEUR_PROJECTILE_SPEED * dt;

        projectile.x += projectile.direction.x * stepDistance;
        projectile.y += projectile.direction.y * stepDistance;
        projectile.traveled += stepDistance;

        if (
            projectile.traveled >= projectile.maxDistance ||
            projectile.x < 0 ||
            projectile.x > WORLD_WIDTH ||
            projectile.y < 0 ||
            projectile.y > WORLD_HEIGHT
        )
        {
            state.poisonProjectiles.splice(index, 1);
            continue;
        }

        let hasHitSnake = false;
        for (const snake of state.snakes)
        {
            if (!snake.alive || snake.id === projectile.ownerId)
            {
                continue;
            }

            const bodyHit = snake.segments.some((segment, segmentIndex) => {
                if (distanceBetween(projectile.x, projectile.y, segment.x, segment.y) <= (HEAD_RADIUS - 2) + CRACHEUR_PROJECTILE_RADIUS)
                {
                    return true;
                }

                if (segmentIndex > 0)
                {
                    const previous = snake.segments[segmentIndex - 1];
                    return distancePointToSegment(
                        projectile.x,
                        projectile.y,
                        previous.x,
                        previous.y,
                        segment.x,
                        segment.y
                    ) <= (HEAD_RADIUS - 4) + CRACHEUR_PROJECTILE_RADIUS;
                }

                return false;
            });

            if (distanceBetween(projectile.x, projectile.y, snake.x, snake.y) <= HEAD_RADIUS + CRACHEUR_PROJECTILE_RADIUS || bodyHit)
            {
                snake.paralyzedUntil = Math.max(
                    snake.paralyzedUntil || 0,
                    now + (state.config.cracheurParalysisDurationSec * 1000)
                );
                events.push({ type: 'score_popup', x: snake.x, y: snake.y - 24, label: 'PARALYSE!', color: snake.color });
                state.poisonProjectiles.splice(index, 1);
                hasHitSnake = true;
                break;
            }
        }

        if (hasHitSnake)
        {
            continue;
        }
    }
}

function truncateSnakeAt (snake, startIndex, state, now, events)
{
    if (!snake.alive)
    {
        return;
    }

    const { config } = state;
    const canTriggerLizard = snake.power === 'lezard' && now >= snake.lizardCooldownUntil;

    if (canTriggerLizard)
    {
        snake.lizardBoostUntil = now + config.lizardBoostDurationSec * 1000;
        snake.lizardCooldownUntil = now + config.lizardCooldownSec * 1000;
        events.push({ type: 'score_popup', x: snake.x, y: snake.y - 30, label: 'LEZARD!', color: snake.color });
        events.push({ type: 'lezard_boost', snakeId: snake.id });
    }

    const firstSeg = snake.segments[startIndex];

    if (firstSeg)
    {
        events.push({ type: 'impact_flash', x: firstSeg.x, y: firstSeg.y, major: false });
    }

    const removed = snake.segments.splice(startIndex);
    const removedCount = removed.length;

    for (const seg of removed)
    {
        const o = { id: state._nextOrangeId++, x: seg.x, y: seg.y };
        state.oranges.push(o);
        events.push({ type: 'orange_spawned', id: o.id, x: o.x, y: o.y });
    }

    changeSize(snake, -removedCount);

    if (canTriggerLizard && removedCount > 0)
    {
        snake.pendingLizardRestoreSegments = removedCount;
        snake.pendingLizardRestoreAt = now + config.lizardBoostDurationSec * 1000;
    }

    snake.history.length = getTargetHistoryLength(
        getSnakeSize(snake),
        snake.power,
        config.segmentSpacing,
        config.tortueSegmentSpacingMultiplier,
        config.tortueHeadGapSegments
    );
}

// ---------------------------------------------------------------------------
// Lezard deferred restore
// ---------------------------------------------------------------------------

function processPendingLizardRestore (snake, now, events)
{
    if (!snake.alive || snake.pendingLizardRestoreSegments <= 0)
    {
        return;
    }

    if (now < snake.pendingLizardRestoreAt)
    {
        return;
    }

    const added = snake.pendingLizardRestoreSegments;
    changeSize(snake, added);
    events.push({ type: 'score_popup', x: snake.x, y: snake.y - 36, label: `QUEUE +${added}`, color: snake.color });
    events.push({ type: 'lezard_restored', snakeId: snake.id, added });
    snake.pendingLizardRestoreSegments = 0;
    snake.pendingLizardRestoreAt = 0;
}

// ---------------------------------------------------------------------------
// Victory condition
// ---------------------------------------------------------------------------

function checkVictoryCondition (state, events)
{
    if (state.isGameOver)
    {
        return;
    }

    const aliveSnakes = state.snakes.filter((s) => s.alive || s.phoenixRespawnPending);
    const aliveLocalPlayers = state.snakes.filter((s) => s.isLocalHuman && (s.alive || s.phoenixRespawnPending));

    // All local players dead
    if (state.snakes.some((s) => s.isLocalHuman) && aliveLocalPlayers.length === 0)
    {
        applyPlacementBonuses(state);

        const best = state.snakes
            .filter((s) => s.isLocalHuman)
            .reduce((prev, cur) => (cur.score > prev.score ? cur : prev), { name: 'Joueur', score: 0 });

        state.isGameOver = true;
        state.winnerName = best.name;
        state.finalScore = best.score;
        events.push({ type: 'game_over', reason: 'eliminated', winnerName: best.name, score: best.score });
        return;
    }

    // Last snake standing (local player wins)
    if (aliveLocalPlayers.length === 1 && aliveSnakes.length === 1 && aliveSnakes[0] === aliveLocalPlayers[0])
    {
        const winner = aliveLocalPlayers[0];
        applyPlacementBonuses(state);
        const timeBonus = computeVictoryTimeBonus(state.elapsedTimeMs);
        winner.score += timeBonus;
        
        state.isGameOver = true;
        state.winnerName = winner.name;
        state.finalScore = winner.score;
        
        events.push({ type: 'game_over', reason: 'victory', winnerName: winner.name, score: winner.score, timeBonus });
    }
}

function computeVictoryTimeBonus (elapsedTimeMs)
{
    const clampedElapsed = clamp(elapsedTimeMs, 0, TIME_VICTORY_BONUS_WINDOW_MS);
    const ratio = 1 - (clampedElapsed / TIME_VICTORY_BONUS_WINDOW_MS);
    return Math.max(0, Math.round(TIME_VICTORY_BONUS_MAX * ratio));
}

function applyPlacementBonuses (state)
{
    const rankedSnakes = state.snakes
        .slice()
        .sort((left, right) => {
            const leftActive = left.alive || left.phoenixRespawnPending;
            const rightActive = right.alive || right.phoenixRespawnPending;

            if (leftActive !== rightActive)
            {
                return leftActive ? -1 : 1;
            }

            return right.score - left.score;
        });

    const applyBonusAt = (index, baseBonus) => {
        const snake = rankedSnakes[index];
        if (!snake)
        {
            return;
        }

        addScore(snake, baseBonus, state.config);
    };

    applyBonusAt(0, PLACEMENT_BONUS_1ST);
    applyBonusAt(1, PLACEMENT_BONUS_2ND);
    applyBonusAt(2, PLACEMENT_BONUS_3RD);
}

// ---------------------------------------------------------------------------
// Bot AI (pure)
// ---------------------------------------------------------------------------

function updateBotDirection (snake, state, now)
{
    const { config } = state;
    const level = snake.botLevel !== null ? snake.botLevel : DEFAULT_BOT_LEVEL;
    const useDanger = config.botUseDanger >= 1;
    const visionRange = level >= 10 ? Infinity : (level + 1) * config.botVisionUnit;
    const nearestOrange = findNearestOrangeTargetForBot(snake, state, visionRange);
    const nearestPredator = findNearestPredatorForBot(snake, state, visionRange, now);
    const nearestPrey = findNearestPreyForBot(snake, state, visionRange, now);
    const closePredator = !!nearestPredator && nearestPredator.distance <= config.botClosePreyDistance;
    const aggressiveMode = level >= config.botAggressivityActiveLevel;
    const aiState = closePredator
        ? 'evade_danger'
        : (aggressiveMode && nearestPrey ? 'hunt_prey' : 'forage_orange');
    const target = resolveBotStateTarget(snake, aiState, nearestOrange, nearestPrey);
    const dangerActive = useDanger && closePredator;
    const dangerWeight = dangerActive ? (1.5 + level * 0.25) : 0;
    const trapWeight = dangerActive ? (1.2 + level * 0.35) : 0;
    const rejectDangerThreshold = dangerActive
        ? getRejectDangerThreshold(level, config.botDangerThreshold)
        : Number.MAX_SAFE_INTEGER;
    const fleeVector = nearestPredator
        ? { x: snake.x - nearestPredator.snake.x, y: snake.y - nearestPredator.snake.y }
        : null;
    const fleeLen = fleeVector ? (Math.hypot(fleeVector.x, fleeVector.y) || 1) : 1;
    const fleeNorm = fleeVector ? { x: fleeVector.x / fleeLen, y: fleeVector.y / fleeLen } : null;
    const stateAttractionBase = aiState === 'hunt_prey' ? 320 : (aiState === 'evade_danger' ? 240 : 220);
    const orangeAssistWeight = aiState === 'evade_danger' ? 120 : 0;
    const preyAttractBoost = aiState === 'hunt_prey' ? (100 + (config.botHuntFerocity * 50)) : 0;

    const candidates = DIRECTIONS
        .filter((d) => !((d.x + snake.direction.x === 0) && (d.y + snake.direction.y === 0)))
        .map((d) =>
        {
            const risk = getDirectionRisk(snake, d, state, now);
            const trapRisk = dangerActive ? getTrapRisk(snake, d, level, state, now) : 0;
            const combinedDanger = risk * dangerWeight + trapRisk * trapWeight;

            if (risk === Number.MAX_SAFE_INTEGER)
            {
                return { direction: d, score: -Number.MAX_SAFE_INTEGER, combinedDanger: Number.MAX_SAFE_INTEGER };
            }

            let attraction = 0;

            if (target)
            {
                const dx = target.x - snake.x;
                const dy = target.y - snake.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                attraction = (d.x * (dx / len) + d.y * (dy / len)) * stateAttractionBase + preyAttractBoost;

                if (dangerActive && combinedDanger > rejectDangerThreshold)
                {
                    attraction = 0;
                }
            }

            if (aiState === 'evade_danger' && fleeNorm)
            {
                attraction += (d.x * fleeNorm.x + d.y * fleeNorm.y) * 260;

                if (nearestOrange)
                {
                    const odx = nearestOrange.x - snake.x;
                    const ody = nearestOrange.y - snake.y;
                    const olen = Math.hypot(odx, ody) || 1;
                    attraction += (d.x * (odx / olen) + d.y * (ody / olen)) * orangeAssistWeight;
                }
            }

            attraction -= getWallPenaltyForDirection(snake, d, state);

            const noise = level < 4 ? randomBetween(-40, 40) * (4 - level) : 0;

            return { direction: d, score: attraction - combinedDanger + noise, combinedDanger };
        })
        .sort((a, b) => b.score - a.score);

    if (candidates.length === 0)
    {
        return;
    }

    const safeCandidates = candidates
        .filter((c) => c.combinedDanger !== Number.MAX_SAFE_INTEGER)
        .sort((a, b) => a.combinedDanger - b.combinedDanger);

    if (safeCandidates.length === 0)
    {
        return;
    }

    if (dangerActive && target && candidates[0].combinedDanger > rejectDangerThreshold)
    {
        snake.direction = safeCandidates[0].direction;
        return;
    }

    snake.direction = candidates[0].direction;
}

function getRejectDangerThreshold (level, baseDangerThreshold)
{
    if (level >= 7)
    {
        const progress = Math.min(1, (level - 7) / 3);
        return Math.round(baseDangerThreshold + (BOT_DANGER_THRESHOLD_MIN - baseDangerThreshold) * progress);
    }

    return baseDangerThreshold;
}

function getBotPerceivedSize (snake)
{
    const logicalSize = getSnakeSize(snake);

    if (snake.power === 'leurre')
    {
        return Math.min(LEURRE_VISUAL_MAX_SIZE, logicalSize);
    }

    if (snake.power === 'sphinx')
    {
        return logicalSize + Math.max(0, Math.floor(snake.sphinxVisualSizeBonus || 0));
    }

    return logicalSize;
}

function isSnakeVisibleToBot (snake, other, visionRange, now)
{
    if (!other?.alive)
    {
        return false;
    }

    if (other !== snake && other.power === 'cameleon' && now < other.cameleonInvisibleUntil)
    {
        return false;
    }

    if (visionRange === Infinity)
    {
        return true;
    }

    return distanceBetween(snake.x, snake.y, other.x, other.y) <= visionRange;
}

function getNearestContactDistanceToSnake (snake, other)
{
    let best = distanceBetween(snake.x, snake.y, other.x, other.y);

    for (const segment of other.segments)
    {
        const distance = distanceBetween(snake.x, snake.y, segment.x, segment.y);
        if (distance < best)
        {
            best = distance;
        }
    }

    return best;
}

function findNearestOrangeTargetForBot (snake, state, visionRange)
{
    let best = null;

    for (const orange of state.oranges)
    {
        const distance = distanceBetween(snake.x, snake.y, orange.x, orange.y);
        if (distance > visionRange)
        {
            continue;
        }

        if (!best || distance < best.distance)
        {
            best = { x: orange.x, y: orange.y, distance };
        }
    }

    return best;
}

function findNearestPredatorForBot (snake, state, visionRange, now)
{
    const selfSize = getBotPerceivedSize(snake);
    let best = null;

    for (const other of state.snakes)
    {
        if (other === snake || !isSnakeVisibleToBot(snake, other, visionRange, now))
        {
            continue;
        }

        if (getBotPerceivedSize(other) <= selfSize)
        {
            continue;
        }

        const distance = getNearestContactDistanceToSnake(snake, other);
        if (!best || distance < best.distance)
        {
            best = { snake: other, distance };
        }
    }

    return best;
}

function findNearestPreyForBot (snake, state, visionRange, now)
{
    const selfSize = getBotPerceivedSize(snake);
    let best = null;

    for (const other of state.snakes)
    {
        if (other === snake || !isSnakeVisibleToBot(snake, other, visionRange, now))
        {
            continue;
        }

        if (getBotPerceivedSize(other) >= selfSize)
        {
            continue;
        }

        const distance = distanceBetween(snake.x, snake.y, other.x, other.y);
        if (!best || distance < best.distance)
        {
            best = { snake: other, distance };
        }
    }

    return best;
}

function resolveBotStateTarget (snake, aiState, nearestOrange, nearestPrey)
{
    if (aiState === 'hunt_prey' && nearestPrey?.snake)
    {
        const prey = nearestPrey.snake;

        if (nearestPrey.distance > 220 && prey.segments.length > 0)
        {
            let bestSegment = prey.segments[0];
            let bestDistance = distanceBetween(snake.x, snake.y, bestSegment.x, bestSegment.y);

            for (const segment of prey.segments)
            {
                const distance = distanceBetween(snake.x, snake.y, segment.x, segment.y);
                if (distance < bestDistance)
                {
                    bestDistance = distance;
                    bestSegment = segment;
                }
            }

            return { x: bestSegment.x, y: bestSegment.y };
        }

        return { x: prey.x, y: prey.y };
    }

    if (nearestOrange)
    {
        return { x: nearestOrange.x, y: nearestOrange.y };
    }

    return null;
}

function getWallPenaltyForDirection (snake, direction, state)
{
    const nextX = snake.x + (direction.x * state.config.botLookAhead);
    const nextY = snake.y + (direction.y * state.config.botLookAhead);
    const borderDistance = Math.min(nextX, WORLD_WIDTH - nextX, nextY, WORLD_HEIGHT - nextY);

    if (borderDistance <= 40)
    {
        return 420;
    }

    if (borderDistance < 140)
    {
        return (140 - borderDistance) * 2;
    }

    return 0;
}

function getPreferredDirections (snake, target)

    const dx = target.x - snake.x;
    const dy = target.y - snake.y;
    const hFirst = Math.abs(dx) >= Math.abs(dy);

    return (hFirst
        ? [{ x: dx >= 0 ? 1 : -1, y: 0 }, { x: 0, y: dy >= 0 ? 1 : -1 }]
        : [{ x: 0, y: dy >= 0 ? 1 : -1 }, { x: dx >= 0 ? 1 : -1, y: 0 }]
    ).filter((d) => !((d.x + snake.direction.x === 0) && (d.y + snake.direction.y === 0)));
}

function getTrapRisk (snake, initialDirection, level, state, now)
{
    const { config } = state;
    const steps = Math.min(6, 2 + Math.floor(level / 2));
    let sx = snake.x;
    let sy = snake.y;
    let currentDir = initialDirection;
    let totalRisk = 0;

    for (let step = 0; step < steps; step++)
    {
        sx += currentDir.x * config.botTrapStep;
        sy += currentDir.y * config.botTrapStep;

        const possible = DIRECTIONS.filter((d) => !((d.x + currentDir.x === 0) && (d.y + currentDir.y === 0)));
        const assessed = possible
            .map((d) => ({ direction: d, risk: getDirectionRiskFromPoint(snake, d, sx, sy, state, now) }))
            .sort((a, b) => a.risk - b.risk);

        const valid = assessed.filter((e) => e.risk !== Number.MAX_SAFE_INTEGER);

        if (valid.length === 0)
        {
            return Number.MAX_SAFE_INTEGER;
        }

        if (valid.length === 1)  { totalRisk += 240; }
        else if (valid.length === 2) { totalRisk += 110; }

        const border = Math.min(sx, WORLD_WIDTH - sx, sy, WORLD_HEIGHT - sy);

        if (border < 140)
        {
            totalRisk += (140 - border) * 1.5;
        }

        totalRisk += valid[0].risk * 0.35;
        currentDir = valid[0].direction;
    }

    return Math.round(totalRisk);
}

function getDirectionRiskFromPoint (snake, direction, originX, originY, state, now)
{
    const nextX = originX + direction.x * state.config.botLookAhead;
    const nextY = originY + direction.y * state.config.botLookAhead;
    const pad = 50;
    const level = snake.botLevel !== null ? snake.botLevel : DEFAULT_BOT_LEVEL;
    const visionRange = level >= 10 ? Infinity : (level + 1) * state.config.botVisionUnit;

    if (nextX <= pad || nextX >= WORLD_WIDTH - pad || nextY <= pad || nextY >= WORLD_HEIGHT - pad)
    {
        return Number.MAX_SAFE_INTEGER;
    }

    let risk = 0;

    for (const other of state.snakes)
    {
        if (!other.alive)
        {
            continue;
        }

        for (let i = 0; i < other.segments.length; i++)
        {
            if (other === snake)
            {
                if (snake.power === 'anguille')
                {
                    continue;
                }

                if (i < 2)
                {
                    continue;
                }
            }

            const seg = other.segments[i];

            if (visionRange !== Infinity)
            {
                const visibilityDistance = distanceBetween(snake.x, snake.y, seg.x, seg.y);
                if (visibilityDistance > visionRange)
                {
                    continue;
                }
            }

            const dist = distanceBetween(nextX, nextY, seg.x, seg.y);

            if (other.power === 'tortue' && dist < 150)
            {
                risk += (150 - dist) * 6;
            }
            else if (other.power === 'diable_cornu' && dist < 120)
            {
                risk += (120 - dist) * 2.5;
            }

            const otherSize = getBotPerceivedSize(other);
            const selfSize = getBotPerceivedSize(snake);
            const wouldDieOnContact = other.power === 'tortue' || (otherSize > selfSize && snake.power !== 'salamandre');

            if (dist <= HEAD_TO_BODY_DISTANCE + 6)
            {
                if (wouldDieOnContact)
                {
                    return Number.MAX_SAFE_INTEGER;
                }

                if (other.power === 'diable_cornu')
                {
                    risk += 260;
                }
            }

            if (dist < 80)
            {
                risk += 80 - dist;
            }
        }

        if (other === snake)
        {
            continue;
        }

        if (!isSnakeVisibleToBot(snake, other, visionRange, now))
        {
            continue;
        }

        const hd = distanceBetween(nextX, nextY, other.x, other.y);

        if (visionRange !== Infinity)
        {
            const visibilityDistance = distanceBetween(snake.x, snake.y, other.x, other.y);
            if (visibilityDistance > visionRange)
            {
                continue;
            }
        }

        if (hd < 72)
        {
            risk += (72 - hd) * (getSnakeSize(other) >= getSnakeSize(snake) ? 8 : 3);
        }
    }

    return Math.round(risk);
}

function getDirectionRisk (snake, direction, state, now)
{
    return getDirectionRiskFromPoint(snake, direction, snake.x, snake.y, state, now);
}
