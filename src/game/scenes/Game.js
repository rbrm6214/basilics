import { EventBus } from '../EventBus';
import { Input, Math as PhaserMath, Scene } from 'phaser';
import { GameAudioEngine } from '../audio/GameAudioEngine';

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const DEFAULT_TOTAL_SNAKES = 10;
const ORANGE_COUNT = 100;
const INITIAL_SCORE = 0;
const INITIAL_SIZE = 4;
const INITIAL_BODY_SEGMENTS = INITIAL_SIZE - 1;
const INITIAL_SPAWN_GROWTH = 3;
const TORTUE_SPEED_MULTIPLIER = 0.6;
const DEFAULT_TORTUE_SEGMENT_SPACING_MULTIPLIER = 3;
const DEFAULT_TORTUE_HEAD_GAP_SEGMENTS = 0.5;
const SELF_COLLISION_NON_LETHAL_SEGMENTS = 3;
const TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS = 5;
const TORTUE_SELF_COLLISION_NON_LETHAL_SEGMENTS_AFTER_SPAWN = 1;
const TORTUE_SELF_COLLISION_GRACE_MS = 1200;
const SNAKE_SPEED = 165;
const DEFAULT_SEGMENT_SPACING = 3;
const HEAD_RADIUS = 10;
const CAMERA_ZOOM = 1.1;
const HIGHSCORE_LIMIT = 10;
const HIGHSCORE_KEY = 'basilics-highscores';
const HEAD_TO_HEAD_DISTANCE = (HEAD_RADIUS * 2) - 2;
const HEAD_TO_BODY_DISTANCE = (HEAD_RADIUS * 2) - 2;
const POPUP_LIFETIME_MS = 520;
const MAJOR_SHAKE_DURATION_MS = 130;
const MAJOR_SHAKE_INTENSITY = 0.006;
const DEFAULT_BOT_LEVEL = 4;
const BOT_VISION_UNIT = 300;
const HUD_EMIT_INTERVAL_MS = 80;
const BOT_LOOK_AHEAD = 200;
const BOT_TRAP_STEP = 80;
const DEFAULT_BOT_DANGER_THRESHOLD = 640;
const BOT_DANGER_THRESHOLD_MIN = 300;
const BOT_DANGER_THRESHOLD_MAX = 1100;
const BOT_USE_DANGER = 1;
const DEFAULT_BOT_AGGRESSIVITY_ACTIVE_LEVEL = 6;
const GAMEPAD_AXIS_DEADZONE = 0.35;
const DEFAULT_KILL_BONUS_THRESHOLD_SIZE = 8;
const DEFAULT_KILL_BONUS_LARGE_SCORE = 25;
const DEFAULT_KILL_BONUS_SMALL_SCORE = 10;
const DEFAULT_CRASH_KILL_BONUS_SCORE = 5;
const DEFAULT_DIABLE_CORNU_SCORE_BONUS = 3;
const DEFAULT_SANS_SCORE_MULTIPLIER = 2;
const PLACEMENT_BONUS_1ST = 100;
const PLACEMENT_BONUS_2ND = 50;
const PLACEMENT_BONUS_3RD = 25;
const DIABLE_CORNU_DAMAGE = 4;
const DEFAULT_LIZARD_BOOST_MULTIPLIER = 2;
const DEFAULT_LIZARD_BOOST_DURATION_SEC = 3;
const DEFAULT_LIZARD_COOLDOWN_SEC = 50;
const DEFAULT_BASILIC_BOOST_MULTIPLIER = 2;
const DEFAULT_BASILIC_BOOST_DURATION_SEC = 2;
const DEFAULT_BASILIC_COOLDOWN_SEC = 30;
const DEFAULT_CAMELEON_INVISIBILITY_DURATION_SEC = 10;
const DEFAULT_CAMELEON_COOLDOWN_SEC = 40;
const DEFAULT_CRACHEUR_SHOT_DISTANCE = 500;
const DEFAULT_CRACHEUR_COOLDOWN_SEC = 45;
const DEFAULT_CRACHEUR_PARALYSIS_DURATION_SEC = 5;
const DEFAULT_MAMBA_BOOST_MULTIPLIER = 2;
const DEFAULT_MAMBA_BOOST_DURATION_SEC = 0.2;
const WORM_VIRUS_TARGETING_DURATION_MS = 5000;
const DEFAULT_WORM_VIRUS_COOLDOWN_SEC = 35;
const DEFAULT_WORM_VIRUS_CAMERA_MOVE_SPEED = 520;
const WORM_VIRUS_ARRIVAL_STEP_MS = 80;
const CRACHEUR_PROJECTILE_SPEED = 620;
const CRACHEUR_PROJECTILE_RADIUS = 5;
const LEURRE_VISUAL_MAX_SIZE = 6;
const DEFAULT_BOA_GROWTH_MULTIPLIER = 2;
const DEFAULT_BOA_SLOW_TARGET_SPEED_MULTIPLIER = 0.8;
const DEFAULT_BOA_SELF_SLOW_SPEED_MULTIPLIER = 0.5;
const DEFAULT_ASPIRATEUR_RADIUS = 80;
const TIME_VICTORY_BONUS_MAX = 500;
const TIME_VICTORY_BONUS_WINDOW_MS = 5 * 60 * 1000;
const PHOENIX_LIVES = 3;
const DEFAULT_PHOENIX_RESPAWN_SCORE_PENALTY = 10;
const PHOENIX_RESPAWN_BONUS_GROWTH = 5;
const PHOENIX_RESPAWN_GROWTH_STEP_MS = 90;
const PHOENIX_RESPAWN_DELAY_MS = 5000;
const DEFAULT_PLAYER_COLORS = [0x2f6bff, 0x7dff7a, 0xff47d7, 0xffe45a];

function generateSnakeColors (count)
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
        if (hue < 60) { r = c; g = x; b = 0; }
        else if (hue < 120) { r = x; g = c; b = 0; }
        else if (hue < 180) { r = 0; g = c; b = x; }
        else if (hue < 240) { r = 0; g = x; b = c; }
        else if (hue < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        const ri = Math.round((r + m) * 255);
        const gi = Math.round((g + m) * 255);
        const bi = Math.round((b + m) * 255);
        colors.push((ri << 16) | (gi << 8) | bi);
    }
    for (let index = 0; index < DEFAULT_PLAYER_COLORS.length && index < colors.length; index++)
    {
        colors[index] = DEFAULT_PLAYER_COLORS[index];
    }

    return colors;
}

const SNAKE_COLORS = generateSnakeColors(100);

const ORANGE_COLOR = 0xff8c00;

const DIRECTIONS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
];

function toHexColor (value)
{
    return `#${value.toString(16).padStart(6, '0')}`;
}

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.snakes = [];
        this.oranges = [];
        this.isGameOver = false;
        this.localPlayer = null;
        this.localPlayers = [];
        this.roster = [];
        this.botTurnDelayMs = 150;
        this.botVisionUnit = BOT_VISION_UNIT;
        this.botLookAhead = BOT_LOOK_AHEAD;
        this.botTrapStep = BOT_TRAP_STEP;
        this.botUseDanger = BOT_USE_DANGER;
        this.setup = null;
        this.playerName = 'Joueur';
        this.elapsedTimeMs = 0;
        this.hudEmitTimer = 0;
        this.segmentSpacing = DEFAULT_SEGMENT_SPACING;
        this.botDangerThreshold = DEFAULT_BOT_DANGER_THRESHOLD;
        this.botAggressivityActiveLevel = DEFAULT_BOT_AGGRESSIVITY_ACTIVE_LEVEL;
        this.matchConfig = null;
        this.maxSnakes = DEFAULT_TOTAL_SNAKES;
        this.extraCameras = [];
        this.cameraSlotSnakeIds = [];
        this.viewportCache = [];
        this.initialScore = INITIAL_SCORE;
        this.initialSize = INITIAL_SIZE;
        this.phoenixRespawnScorePenalty = DEFAULT_PHOENIX_RESPAWN_SCORE_PENALTY;
        this.orangeScoreGain = 1;
        this.orangeSizeGain = 1;
        this.boaGrowthMultiplier = DEFAULT_BOA_GROWTH_MULTIPLIER;
        this.boaSlowTargetSpeedMultiplier = DEFAULT_BOA_SLOW_TARGET_SPEED_MULTIPLIER;
        this.boaSelfSlowSpeedMultiplier = DEFAULT_BOA_SELF_SLOW_SPEED_MULTIPLIER;
        this.aspirateurRadius = DEFAULT_ASPIRATEUR_RADIUS;
        this.killBonusThresholdSize = DEFAULT_KILL_BONUS_THRESHOLD_SIZE;
        this.killBonusLargeScore = DEFAULT_KILL_BONUS_LARGE_SCORE;
        this.killBonusSmallScore = DEFAULT_KILL_BONUS_SMALL_SCORE;
        this.crashKillBonusScore = DEFAULT_CRASH_KILL_BONUS_SCORE;
        this.diableCornuScoreBonus = DEFAULT_DIABLE_CORNU_SCORE_BONUS;
        this.sansScoreMultiplier = DEFAULT_SANS_SCORE_MULTIPLIER;
        this.lizardBoostMultiplier = DEFAULT_LIZARD_BOOST_MULTIPLIER;
        this.lizardBoostDurationSec = DEFAULT_LIZARD_BOOST_DURATION_SEC;
        this.lizardCooldownSec = DEFAULT_LIZARD_COOLDOWN_SEC;
        this.basilicBoostMultiplier = DEFAULT_BASILIC_BOOST_MULTIPLIER;
        this.basilicBoostDurationSec = DEFAULT_BASILIC_BOOST_DURATION_SEC;
        this.basilicCooldownSec = DEFAULT_BASILIC_COOLDOWN_SEC;
        this.cameleonInvisibilityDurationSec = DEFAULT_CAMELEON_INVISIBILITY_DURATION_SEC;
        this.cameleonCooldownSec = DEFAULT_CAMELEON_COOLDOWN_SEC;
        this.cracheurShotDistance = DEFAULT_CRACHEUR_SHOT_DISTANCE;
        this.cracheurCooldownSec = DEFAULT_CRACHEUR_COOLDOWN_SEC;
        this.cracheurParalysisDurationSec = DEFAULT_CRACHEUR_PARALYSIS_DURATION_SEC;
        this.mambaBoostMultiplier = DEFAULT_MAMBA_BOOST_MULTIPLIER;
        this.mambaBoostDurationSec = DEFAULT_MAMBA_BOOST_DURATION_SEC;
        this.wormVirusCooldownSec = DEFAULT_WORM_VIRUS_COOLDOWN_SEC;
        this.wormVirusCameraMoveSpeed = DEFAULT_WORM_VIRUS_CAMERA_MOVE_SPEED;
        this.tortueSegmentSpacingMultiplier = DEFAULT_TORTUE_SEGMENT_SPACING_MULTIPLIER;
        this.tortueHeadGapSegments = DEFAULT_TORTUE_HEAD_GAP_SEGMENTS;
        this.poisonProjectiles = [];
        this.phoenixCountdownTexts = [];
        this.playerScoreHudTexts = [];
        this.audioEngine = null;
    }

    getSnakeSize (snake)
    {
        return Number.isFinite(snake?.size)
            ? Math.max(1, Math.floor(snake.size))
            : Math.max(1, (snake?.segments?.length || 0) + 1);
    }

    addScore (snake, amount)
    {
        const baseAmount = Math.max(0, Math.floor(amount));
        if (baseAmount <= 0)
        {
            return;
        }

        const multiplier = snake.power === 'sans' ? this.sansScoreMultiplier : 1;
        snake.score += baseAmount * multiplier;
    }

    changeSize (snake, delta)
    {
        const currentSize = this.getSnakeSize(snake);
        snake.size = Math.max(0, currentSize + Math.floor(delta));
    }

    init (data)
    {
        this.matchConfig = (data && data.matchConfig) ? data.matchConfig : null;
        this.setup = this.matchConfig || ((data && data.localSetup) ? data.localSetup : null);

        const gameplay = this.setup?.gameplay || {};
        const botSettings = this.setup?.botSettings || {};

        this.maxSnakes = Number.isFinite(this.setup?.maxSnakes)
            ? Math.max(1, Math.floor(this.setup.maxSnakes))
            : DEFAULT_TOTAL_SNAKES;
        this.segmentSpacing = Number.isFinite(gameplay.segmentSpacing)
            ? Math.max(1, Math.floor(gameplay.segmentSpacing))
            : (Number.isFinite(this.setup?.espacement)
                ? Math.max(1, Math.floor(this.setup.espacement))
                : DEFAULT_SEGMENT_SPACING);
        this.botTurnDelayMs = Number.isFinite(gameplay.botTurnDelayMs)
            ? PhaserMath.Clamp(Math.floor(gameplay.botTurnDelayMs), 50, 1000)
            : (Number.isFinite(botSettings.turnDelayMs)
                ? PhaserMath.Clamp(Math.floor(botSettings.turnDelayMs), 50, 1000)
                : 250);
        this.botVisionUnit = Number.isFinite(gameplay.botVisionUnit)
            ? PhaserMath.Clamp(Math.floor(gameplay.botVisionUnit), 50, 800)
            : (Number.isFinite(botSettings.visionUnit)
                ? PhaserMath.Clamp(Math.floor(botSettings.visionUnit), 50, 800)
                : BOT_VISION_UNIT);
        this.botLookAhead = Number.isFinite(gameplay.botLookAhead)
            ? PhaserMath.Clamp(Math.floor(gameplay.botLookAhead), 20, 400)
            : (Number.isFinite(botSettings.lookAhead)
                ? PhaserMath.Clamp(Math.floor(botSettings.lookAhead), 20, 400)
                : BOT_LOOK_AHEAD);
        this.botTrapStep = Number.isFinite(gameplay.botTrapStep)
            ? PhaserMath.Clamp(Math.floor(gameplay.botTrapStep), 20, 300)
            : (Number.isFinite(botSettings.trapStep)
                ? PhaserMath.Clamp(Math.floor(botSettings.trapStep), 20, 300)
                : BOT_TRAP_STEP);
        this.botUseDanger = Number.isFinite(gameplay.botUseDanger)
            ? PhaserMath.Clamp(Math.floor(gameplay.botUseDanger), 0, 1)
            : (Number.isFinite(botSettings.useDanger)
                ? PhaserMath.Clamp(Math.floor(botSettings.useDanger), 0, 1)
                : 1);
        this.botClosePreyDistance = Number.isFinite(gameplay.botClosePreyDistance)
            ? PhaserMath.Clamp(Math.floor(gameplay.botClosePreyDistance), 100, 600)
            : (Number.isFinite(botSettings.closePreyDistance)
                ? PhaserMath.Clamp(Math.floor(botSettings.closePreyDistance), 100, 600)
                : 300);
        this.botHuntFerocity = Number.isFinite(gameplay.botHuntFerocity)
            ? PhaserMath.Clamp(Number(gameplay.botHuntFerocity), 0, 3)
            : (Number.isFinite(botSettings.huntFerocity)
                ? PhaserMath.Clamp(Number(botSettings.huntFerocity), 0, 3)
                : 1);
        this.botDangerThreshold = Number.isFinite(botSettings.dangerThreshold)
            ? PhaserMath.Clamp(Math.floor(botSettings.dangerThreshold), BOT_DANGER_THRESHOLD_MIN, BOT_DANGER_THRESHOLD_MAX)
            : (Number.isFinite(gameplay.botDangerThreshold)
                ? PhaserMath.Clamp(Math.floor(gameplay.botDangerThreshold), BOT_DANGER_THRESHOLD_MIN, BOT_DANGER_THRESHOLD_MAX)
                : (Number.isFinite(this.setup?.seuilDanger)
                    ? PhaserMath.Clamp(Math.floor(this.setup.seuilDanger), BOT_DANGER_THRESHOLD_MIN, BOT_DANGER_THRESHOLD_MAX)
                    : DEFAULT_BOT_DANGER_THRESHOLD));
        this.botAggressivityActiveLevel = Number.isFinite(botSettings.aggressivityActiveLevel)
            ? PhaserMath.Clamp(Math.floor(botSettings.aggressivityActiveLevel), 1, 11)
            : (Number.isFinite(gameplay.botAggressivityActiveLevel)
                ? PhaserMath.Clamp(Math.floor(gameplay.botAggressivityActiveLevel), 1, 11)
                : (Number.isFinite(this.setup?.['agressivité_active_niveau'])
                    ? PhaserMath.Clamp(Math.floor(this.setup['agressivité_active_niveau']), 1, 11)
                    : DEFAULT_BOT_AGGRESSIVITY_ACTIVE_LEVEL));
        this.lizardBoostMultiplier = Number.isFinite(gameplay.lizardBoostMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.lizardBoostMultiplier), 1.2, 4)
            : DEFAULT_LIZARD_BOOST_MULTIPLIER;
        this.lizardBoostDurationSec = Number.isFinite(gameplay.lizardBoostDurationSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.lizardBoostDurationSec), 1, 15)
            : DEFAULT_LIZARD_BOOST_DURATION_SEC;
        this.lizardCooldownSec = Number.isFinite(gameplay.lizardCooldownSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.lizardCooldownSec), 5, 120)
            : DEFAULT_LIZARD_COOLDOWN_SEC;
        this.basilicBoostMultiplier = Number.isFinite(gameplay.basilicBoostMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.basilicBoostMultiplier), 1.2, 4)
            : DEFAULT_BASILIC_BOOST_MULTIPLIER;
        this.basilicBoostDurationSec = Number.isFinite(gameplay.basilicBoostDurationSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.basilicBoostDurationSec), 1, 15)
            : DEFAULT_BASILIC_BOOST_DURATION_SEC;
        this.basilicCooldownSec = Number.isFinite(gameplay.basilicCooldownSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.basilicCooldownSec), 5, 120)
            : DEFAULT_BASILIC_COOLDOWN_SEC;
        this.cameleonInvisibilityDurationSec = Number.isFinite(gameplay.cameleonInvisibilityDurationSec)
            ? PhaserMath.Clamp(Number(gameplay.cameleonInvisibilityDurationSec), 1, 30)
            : DEFAULT_CAMELEON_INVISIBILITY_DURATION_SEC;
        this.cameleonCooldownSec = Number.isFinite(gameplay.cameleonCooldownSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.cameleonCooldownSec), 5, 120)
            : DEFAULT_CAMELEON_COOLDOWN_SEC;
        this.cracheurShotDistance = Number.isFinite(gameplay.cracheurShotDistance)
            ? PhaserMath.Clamp(Math.floor(gameplay.cracheurShotDistance), 1, 4000)
            : DEFAULT_CRACHEUR_SHOT_DISTANCE;
        this.cracheurCooldownSec = Number.isFinite(gameplay.cracheurCooldownSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.cracheurCooldownSec), 5, 120)
            : DEFAULT_CRACHEUR_COOLDOWN_SEC;
        this.cracheurParalysisDurationSec = Number.isFinite(gameplay.cracheurParalysisDurationSec)
            ? PhaserMath.Clamp(Number(gameplay.cracheurParalysisDurationSec), 1, 20)
            : DEFAULT_CRACHEUR_PARALYSIS_DURATION_SEC;
        this.mambaBoostMultiplier = Number.isFinite(gameplay.mambaBoostMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.mambaBoostMultiplier), 1.1, 5)
            : DEFAULT_MAMBA_BOOST_MULTIPLIER;
        this.mambaBoostDurationSec = Number.isFinite(gameplay.mambaBoostDurationSec)
            ? PhaserMath.Clamp(Number(gameplay.mambaBoostDurationSec), 0.05, 2)
            : DEFAULT_MAMBA_BOOST_DURATION_SEC;
        this.wormVirusCooldownSec = Number.isFinite(gameplay.wormVirusCooldownSec)
            ? PhaserMath.Clamp(Math.floor(gameplay.wormVirusCooldownSec), 5, 120)
            : DEFAULT_WORM_VIRUS_COOLDOWN_SEC;
        this.wormVirusCameraMoveSpeed = Number.isFinite(gameplay.wormVirusCameraMoveSpeed)
            ? PhaserMath.Clamp(Math.floor(gameplay.wormVirusCameraMoveSpeed), 120, 1800)
            : DEFAULT_WORM_VIRUS_CAMERA_MOVE_SPEED;
        this.initialScore = Number.isFinite(gameplay.initialScore)
            ? Math.max(0, Math.floor(gameplay.initialScore))
            : INITIAL_SCORE;
        this.initialSize = Number.isFinite(gameplay.initialSize)
            ? Math.max(1, Math.floor(gameplay.initialSize))
            : INITIAL_SIZE;
        this.phoenixRespawnScorePenalty = Number.isFinite(gameplay.phoenixRespawnScorePenalty)
            ? Math.max(0, Math.floor(gameplay.phoenixRespawnScorePenalty))
            : (Number.isFinite(gameplay.phoenixRespawnScore)
                ? Math.max(0, Math.floor(gameplay.phoenixRespawnScore))
                : DEFAULT_PHOENIX_RESPAWN_SCORE_PENALTY);
        this.orangeScoreGain = Number.isFinite(gameplay.orangeScoreGain)
            ? Math.max(0, Math.floor(gameplay.orangeScoreGain))
            : 1;
        this.orangeSizeGain = Number.isFinite(gameplay.orangeSizeGain)
            ? Math.max(0, Math.floor(gameplay.orangeSizeGain))
            : 1;
        this.boaGrowthMultiplier = Number.isFinite(gameplay.boaGrowthMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.boaGrowthMultiplier), 1, 5)
            : DEFAULT_BOA_GROWTH_MULTIPLIER;
        this.boaSlowTargetSpeedMultiplier = Number.isFinite(gameplay.boaSlowTargetSpeedMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.boaSlowTargetSpeedMultiplier), 0.1, 1)
            : DEFAULT_BOA_SLOW_TARGET_SPEED_MULTIPLIER;
        this.boaSelfSlowSpeedMultiplier = Number.isFinite(gameplay.boaSelfSlowSpeedMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.boaSelfSlowSpeedMultiplier), 0.1, 1)
            : DEFAULT_BOA_SELF_SLOW_SPEED_MULTIPLIER;
        this.aspirateurRadius = Number.isFinite(gameplay.aspirateurRadius)
            ? PhaserMath.Clamp(Math.floor(gameplay.aspirateurRadius), 20, 250)
            : DEFAULT_ASPIRATEUR_RADIUS;
        this.killBonusThresholdSize = Number.isFinite(gameplay.killBonusThresholdSize)
            ? Math.max(1, Math.floor(gameplay.killBonusThresholdSize))
            : DEFAULT_KILL_BONUS_THRESHOLD_SIZE;
        this.killBonusLargeScore = Number.isFinite(gameplay.killBonusLargeScore)
            ? Math.max(0, Math.floor(gameplay.killBonusLargeScore))
            : DEFAULT_KILL_BONUS_LARGE_SCORE;
        this.killBonusSmallScore = Number.isFinite(gameplay.killBonusSmallScore)
            ? Math.max(0, Math.floor(gameplay.killBonusSmallScore))
            : DEFAULT_KILL_BONUS_SMALL_SCORE;
        this.crashKillBonusScore = Number.isFinite(gameplay.crashKillBonusScore)
            ? Math.max(0, Math.floor(gameplay.crashKillBonusScore))
            : DEFAULT_CRASH_KILL_BONUS_SCORE;
        this.diableCornuScoreBonus = Number.isFinite(gameplay.diableCornuScoreBonus)
            ? Math.max(0, Math.floor(gameplay.diableCornuScoreBonus))
            : DEFAULT_DIABLE_CORNU_SCORE_BONUS;
        this.sansScoreMultiplier = Number.isFinite(gameplay.sansScoreMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.sansScoreMultiplier), 1, 10)
            : DEFAULT_SANS_SCORE_MULTIPLIER;
        this.tortueSegmentSpacingMultiplier = Number.isFinite(gameplay.tortueSegmentSpacingMultiplier)
            ? PhaserMath.Clamp(Number(gameplay.tortueSegmentSpacingMultiplier), 1, 3)
            : DEFAULT_TORTUE_SEGMENT_SPACING_MULTIPLIER;
        this.tortueHeadGapSegments = Number.isFinite(gameplay.tortueHeadGapSegments)
            ? PhaserMath.Clamp(Number(gameplay.tortueHeadGapSegments), 0, 6)
            : DEFAULT_TORTUE_HEAD_GAP_SEGMENTS;
    }

    create ()
    {
        this.isGameOver = false;
        this.snakes = [];
        this.oranges = [];
        this.localPlayer = null;
        this.localPlayers = [];
        this.poisonProjectiles = [];
        this.resetPhoenixHudState();
        this.roster = [];
        this.elapsedTimeMs = 0;
        this.hudEmitTimer = 0;
        this.audioEngine = GameAudioEngine.get();
        this.audioEngine.ensureStarted();
        this.audioEngine.startMusic();

        this.events.once('shutdown', () => {
            this.destroyAllPoisonProjectiles();
            this.resetPhoenixHudState({ destroyTexts: true });
            this.audioEngine?.stopMusic();
        });
        this.events.once('destroy', () => {
            this.destroyAllPoisonProjectiles();
            this.resetPhoenixHudState({ destroyTexts: true });
            this.audioEngine?.stopMusic();
        });

        this.cameras.main.setBackgroundColor(0x102030);
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setZoom(CAMERA_ZOOM);
        this.cameras.main.setRoundPixels(true);

        this.drawWorldBounds();
        this.createOranges(ORANGE_COUNT);

        this.roster = this.buildRoster();
        this.maxSnakes = this.roster.length;
        const spawnPoints = this.createUniformSpawnPoints(this.maxSnakes);

        for (let index = 0; index < this.roster.length; index++)
        {
            const snake = this.createSnake(this.roster[index], spawnPoints[index]);
            this.snakes.push(snake);

            if (snake.isLocalHuman)
            {
                this.localPlayers.push(snake);

                if (!this.localPlayer)
                {
                    this.localPlayer = snake;
                }
            }
        }

        this.localPlayers.sort((leftSnake, rightSnake) => leftSnake.playerSlot - rightSnake.playerSlot);
        this.localPlayer = this.localPlayers[0] || this.localPlayer;
        this.createSnakeViewerLabels();
        this.snakes.forEach((snake) => this.updateSnakeSegments(snake));

        this.playerName = this.localPlayer?.name || 'Joueur';

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D,Z,Q');
        this.ijkl = this.input.keyboard.addKeys('I,J,K,L');
        this.actionKeys = this.input.keyboard.addKeys('E,U,O');
        this.ctrlKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.CTRL);
        this.shiftKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SHIFT);
        this.restartKey = this.input.keyboard.addKey('R');

        this.input.once('pointerdown', () => {
            this.audioEngine?.ensureStarted();
        });
        this.input.keyboard.once('keydown', () => {
            this.audioEngine?.ensureStarted();
        });

        this.endPanel = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            Math.min(680, this.scale.width - 40),
            240,
            0x000000,
            0.78
        ).setScrollFactor(0).setDepth(1100).setVisible(false);

        this.endText = this.add.text(this.scale.width / 2, this.scale.height / 2, '', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1200).setVisible(false);

        this.configureLocalCameras(this.scale.width, this.scale.height);

        this.scale.on('resize', this.handleResize, this);

        this.emitHudUpdate();

        EventBus.emit('current-scene-ready', this);
    }

    update (_, delta)
    {
        if (this.isGameOver)
        {
            if (Input.Keyboard.JustDown(this.restartKey))
            {
                this.scene.start('LocalSetup');
            }

            return;
        }

        this.elapsedTimeMs += delta;
        this.processPendingPhoenixRespawns();

        const dt = delta / 1000;

        for (const snake of this.snakes)
        {
            if (!snake.alive)
            {
                continue;
            }

            snake.boaSlowedByEnemy = false;
            snake.boaSelfEntangled = false;
            snake.boaOnEnemyBody = false;

            if (this.processWormVirusState(snake, dt))
            {
                this.updateSnakeScoreLabel(snake);
                continue;
            }

            if (snake.isPlayer)
            {
                this.updatePlayerDirection(snake);
            }
            else
            {
                this.updateBotDirection(snake, delta);
            }
        }

        this.updateBoaBodyContactEffects();

        for (const snake of this.snakes)
        {
            if (!snake.alive)
            {
                continue;
            }

            if (this.isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
            {
                continue;
            }

            this.moveSnake(snake, dt);
        }

        this.resolveSnakeCollisions();
        this.updatePoisonProjectiles(delta);

        for (const snake of this.snakes)
        {
            if (!snake.alive)
            {
                continue;
            }

            if (this.isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
            {
                this.applyBoaContactVisualState(snake);
                this.updateSnakeScoreLabel(snake);
                continue;
            }

            this.handleOrangeCollection(snake);
            this.processPendingLizardRestore(snake);
            this.processPhoenixArrivalGrowth(snake);
            this.processWormVirusArrival(snake);
            this.updateSnakeSegments(snake);
            this.applyBoaContactVisualState(snake);
            this.updateSnakeScoreLabel(snake);
        }

        this.refreshCameraTargets();
        this.updateCameleonVisibilityForCameras();
        this.updatePhoenixRespawnCountdowns();
        this.syncScoreHudPositionsAndVisibility();
        this.updatePlayerScoreHudTexts();

        this.updateHud(delta);
    }

    buildRoster ()
    {
        const roster = [];
        const humans = Array.isArray(this.setup?.humanPlayers) && this.setup.humanPlayers.length > 0
            ? this.setup.humanPlayers
            : [{
                id: 'player-1',
                name: this.setup?.playerName || 'Joueur',
                snakeColorIndex: Number.isFinite(this.setup?.playerSnakeIndex) ? this.setup.playerSnakeIndex : 0,
                input: 'keyboard-zqsd',
                isLocal: true
            }];
        const botLevelMap = {};
        const configuredBotLevels = this.setup?.botSettings?.levelsBySnake || this.setup?.botLevels || [];

        for (const entry of configuredBotLevels)
        {
            botLevelMap[entry.snakeIndex] = entry.level;
        }

        const normalizedHumans = humans.map((player, index) => {
            const snakeIndex = PhaserMath.Clamp(
                Number.isFinite(player?.playerSlot) ? Math.floor(player.playerSlot) : index,
                0,
                this.maxSnakes - 1
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
                isPlayer: human.isLocal,
                isLocalHuman: human.isLocal,
                inputProfile: human.input,
                power: human.power,
                playerSlot: human.playerSlot,
                colorIndex: human.snakeColorIndex,
                botLevel: null
            };
        }

        const extraBotDefaultLevel = Number.isFinite(this.setup?.botSettings?.extraBotDefaultLevel)
            ? PhaserMath.Clamp(Math.floor(this.setup.botSettings.extraBotDefaultLevel), 1, 10)
            : (Number.isFinite(this.setup?.botSettings?.defaultLevel)
                ? PhaserMath.Clamp(Math.floor(this.setup.botSettings.defaultLevel), 1, 10)
                : DEFAULT_BOT_LEVEL);

        for (let snakeIndex = 0; snakeIndex < this.maxSnakes; snakeIndex++)
        {
            if (roster[snakeIndex])
            {
                continue;
            }

            roster[snakeIndex] = {
                id: `bot-${snakeIndex + 1}`,
                name: `Bot ${snakeIndex + 1}`,
                type: 'bot',
                isPlayer: false,
                isLocalHuman: false,
                inputProfile: null,
                power: 'anguille',
                playerSlot: Number.MAX_SAFE_INTEGER,
                colorIndex: snakeIndex,
                botLevel: botLevelMap[snakeIndex] !== undefined ? botLevelMap[snakeIndex] : extraBotDefaultLevel
            };
        }

        return roster;
    }
    createSnake (snakeConfig, spawn)
    {
        const color = SNAKE_COLORS[snakeConfig.colorIndex % SNAKE_COLORS.length];
        const head = this.add.circle(spawn.x, spawn.y, HEAD_RADIUS, color).setDepth(20);

        const initialDirection = DIRECTIONS[spawn.directionIndex % DIRECTIONS.length];
        const segments = [];

        const power = snakeConfig.power || 'sans';

        const snake = {
            id: snakeConfig.id,
            type: snakeConfig.type,
            name: snakeConfig.name,
            isPlayer: snakeConfig.isPlayer,
            isLocalHuman: snakeConfig.isLocalHuman,
            inputProfile: snakeConfig.inputProfile,
            playerSlot: Number.isFinite(snakeConfig.playerSlot) ? snakeConfig.playerSlot : Number.MAX_SAFE_INTEGER,
            power,
            color,
            alive: true,
            score: this.initialScore,
            size: this.initialSize,
            lastKoContext: null,
            head,
            segments,
            viewerLabels: [],
            direction: { ...initialDirection },
            turnCooldown: 0,
            botLevel: snakeConfig.botLevel,
            lizardBoostUntil: 0,
            lizardCooldownUntil: 0,
            basilicBoostUntil: 0,
            basilicCooldownUntil: 0,
            cameleonInvisibleUntil: 0,
            cameleonCooldownUntil: 0,
            cracheurCooldownUntil: 0,
            paralyzedUntil: 0,
            mambaBoostUntil: 0,
            sphinxVisualSizeBonus: power === 'sphinx' ? Math.max(0, this.initialSize - 1) : 0,
            boaSlowedByEnemy: false,
            boaSelfEntangled: false,
            boaOnEnemyBody: false,
            wormVirusCooldownUntil: 0,
            wormVirusTargetingUntil: 0,
            wormVirusTeleportPending: false,
            wormVirusStoredSize: 0,
            wormVirusArrivalSegmentsRemaining: 0,
            wormVirusArrivalNextAt: 0,
            wormVirusTargetAnchor: this.add.zone(spawn.x, spawn.y, 2, 2),
            livesRemaining: power === 'phoenix' ? PHOENIX_LIVES : 1,
            phoenixRespawnPending: false,
            phoenixRespawnAtMs: 0,
            phoenixRespawnX: 0,
            phoenixRespawnY: 0,
            phoenixRespawnDirection: null,
            phoenixRespawnAnchor: this.add.zone(spawn.x, spawn.y, 2, 2),
            phoenixArrivalGrowthRemaining: INITIAL_SPAWN_GROWTH,
            phoenixArrivalGrowthNextAt: this.time.now + PHOENIX_RESPAWN_GROWTH_STEP_MS,
            selfCollisionGraceRemainingMs: power === 'tortue' ? TORTUE_SELF_COLLISION_GRACE_MS : 0,
            pendingLizardRestoreSegments: 0,
            pendingLizardRestoreAt: 0,
            history: this.createInitialHistory(spawn, initialDirection, power)
        };

        return snake;
    }

    createSnakeViewerLabels ()
    {
        const viewerCount = Math.max(1, this.localPlayers.length);

        for (const snake of this.snakes)
        {
            snake.viewerLabels = [];

            for (let viewerIndex = 0; viewerIndex < viewerCount; viewerIndex++)
            {
                const label = this.add.text(snake.head.x, snake.head.y - 40, '', {
                    fontFamily: 'Arial Black',
                    fontSize: 13,
                    color: toHexColor(snake.color),
                    stroke: '#111111',
                    strokeThickness: 4,
                    align: 'center'
                }).setOrigin(0.5).setDepth(30);

                snake.viewerLabels.push(label);
            }

            this.updateSnakeScoreLabel(snake);
        }
    }

    getEffectiveSegmentSpacing (snake)
    {
        const isTortue = snake.power === 'tortue';
        return isTortue
            ? Math.max(1, Math.floor(this.segmentSpacing * this.tortueSegmentSpacingMultiplier))
            : this.segmentSpacing;
    }

    getHeadGapSegments (snake)
    {
        return snake.power === 'tortue' ? this.tortueHeadGapSegments : 0;
    }

    getTargetHistoryLength (snake)
    {
        const spacing = this.getEffectiveSegmentSpacing(snake);
        const headGap = this.getHeadGapSegments(snake);
        return Math.max(250, Math.ceil((this.getSnakeSize(snake) + 10 + headGap) * spacing));
    }

    createInitialHistory (spawn, direction, power = 'sans')
    {
        const isTortue = power === 'tortue';
        const spacing = isTortue
            ? Math.max(1, Math.floor(this.segmentSpacing * this.tortueSegmentSpacingMultiplier))
            : this.segmentSpacing;
        const headGap = isTortue ? this.tortueHeadGapSegments : 0;
        const historyLength = Math.max(250, Math.ceil((INITIAL_SIZE + 20 + headGap) * spacing));
        const history = [];

        for (let index = 0; index < historyLength; index++)
        {
            history.push({
                // Keep initial history spacing consistent with segment spacing
                // to avoid immediate self-collision on early growth ticks.
                x: spawn.x - (direction.x * index * spacing),
                y: spawn.y - (direction.y * index * spacing)
            });
        }

        return history;
    }

    createUniformSpawnPoints (count)
    {
        const points = [];
        const centerX = WORLD_WIDTH / 2;
        const centerY = WORLD_HEIGHT / 2;
        const radius = Math.min(WORLD_WIDTH, WORLD_HEIGHT) * 0.35;

        for (let index = 0; index < count; index++)
        {
            const angle = (Math.PI * 2 * index) / count;

            points.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                directionIndex: index % DIRECTIONS.length
            });
        }

        return points;
    }

    updatePlayerDirection (snake)
    {
        if (this.time.now < snake.paralyzedUntil)
        {
            return;
        }

        const desired = this.getDesiredDirectionForProfile(snake.inputProfile);

        if (!desired)
        {
            this.tryTriggerActionPower(snake);
            return;
        }

        if ((desired.x + snake.direction.x === 0) && (desired.y + snake.direction.y === 0))
        {
            return;
        }

        snake.direction = desired;
        this.tryTriggerActionPower(snake);
    }

    getDesiredDirectionForProfile (inputProfile)
    {
        if (inputProfile === 'joypad-1')
        {
            return this.getDirectionFromGamepad(0);
        }

        if (inputProfile === 'joypad-2')
        {
            return this.getDirectionFromGamepad(1);
        }

        if (inputProfile === 'keyboard-ijkl' || inputProfile === 'keyboard-2')
        {
            if (this.ijkl.J.isDown)
            {
                return { x: -1, y: 0 };
            }
            if (this.ijkl.L.isDown)
            {
                return { x: 1, y: 0 };
            }
            if (this.ijkl.I.isDown)
            {
                return { x: 0, y: -1 };
            }
            if (this.ijkl.K.isDown)
            {
                return { x: 0, y: 1 };
            }
            return null;
        }

        if (inputProfile === 'keyboard-zqsd')
        {
            if (this.wasd.A.isDown || this.wasd.Q.isDown)
            {
                return { x: -1, y: 0 };
            }
            if (this.wasd.D.isDown)
            {
                return { x: 1, y: 0 };
            }
            if (this.wasd.W.isDown || this.wasd.Z.isDown)
            {
                return { x: 0, y: -1 };
            }
            if (this.wasd.S.isDown)
            {
                return { x: 0, y: 1 };
            }
            return null;
        }

        if (inputProfile === 'keyboard-arrows' || inputProfile === 'keyboard-1')
        {
            if (this.cursors.left.isDown)
            {
                return { x: -1, y: 0 };
            }
            if (this.cursors.right.isDown)
            {
                return { x: 1, y: 0 };
            }
            if (this.cursors.up.isDown)
            {
                return { x: 0, y: -1 };
            }
            if (this.cursors.down.isDown)
            {
                return { x: 0, y: 1 };
            }
            return null;
        }

        if (this.cursors.left.isDown || this.wasd.A.isDown || this.wasd.Q.isDown)
        {
            return { x: -1, y: 0 };
        }
        if (this.cursors.right.isDown || this.wasd.D.isDown)
        {
            return { x: 1, y: 0 };
        }
        if (this.cursors.up.isDown || this.wasd.W.isDown || this.wasd.Z.isDown)
        {
            return { x: 0, y: -1 };
        }
        if (this.cursors.down.isDown || this.wasd.S.isDown)
        {
            return { x: 0, y: 1 };
        }

        return null;
    }

    tryTriggerActionPower (snake)
    {
        if (!this.isActionPressedForProfile(snake.inputProfile) || this.time.now < snake.paralyzedUntil)
        {
            return;
        }

        if (snake.power === 'basilic')
        {
            if (this.time.now < snake.basilicCooldownUntil)
            {
                return;
            }

            snake.basilicBoostUntil = this.time.now + (this.basilicBoostDurationSec * 1000);
            snake.basilicCooldownUntil = this.time.now + (this.basilicCooldownSec * 1000);
            this.showScorePopup(snake.head.x, snake.head.y - 30, 'BASILIC!', snake.color);
            return;
        }

        if (snake.power === 'cameleon')
        {
            if (this.time.now < snake.cameleonCooldownUntil)
            {
                return;
            }

            snake.cameleonInvisibleUntil = this.time.now + (this.cameleonInvisibilityDurationSec * 1000);
            snake.cameleonCooldownUntil = this.time.now + (this.cameleonCooldownSec * 1000);
            this.showScorePopup(snake.head.x, snake.head.y - 30, 'CAMOUFLAGE!', snake.color);
            return;
        }

        if (snake.power === 'cracheur')
        {
            if (this.time.now < snake.cracheurCooldownUntil)
            {
                return;
            }

            this.spawnPoisonProjectile(snake);
            snake.cracheurCooldownUntil = this.time.now + (this.cracheurCooldownSec * 1000);
            this.showScorePopup(snake.head.x, snake.head.y - 30, 'CRACHE!', snake.color);
            return;
        }

        if (snake.power === 'worm_virus')
        {
            this.startWormVirusTargeting(snake);
        }
    }

    isActionPressedForProfile (inputProfile)
    {
        if (inputProfile === 'keyboard-zqsd')
        {
            return Input.Keyboard.JustDown(this.wasd.A) || Input.Keyboard.JustDown(this.actionKeys.E);
        }

        if (inputProfile === 'keyboard-ijkl' || inputProfile === 'keyboard-2')
        {
            return Input.Keyboard.JustDown(this.actionKeys.U) || Input.Keyboard.JustDown(this.actionKeys.O);
        }

        if (inputProfile === 'keyboard-arrows' || inputProfile === 'keyboard-1')
        {
            return Input.Keyboard.JustDown(this.ctrlKey) || Input.Keyboard.JustDown(this.shiftKey);
        }

        if (inputProfile === 'joypad-1')
        {
            return this.isGamepadActionPressed(0);
        }

        if (inputProfile === 'joypad-2')
        {
            return this.isGamepadActionPressed(1);
        }

        return false;
    }

    isGamepadActionPressed (padIndex)
    {
        const pad = this.input?.gamepad?.getPad ? this.input.gamepad.getPad(padIndex) : null;
        if (!pad || !pad.connected)
        {
            return false;
        }

        const buttonA = pad.buttons?.[0];
        const buttonB = pad.buttons?.[1];
        const isPressed = (button) => !!(button && (button.pressed || button.isDown || button.value > 0.5));
        return isPressed(buttonA) || isPressed(buttonB);
    }

    getDirectionFromGamepad (padIndex)
    {
        const pad = this.input?.gamepad?.getPad ? this.input.gamepad.getPad(padIndex) : null;

        if (!pad || !pad.connected)
        {
            return null;
        }

        const leftButton = pad.left || pad.buttons?.[14];
        const rightButton = pad.right || pad.buttons?.[15];
        const upButton = pad.up || pad.buttons?.[12];
        const downButton = pad.down || pad.buttons?.[13];

        const isPressed = (button) => !!(button && (button.pressed || button.isDown || button.value > 0.5));

        if (isPressed(leftButton))
        {
            return { x: -1, y: 0 };
        }

        if (isPressed(rightButton))
        {
            return { x: 1, y: 0 };
        }

        if (isPressed(upButton))
        {
            return { x: 0, y: -1 };
        }

        if (isPressed(downButton))
        {
            return { x: 0, y: 1 };
        }

        const axisX = pad.axes?.[0]?.getValue ? pad.axes[0].getValue() : (pad.axes?.[0]?.value ?? pad.axes?.[0] ?? 0);
        const axisY = pad.axes?.[1]?.getValue ? pad.axes[1].getValue() : (pad.axes?.[1]?.value ?? pad.axes?.[1] ?? 0);

        if (Math.abs(axisX) > Math.abs(axisY) && Math.abs(axisX) >= GAMEPAD_AXIS_DEADZONE)
        {
            return axisX < 0 ? { x: -1, y: 0 } : { x: 1, y: 0 };
        }

        if (Math.abs(axisY) >= GAMEPAD_AXIS_DEADZONE)
        {
            return axisY < 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
        }

        return null;
    }

    updateBotDirection (snake, delta)
    {
        if (this.time.now < snake.paralyzedUntil)
        {
            return;
        }

        snake.turnCooldown -= delta;

        if (snake.turnCooldown > 0)
        {
            return;
        }

        snake.turnCooldown = this.botTurnDelayMs;

        const level = snake.botLevel !== null ? snake.botLevel : DEFAULT_BOT_LEVEL;
        const useDanger = this.botUseDanger >= 1;
        const visionRange = level >= 10 ? Infinity : (level + 1) * this.botVisionUnit;
        const nearestOrange = this.findNearestOrangeTargetForBot(snake, visionRange);
        const nearestPredator = this.findNearestPredatorForBot(snake, visionRange);
        const nearestPrey = this.findNearestPreyForBot(snake, visionRange);
        const closePredator = !!nearestPredator && nearestPredator.distance <= this.botClosePreyDistance;
        const aggressiveMode = level >= this.botAggressivityActiveLevel;
        const state = closePredator
            ? 'evade_danger'
            : (aggressiveMode && nearestPrey ? 'hunt_prey' : 'forage_orange');
        const target = this.resolveBotStateTarget(snake, state, nearestOrange, nearestPrey);
        const dangerActive = useDanger && closePredator;
        const dangerWeight = dangerActive ? (1.5 + (level * 0.25)) : 0;
        const trapWeight = dangerActive ? (1.2 + (level * 0.35)) : 0;
        const rejectDangerThreshold = dangerActive ? this.getRejectDangerThreshold(level) : Number.MAX_SAFE_INTEGER;
        const fleeVector = nearestPredator
            ? {
                x: snake.head.x - nearestPredator.snake.head.x,
                y: snake.head.y - nearestPredator.snake.head.y
            }
            : null;
        const fleeLen = fleeVector ? (Math.hypot(fleeVector.x, fleeVector.y) || 1) : 1;
        const fleeNorm = fleeVector ? { x: fleeVector.x / fleeLen, y: fleeVector.y / fleeLen } : null;
        const stateAttractionBase = state === 'hunt_prey' ? 320 : (state === 'evade_danger' ? 240 : 220);
        const orangeAssistWeight = state === 'evade_danger' ? 120 : 0;
        const preyAttractBoost = state === 'hunt_prey' ? (100 + (this.botHuntFerocity * 50)) : 0;

        const candidates = [...DIRECTIONS]
            .filter((direction) => !((direction.x + snake.direction.x === 0) && (direction.y + snake.direction.y === 0)))
            .map((direction) => {
                const risk = this.getDirectionRisk(snake, direction);
                const trapRisk = dangerActive ? this.getTrapRisk(snake, direction, level) : 0;
                const combinedDanger = (risk * dangerWeight) + (trapRisk * trapWeight);

                if (risk === Number.MAX_SAFE_INTEGER)
                {
                    return {
                        direction,
                        score: -Number.MAX_SAFE_INTEGER,
                        combinedDanger: Number.MAX_SAFE_INTEGER
                    };
                }

                let attraction = 0;

                if (target)
                {
                    const dx = target.x - snake.head.x;
                    const dy = target.y - snake.head.y;
                    const len = Math.sqrt((dx * dx) + (dy * dy)) || 1;
                    attraction = ((direction.x * (dx / len)) + (direction.y * (dy / len))) * stateAttractionBase + preyAttractBoost;

                    if (dangerActive && combinedDanger > rejectDangerThreshold)
                    {
                        attraction = 0;
                    }
                }

                if (state === 'evade_danger' && fleeNorm)
                {
                    attraction += ((direction.x * fleeNorm.x) + (direction.y * fleeNorm.y)) * 260;

                    if (nearestOrange)
                    {
                        const odx = nearestOrange.x - snake.head.x;
                        const ody = nearestOrange.y - snake.head.y;
                        const olen = Math.hypot(odx, ody) || 1;
                        attraction += ((direction.x * (odx / olen)) + (direction.y * (ody / olen))) * orangeAssistWeight;
                    }
                }

                attraction -= this.getWallPenaltyForDirection(snake, direction);

                // Bots de bas niveau : injection d'aleatoire pour paraître moins efficaces
                const noise = level < 4 ? PhaserMath.Between(-40, 40) * (4 - level) : 0;

                return {
                    direction,
                    score: attraction - combinedDanger + noise,
                    combinedDanger
                };
            })
            .sort((left, right) => right.score - left.score);

        if (candidates.length === 0)
        {
            return;
        }

        const safeCandidates = candidates
            .filter((candidate) => candidate.combinedDanger !== Number.MAX_SAFE_INTEGER)
            .sort((left, right) => left.combinedDanger - right.combinedDanger);

        if (safeCandidates.length === 0)
        {
            return;
        }

        const bestCandidate = candidates[0];
        const safestCandidate = safeCandidates[0];

        if (dangerActive && target && bestCandidate.combinedDanger > rejectDangerThreshold)
        {
            snake.direction = safestCandidate.direction;
            return;
        }

        snake.direction = bestCandidate.direction;
    }

    getBotPerceivedSize (snake)
    {
        const logicalSize = this.getSnakeSize(snake);

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

    isSnakeVisibleToBot (snake, other, visionRange)
    {
        if (!other?.alive)
        {
            return false;
        }

        if (other !== snake && other.power === 'cameleon' && this.time.now < other.cameleonInvisibleUntil)
        {
            return false;
        }

        if (visionRange === Infinity)
        {
            return true;
        }

        const headDistance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, other.head.x, other.head.y);
        return headDistance <= visionRange;
    }

    getNearestContactDistanceToSnake (snake, other)
    {
        let best = PhaserMath.Distance.Between(snake.head.x, snake.head.y, other.head.x, other.head.y);

        for (const segment of other.segments)
        {
            const distance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, segment.x, segment.y);
            if (distance < best)
            {
                best = distance;
            }
        }

        return best;
    }

    findNearestOrangeTargetForBot (snake, visionRange)
    {
        let best = null;

        for (const orange of this.oranges)
        {
            const distance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, orange.x, orange.y);
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

    findNearestPredatorForBot (snake, visionRange)
    {
        const selfSize = this.getBotPerceivedSize(snake);
        let best = null;

        for (const other of this.snakes)
        {
            if (other === snake || !this.isSnakeVisibleToBot(snake, other, visionRange))
            {
                continue;
            }

            if (this.getBotPerceivedSize(other) <= selfSize)
            {
                continue;
            }

            const distance = this.getNearestContactDistanceToSnake(snake, other);
            if (!best || distance < best.distance)
            {
                best = { snake: other, distance };
            }
        }

        return best;
    }

    findNearestPreyForBot (snake, visionRange)
    {
        const selfSize = this.getBotPerceivedSize(snake);
        let best = null;

        for (const other of this.snakes)
        {
            if (other === snake || !this.isSnakeVisibleToBot(snake, other, visionRange))
            {
                continue;
            }

            if (this.getBotPerceivedSize(other) >= selfSize)
            {
                continue;
            }

            const distance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, other.head.x, other.head.y);
            if (!best || distance < best.distance)
            {
                best = { snake: other, distance };
            }
        }

        return best;
    }

    resolveBotStateTarget (snake, state, nearestOrange, nearestPrey)
    {
        if (state === 'hunt_prey' && nearestPrey?.snake)
        {
            const prey = nearestPrey.snake;

            // If prey keeps distance, cut body lines instead of chasing head endlessly.
            if (nearestPrey.distance > 220 && prey.segments.length > 0)
            {
                let bestSegment = prey.segments[0];
                let bestDistance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, bestSegment.x, bestSegment.y);

                for (const segment of prey.segments)
                {
                    const distance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, segment.x, segment.y);
                    if (distance < bestDistance)
                    {
                        bestDistance = distance;
                        bestSegment = segment;
                    }
                }

                return { x: bestSegment.x, y: bestSegment.y };
            }

            return { x: prey.head.x, y: prey.head.y };
        }

        if (nearestOrange)
        {
            return { x: nearestOrange.x, y: nearestOrange.y };
        }

        return null;
    }

    getWallPenaltyForDirection (snake, direction)
    {
        const nextX = snake.head.x + (direction.x * this.botLookAhead);
        const nextY = snake.head.y + (direction.y * this.botLookAhead);
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

    getRejectDangerThreshold (level)
    {
        const baseThreshold = this.botDangerThreshold;

        // A partir du niveau 7, le seuil diminue progressivement jusqu'au min au niveau 10.
        if (level >= 7)
        {
            const progress = Math.min(1, (level - 7) / 3);
            return Math.round(baseThreshold + ((BOT_DANGER_THRESHOLD_MIN - baseThreshold) * progress));
        }

        return baseThreshold;
    }

    getPreferredDirectionsToTarget (snake, target)
    {
        const dx = target.x - snake.head.x;
        const dy = target.y - snake.head.y;
        const horizontalFirst = Math.abs(dx) >= Math.abs(dy);

        const preferred = horizontalFirst
            ? [
                { x: dx >= 0 ? 1 : -1, y: 0 },
                { x: 0, y: dy >= 0 ? 1 : -1 }
            ]
            : [
                { x: 0, y: dy >= 0 ? 1 : -1 },
                { x: dx >= 0 ? 1 : -1, y: 0 }
            ];

        return preferred.filter((direction) => !((direction.x + snake.direction.x === 0) && (direction.y + snake.direction.y === 0)));
    }

    getTrapRisk (snake, initialDirection, level)
    {
        const steps = Math.min(6, 2 + Math.floor(level / 2));
        let simulatedX = snake.head.x;
        let simulatedY = snake.head.y;
        let currentDirection = initialDirection;
        let totalRisk = 0;

        for (let step = 0; step < steps; step++)
        {
            simulatedX += currentDirection.x * this.botTrapStep;
            simulatedY += currentDirection.y * this.botTrapStep;

            const possibleDirections = DIRECTIONS.filter((direction) => !((direction.x + currentDirection.x === 0) && (direction.y + currentDirection.y === 0)));
            const assessed = possibleDirections
                .map((direction) => ({
                    direction,
                    risk: this.getDirectionRiskFromPoint(snake, direction, simulatedX, simulatedY)
                }))
                .sort((left, right) => left.risk - right.risk);

            const valid = assessed.filter((entry) => entry.risk !== Number.MAX_SAFE_INTEGER);

            if (valid.length === 0)
            {
                return Number.MAX_SAFE_INTEGER;
            }

            if (valid.length === 1)
            {
                totalRisk += 240;
            }
            else if (valid.length === 2)
            {
                totalRisk += 110;
            }

            const borderDistance = Math.min(simulatedX, WORLD_WIDTH - simulatedX, simulatedY, WORLD_HEIGHT - simulatedY);
            if (borderDistance < 140)
            {
                totalRisk += (140 - borderDistance) * 1.5;
            }

            totalRisk += valid[0].risk * 0.35;
            currentDirection = valid[0].direction;
        }

        return Math.round(totalRisk);
    }

    getDirectionRiskFromPoint (snake, direction, originX, originY)
    {
        const nextX = originX + (direction.x * this.botLookAhead);
        const nextY = originY + (direction.y * this.botLookAhead);
        const borderPadding = 50;
        const level = snake.botLevel !== null ? snake.botLevel : DEFAULT_BOT_LEVEL;
        const visionRange = level >= 10 ? Infinity : (level + 1) * this.botVisionUnit;

        if (nextX <= borderPadding || nextX >= WORLD_WIDTH - borderPadding || nextY <= borderPadding || nextY >= WORLD_HEIGHT - borderPadding)
        {
            return Number.MAX_SAFE_INTEGER;
        }

        let risk = 0;

        for (const other of this.snakes)
        {
            if (!other.alive)
            {
                continue;
            }

            for (let index = 0; index < other.segments.length; index++)
            {
                if (other === snake)
                {
                    if (snake.power === 'anguille')
                    {
                        continue;
                    }

                    if (index < 2)
                    {
                        continue;
                    }
                }

                const bodyPart = other.segments[index];

                if (visionRange !== Infinity)
                {
                    const visibilityDistance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, bodyPart.x, bodyPart.y);
                    if (visibilityDistance > visionRange)
                    {
                        continue;
                    }
                }

                const distance = PhaserMath.Distance.Between(nextX, nextY, bodyPart.x, bodyPart.y);

                if (other.power === 'tortue' && distance < 150)
                {
                    risk += (150 - distance) * 6;
                }
                else if (other.power === 'diable_cornu' && distance < 120)
                {
                    risk += (120 - distance) * 2.5;
                }

                const otherSize = this.getBotPerceivedSize(other);
                const selfSize = this.getBotPerceivedSize(snake);
                const wouldDieOnContact = other.power === 'tortue' || (otherSize > selfSize && snake.power !== 'salamandre');

                if (distance <= HEAD_TO_BODY_DISTANCE + 6)
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

                if (distance < 80)
                {
                    risk += (80 - distance);
                }
            }

            if (other === snake)
            {
                continue;
            }

            const headDistance = PhaserMath.Distance.Between(nextX, nextY, other.head.x, other.head.y);
            if (visionRange !== Infinity)
            {
                const visibilityDistance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, other.head.x, other.head.y);
                if (visibilityDistance > visionRange)
                {
                    continue;
                }
            }

            if (headDistance < 72)
            {
                const dangerWeight = this.getSnakeSize(other) >= this.getSnakeSize(snake) ? 8 : 3;
                risk += (72 - headDistance) * dangerWeight;
            }
        }

        return Math.round(risk);
    }

    getDirectionRisk (snake, direction)
    {
        return this.getDirectionRiskFromPoint(snake, direction, snake.head.x, snake.head.y);
    }

    isWormVirusTargetingActive (snake)
    {
        return !!snake && snake.power === 'worm_virus' && this.time.now < snake.wormVirusTargetingUntil;
    }

    getCameraCenterForSnake (snake)
    {
        const slotIndex = this.cameraSlotSnakeIds.findIndex((id) => id === snake.id);
        const cameraIndex = slotIndex >= 0 ? slotIndex : 0;
        const camera = [this.cameras.main, ...this.extraCameras][cameraIndex] || this.cameras.main;
        const worldView = camera?.worldView;

        if (worldView)
        {
            return {
                x: PhaserMath.Clamp(worldView.centerX, 0, WORLD_WIDTH),
                y: PhaserMath.Clamp(worldView.centerY, 0, WORLD_HEIGHT)
            };
        }

        return { x: snake.head.x, y: snake.head.y };
    }

    startWormVirusTargeting (snake)
    {
        if (!snake?.alive || snake.power !== 'worm_virus' || this.time.now < snake.wormVirusCooldownUntil)
        {
            return;
        }

        const center = this.getCameraCenterForSnake(snake);
        snake.wormVirusStoredSize = Math.max(this.getSnakeSize(snake), 1);
        snake.wormVirusCooldownUntil = this.time.now + (this.wormVirusCooldownSec * 1000);
        snake.wormVirusTargetingUntil = this.time.now + WORM_VIRUS_TARGETING_DURATION_MS;
        snake.wormVirusTeleportPending = true;
        snake.wormVirusArrivalSegmentsRemaining = 0;
        snake.wormVirusArrivalNextAt = 0;
        snake.wormVirusTargetAnchor?.setPosition(center.x, center.y);
        snake.head.setVisible(false);

        for (const segment of snake.segments)
        {
            segment.setVisible(false);
        }

        this.showScorePopup(snake.head.x, snake.head.y - 30, 'WORM VIRUS', snake.color);
        this.refreshCameraTargets();
    }

    processWormVirusState (snake, dt)
    {
        if (!snake?.alive || snake.power !== 'worm_virus')
        {
            return false;
        }

        if (this.isWormVirusTargetingActive(snake))
        {
            const desired = this.getDesiredDirectionForProfile(snake.inputProfile);
            const anchor = snake.wormVirusTargetAnchor;
            if (desired && anchor)
            {
                const nextX = anchor.x + (desired.x * this.wormVirusCameraMoveSpeed * dt);
                const nextY = anchor.y + (desired.y * this.wormVirusCameraMoveSpeed * dt);
                anchor.setPosition(
                    PhaserMath.Clamp(nextX, 0, WORLD_WIDTH),
                    PhaserMath.Clamp(nextY, 0, WORLD_HEIGHT)
                );
            }

            return true;
        }

        if (snake.wormVirusTeleportPending)
        {
            this.finalizeWormVirusTeleport(snake);
            return true;
        }

        return false;
    }

    finalizeWormVirusTeleport (snake)
    {
        const anchor = snake.wormVirusTargetAnchor;
        const teleportX = anchor?.x ?? snake.head.x;
        const teleportY = anchor?.y ?? snake.head.y;
        const restoredSize = Math.max(1, Math.floor(snake.wormVirusStoredSize || this.getSnakeSize(snake)));

        for (const segment of snake.segments)
        {
            segment.destroy();
        }
        snake.segments = [];

        snake.wormVirusTargetingUntil = 0;
        snake.wormVirusTeleportPending = false;
        snake.head.setPosition(teleportX, teleportY);
        snake.head.setVisible(true);
        snake.size = 1;
        snake.history = this.createInitialHistory({ x: teleportX, y: teleportY }, snake.direction, snake.power);
        snake.wormVirusArrivalSegmentsRemaining = Math.max(0, restoredSize - 1);
        snake.wormVirusArrivalNextAt = this.time.now + WORM_VIRUS_ARRIVAL_STEP_MS;
        snake.selfCollisionGraceRemainingMs = Math.max(snake.selfCollisionGraceRemainingMs || 0, 700);

        this.updateSnakeSegments(snake);
        this.showScorePopup(teleportX, teleportY - 24, 'TELEPORT', snake.color);
        this.refreshCameraTargets();
    }

    processWormVirusArrival (snake)
    {
        if (!snake?.alive || snake.wormVirusArrivalSegmentsRemaining <= 0)
        {
            return;
        }

        while (snake.wormVirusArrivalSegmentsRemaining > 0 && this.time.now >= snake.wormVirusArrivalNextAt)
        {
            this.changeSize(snake, 1);
            snake.wormVirusArrivalSegmentsRemaining -= 1;
            snake.wormVirusArrivalNextAt += WORM_VIRUS_ARRIVAL_STEP_MS;
        }

        if (snake.wormVirusArrivalSegmentsRemaining <= 0)
        {
            snake.wormVirusArrivalNextAt = 0;
            snake.wormVirusStoredSize = 0;
        }
    }

    triggerMambaBoost (snake)
    {
        if (!snake?.alive || snake.power !== 'mamba')
        {
            return;
        }

        snake.mambaBoostUntil = Math.max(
            snake.mambaBoostUntil || 0,
            this.time.now + (this.mambaBoostDurationSec * 1000)
        );
    }

    updateBoaBodyContactEffects ()
    {
        for (const boa of this.snakes)
        {
            if (!boa.alive || boa.power !== 'boa')
            {
                continue;
            }

            if (this.isWormVirusTargetingActive(boa) || boa.wormVirusTeleportPending)
            {
                continue;
            }

            boa.boaSelfEntangled = this.isBoaSelfBodyContact(boa);

            for (const target of this.snakes)
            {
                if (!target.alive || target === boa)
                {
                    continue;
                }

                if (this.isWormVirusTargetingActive(target) || target.wormVirusTeleportPending)
                {
                    continue;
                }

                if (this.getSnakeSize(boa) <= this.getSnakeSize(target))
                {
                    continue;
                }

                if (this.isBoaBodyOnOtherBody(boa, target))
                {
                    target.boaSlowedByEnemy = true;
                    boa.boaOnEnemyBody = true;
                }
            }
        }
    }

    isBoaBodyOnOtherBody (boa, target)
    {
        if (!boa?.alive || !target?.alive)
        {
            return false;
        }

        if (this.isPointOnSnakeBody(boa.head.x, boa.head.y, target))
        {
            return true;
        }

        for (const segment of boa.segments)
        {
            if (this.isPointOnSnakeBody(segment.x, segment.y, target))
            {
                return true;
            }
        }

        return false;
    }

    isPointOnSnakeBody (px, py, snake)
    {
        for (let index = 0; index < snake.segments.length; index++)
        {
            const bodyPart = snake.segments[index];
            const distance = PhaserMath.Distance.Between(px, py, bodyPart.x, bodyPart.y);

            if (distance <= HEAD_TO_BODY_DISTANCE)
            {
                return true;
            }

            if (index > 0)
            {
                const previous = snake.segments[index - 1];
                const gapDistance = this.distancePointToSegment(
                    px,
                    py,
                    previous.x,
                    previous.y,
                    bodyPart.x,
                    bodyPart.y
                );

                if (gapDistance <= HEAD_TO_BODY_DISTANCE - 2)
                {
                    return true;
                }
            }
        }

        return false;
    }

    isBoaSelfBodyContact (snake)
    {
        if (!snake?.alive || snake.power !== 'boa')
        {
            return false;
        }

        if (snake.phoenixArrivalGrowthRemaining > 0 || snake.selfCollisionGraceRemainingMs > 0)
        {
            return false;
        }

        for (let index = SELF_COLLISION_NON_LETHAL_SEGMENTS; index < snake.segments.length; index++)
        {
            const bodyPart = snake.segments[index];
            const distance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, bodyPart.x, bodyPart.y);

            if (distance <= HEAD_TO_BODY_DISTANCE)
            {
                return true;
            }

            if (index > 0)
            {
                const previous = snake.segments[index - 1];
                const gapDistance = this.distancePointToSegment(
                    snake.head.x,
                    snake.head.y,
                    previous.x,
                    previous.y,
                    bodyPart.x,
                    bodyPart.y
                );

                if (gapDistance <= HEAD_TO_BODY_DISTANCE - 2)
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

                if (this.doSegmentsIntersect(a1, a2, b1, b2))
                {
                    return true;
                }

                const closeA = this.distancePointToSegment(a1.x, a1.y, b1.x, b1.y, b2.x, b2.y);
                const closeB = this.distancePointToSegment(a2.x, a2.y, b1.x, b1.y, b2.x, b2.y);
                if (Math.min(closeA, closeB) <= 8)
                {
                    return true;
                }
            }
        }

        return false;
    }

    doSegmentsIntersect (a1, a2, b1, b2)
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

    applyBoaContactVisualState (snake)
    {
        if (!snake?.alive)
        {
            return;
        }

        const boaOverlay = snake.power === 'boa' && (snake.boaSelfEntangled || snake.boaOnEnemyBody);
        const slowedTarget = snake.boaSlowedByEnemy;

        if (boaOverlay)
        {
            snake.head.setAlpha(0.72);
            snake.head.setScale(1.12);
        }
        else if (slowedTarget)
        {
            snake.head.setAlpha(0.84);
            snake.head.setScale(1);
        }
        else
        {
            snake.head.setAlpha(1);
            snake.head.setScale(1);
        }

        const segmentAlpha = boaOverlay ? 0.62 : (slowedTarget ? 0.78 : 1);
        for (const segment of snake.segments)
        {
            segment.setAlpha(segmentAlpha);
        }
    }

    moveSnake (snake, dt)
    {
        const previousX = snake.head.x;
        const previousY = snake.head.y;
        this.checkVictoryCondition();

        if (this.isGameOver)
        {
            return;
        }

        if (this.time.now < snake.paralyzedUntil)
        {
            // Keep history untouched while paralyzed so the full body stays frozen.
            return;
        }

        const speedMultiplier = (snake.power === 'tortue')
            ? TORTUE_SPEED_MULTIPLIER
            : ((snake.power === 'lezard' && this.time.now < snake.lizardBoostUntil)
                ? this.lizardBoostMultiplier
                : ((snake.power === 'basilic' && this.time.now < snake.basilicBoostUntil)
                    ? this.basilicBoostMultiplier
                    : ((snake.power === 'mamba' && this.time.now < snake.mambaBoostUntil)
                        ? this.mambaBoostMultiplier
                        : 1)));

        let effectiveSpeedMultiplier = speedMultiplier;
        if (snake.boaSlowedByEnemy)
        {
            effectiveSpeedMultiplier *= this.boaSlowTargetSpeedMultiplier;
        }
        if (snake.power === 'boa' && snake.boaSelfEntangled)
        {
            effectiveSpeedMultiplier *= this.boaSelfSlowSpeedMultiplier;
        }

        snake.head.x += snake.direction.x * SNAKE_SPEED * effectiveSpeedMultiplier * dt;
        snake.head.y += snake.direction.y * SNAKE_SPEED * effectiveSpeedMultiplier * dt;

        if (snake.selfCollisionGraceRemainingMs > 0)
        {
            snake.selfCollisionGraceRemainingMs = Math.max(0, snake.selfCollisionGraceRemainingMs - (dt * 1000));
        }

        snake.history.unshift({ x: snake.head.x, y: snake.head.y });

        const targetHistoryLength = this.getTargetHistoryLength(snake);
        if (snake.history.length > targetHistoryLength)
        {
            snake.history.length = targetHistoryLength;
        }

        if (snake.history.length < 2)
        {
            snake.history.push({ x: previousX, y: previousY });
        }
    }

    updateSnakeSegments (snake)
    {
        const logicalSize = this.getSnakeSize(snake);
        const visualSize = snake.power === 'leurre'
            ? Math.min(LEURRE_VISUAL_MAX_SIZE, logicalSize)
            : (snake.power === 'sphinx'
                ? logicalSize + Math.max(0, Math.floor(snake.sphinxVisualSizeBonus || 0))
                : logicalSize);
        const desiredSegmentCount = Math.max(0, visualSize - 1);

        while (snake.segments.length < desiredSegmentCount)
        {
            let segment;
            
            if (snake.power === 'tortue')
            {
                // Tortue: carré
                const size = (HEAD_RADIUS - 2) * 2;
                segment = this.add.rectangle(snake.head.x, snake.head.y, size, size, snake.color, 0.85).setDepth(10);
            }
            else if (snake.power === 'diable_cornu')
            {
                const tri = HEAD_RADIUS - 2;
                segment = this.add.triangle(
                    snake.head.x,
                    snake.head.y,
                    0,
                    -tri,
                    tri,
                    tri,
                    -tri,
                    tri,
                    snake.color,
                    0.85
                ).setDepth(10).setOrigin(0.5, 0.5);
            }
            else
            {
                // Défaut: cercle
                segment = this.add.circle(snake.head.x, snake.head.y, HEAD_RADIUS - 2, snake.color, 0.85).setDepth(10);
            }
            
            snake.segments.push(segment);
        }

        while (snake.segments.length > desiredSegmentCount)
        {
            const removed = snake.segments.pop();
            removed.destroy();
        }

        for (let index = 0; index < snake.segments.length; index++)
        {
            const segmentSpacing = this.getEffectiveSegmentSpacing(snake);
            const headGap = this.getHeadGapSegments(snake);
            const historyIndex = Math.min(
                snake.history.length - 1,
                Math.floor((index + 1 + headGap) * segmentSpacing)
            );
            const historyPoint = snake.history[historyIndex];
            snake.segments[index].setPosition(historyPoint.x, historyPoint.y);
        }
    }

    updateSnakeScoreLabel (snake)
    {
        snake.viewerLabels.forEach((label, viewerIndex) => {
            const isInvisibleForViewer = this.isSnakeCameleonInvisibleForViewer(snake, viewerIndex);
            const viewerSnake = this.getCameraFollowTarget(viewerIndex);
            const viewerHasLunette = viewerSnake?.power === 'lunette' && (viewerSnake.alive || viewerSnake.phoenixRespawnPending);

            if (isInvisibleForViewer)
            {
                if (viewerHasLunette)
                {
                    label.setVisible(snake.alive);
                    label.setText(`Taille: ${this.getSnakeSize(snake)}`);
                    label.setPosition(snake.head.x, snake.head.y - 28);
                }
                else
                {
                    label.setVisible(false);
                }

                return;
            }

            const lines = [snake.name];

            if (this.viewerCanSeeSnakeSize(viewerIndex))
            {
                lines.push(`Taille: ${this.getSnakeSize(snake)}`);
                lines.push(`Pouvoir: ${this.getPowerDisplayName(snake.power)}`);
            }

            if (snake.power === 'lezard')
            {
                const remaining = Math.max(0, Math.ceil((snake.lizardCooldownUntil - this.time.now) / 1000));
                if (remaining > 0)
                {
                    lines.push(`Lezard: ${remaining}s`);
                }
            }

            if (snake.power === 'basilic')
            {
                const remaining = Math.max(0, Math.ceil((snake.basilicCooldownUntil - this.time.now) / 1000));
                if (remaining > 0)
                {
                    lines.push(`Basilic: ${remaining}s`);
                }
            }

            if (snake.power === 'cameleon')
            {
                const remaining = Math.max(0, Math.ceil((snake.cameleonCooldownUntil - this.time.now) / 1000));
                if (remaining > 0)
                {
                    lines.push(`Cameleon: ${remaining}s`);
                }
            }

            if (snake.power === 'cracheur')
            {
                const remaining = Math.max(0, Math.ceil((snake.cracheurCooldownUntil - this.time.now) / 1000));
                if (remaining > 0)
                {
                    lines.push(`Cracheur: ${remaining}s`);
                }
            }

            if (snake.power === 'worm_virus')
            {
                const cooldownRemaining = Math.max(0, Math.ceil((snake.wormVirusCooldownUntil - this.time.now) / 1000));
                if (cooldownRemaining > 0)
                {
                    lines.push(`Worm Virus: ${cooldownRemaining}s`);
                }

                if (this.isWormVirusTargetingActive(snake))
                {
                    const targetingRemaining = Math.max(0, Math.ceil((snake.wormVirusTargetingUntil - this.time.now) / 1000));
                    lines.push(`Ciblage: ${targetingRemaining}s`);
                }
            }

            if (snake.power === 'mamba' && this.time.now < snake.mambaBoostUntil)
            {
                const remaining = Math.max(0, Math.ceil((snake.mambaBoostUntil - this.time.now) / 1000));
                if (remaining > 0)
                {
                    lines.push(`Mamba x${this.mambaBoostMultiplier.toFixed(1)}: ${remaining}s`);
                }
            }

            if (snake.power === 'phoenix')
            {
                lines.push(`Vies: ${snake.livesRemaining}`);
            }

            if (this.time.now < snake.paralyzedUntil)
            {
                const remaining = Math.max(0, Math.ceil((snake.paralyzedUntil - this.time.now) / 1000));
                lines.push(`Paralyse: ${remaining}s`);
            }

            label.setVisible(snake.alive);
            label.setText(lines.join('\n'));
            label.setPosition(snake.head.x, snake.head.y - 40);
        });
    }

    viewerCanSeeSnakeSize (viewerIndex)
    {
        const viewerSnake = this.getCameraFollowTarget(viewerIndex);
        return viewerSnake?.alive === true && viewerSnake.power === 'lunette';
    }

    getPowerDisplayName (power)
    {
        switch (power)
        {
        case 'lunette': return 'Lunette';
        case 'lezard': return 'Lezard';
        case 'anguille': return 'Anguille';
        case 'basilic': return 'Basilic';
        case 'phoenix': return 'Phoenix';
        case 'tortue': return 'Tortue';
        case 'diable_cornu': return 'Diable Cornu';
        case 'cameleon': return 'Cameleon';
        case 'leurre': return 'Leurre';
        case 'cracheur': return 'Cracheur';
        case 'salamandre': return 'Salamandre';
        case 'worm_virus': return 'Worm Virus';
        case 'sphinx': return 'Sphinx';
        case 'boa': return 'Boa';
        case 'aspirateur': return 'Aspirateur';
        case 'mamba': return 'Mamba';
        default: return 'Sans';
        }
    }

    createOranges (count)
    {
        for (let index = 0; index < count; index++)
        {
            this.spawnOrange(this.randomInWorld(20), this.randomInWorld(20, false));
        }
    }

    spawnOrange (x, y, poisoned = false)
    {
        const orange = this.add.circle(x, y, 6, poisoned ? 0xff00ff : ORANGE_COLOR).setDepth(5);
        orange.poisoned = poisoned;
        this.oranges.push(orange);
    }

    randomInWorld (padding, forX = true)
    {
        const min = padding;
        const max = (forX ? WORLD_WIDTH : WORLD_HEIGHT) - padding;
        return PhaserMath.Between(min, max);
    }

    handleOrangeCollection (snake)
    {
        const collectionDistance = HEAD_RADIUS + 6 + (snake.power === 'aspirateur' ? (this.aspirateurRadius * 0.5) : 0);

        for (let index = this.oranges.length - 1; index >= 0; index--)
        {
            const orange = this.oranges[index];

            if (PhaserMath.Distance.Between(snake.head.x, snake.head.y, orange.x, orange.y) <= collectionDistance)
            {
                if (snake.power === 'aspirateur')
                {
                    this.showAspirateurSuctionEffect(orange, snake);
                }

                orange.destroy();
                this.oranges.splice(index, 1);
                this.triggerMambaBoost(snake);

                if (snake.power === 'sphinx')
                {
                    snake.sphinxVisualSizeBonus = Math.max(0, Math.floor(snake.sphinxVisualSizeBonus || 0)) + 1;
                }
                
                if (orange.poisoned)
                {
                    // Poisoned orange: lose 1 segment
                    if (this.getSnakeSize(snake) <= 1)
                    {
                        this.showScorePopup(snake.head.x, snake.head.y - 20, '-1 POISON', snake.color);
                        this.killSnake(snake);
                        continue;
                    }

                    if (snake.segments.length > 0)
                    {
                        const removed = snake.segments.pop();
                        removed.destroy();
                    }

                    this.changeSize(snake, -1);
                    
                    this.showScorePopup(snake.head.x, snake.head.y - 20, '-1 POISON', snake.color);
                }
                else
                {
                    const growthMultiplier = snake.power === 'boa' ? this.boaGrowthMultiplier : 1;
                    const gainedSize = Math.max(0, Math.floor(this.orangeSizeGain * growthMultiplier));
                    this.addScore(snake, this.orangeScoreGain);
                    this.changeSize(snake, gainedSize);
                    this.showScorePopup(snake.head.x, snake.head.y - 20, `+${this.orangeScoreGain}`, snake.color);
                }
                
                this.spawnOrange(this.randomInWorld(20), this.randomInWorld(20, false));

                if (snake.isLocalHuman)
                {
                    this.audioEngine?.playEat();
                }
            }
        }
    }

    showAspirateurSuctionEffect (orange, snake)
    {
        if (!orange || !snake?.head)
        {
            return;
        }

        const suctionOrb = this.add.circle(
            orange.x,
            orange.y,
            6,
            orange.poisoned ? 0xff00ff : ORANGE_COLOR,
            0.92
        ).setDepth(56);

        this.tweens.add({
            targets: suctionOrb,
            x: snake.head.x,
            y: snake.head.y,
            scale: { from: 1, to: 0.28 },
            alpha: { from: 0.92, to: 0 },
            duration: 130,
            ease: 'Cubic.easeIn',
            onComplete: () => suctionOrb.destroy()
        });
    }

    checkWallDeath (snake)
    {
        if (snake.head.x < 0 || snake.head.x > WORLD_WIDTH || snake.head.y < 0 || snake.head.y > WORLD_HEIGHT)
        {
            this.killSnake(snake, { deathContext: { reason: 'wall' } });
        }
    }

    resolveSnakeCollisions ()
    {
        for (const snake of this.snakes)
        {
            if (!snake.alive)
            {
                continue;
            }

            if (this.isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
            {
                continue;
            }

            this.checkWallDeath(snake);

            if (snake.alive)
            {
                this.checkSelfCollision(snake);
            }
        }

        for (let first = 0; first < this.snakes.length; first++)
        {
            const snakeA = this.snakes[first];
            if (!snakeA.alive)
            {
                continue;
            }

            if (this.isWormVirusTargetingActive(snakeA) || snakeA.wormVirusTeleportPending)
            {
                continue;
            }

            for (let second = first + 1; second < this.snakes.length; second++)
            {
                const snakeB = this.snakes[second];
                if (!snakeB.alive)
                {
                    continue;
                }

                if (this.isWormVirusTargetingActive(snakeB) || snakeB.wormVirusTeleportPending)
                {
                    continue;
                }

                const headDistance = PhaserMath.Distance.Between(snakeA.head.x, snakeA.head.y, snakeB.head.x, snakeB.head.y);
                if (headDistance <= HEAD_TO_HEAD_DISTANCE)
                {
                    this.handleHeadToHead(snakeA, snakeB);
                }
            }
        }

        for (let attackerIndex = 0; attackerIndex < this.snakes.length; attackerIndex++)
        {
            const attacker = this.snakes[attackerIndex];
            if (!attacker.alive)
            {
                continue;
            }

            if (this.isWormVirusTargetingActive(attacker) || attacker.wormVirusTeleportPending)
            {
                continue;
            }

            for (let defenderIndex = 0; defenderIndex < this.snakes.length; defenderIndex++)
            {
                if (attackerIndex === defenderIndex)
                {
                    continue;
                }

                const defender = this.snakes[defenderIndex];
                if (!defender.alive)
                {
                    continue;
                }

                if (this.isWormVirusTargetingActive(defender) || defender.wormVirusTeleportPending)
                {
                    continue;
                }

                const hitIndex = this.getBodyHitIndex(attacker, defender);
                if (hitIndex === -1)
                {
                    continue;
                }

                if (attacker.power === 'boa')
                {
                    if (this.getSnakeSize(attacker) > this.getSnakeSize(defender))
                    {
                        break;
                    }

                    const defenderSizeBefore = this.getSnakeSize(defender);
                    this.killSnake(attacker, {
                        deathContext: {
                            reason: 'body_crash',
                            opponent: defender,
                            opponentSize: defenderSizeBefore
                        }
                    });
                    const crashBonus = defender.power === 'sphinx'
                        ? this.crashKillBonusScore * 2
                        : this.crashKillBonusScore;
                    this.addScore(defender, crashBonus);
                    break;
                }

                // Tortue body cannot be crossed or cut: attacker crashes and dies.
                if (defender.power === 'tortue')
                {
                    if (attacker.power === 'salamandre' && this.getSnakeSize(defender) > this.getSnakeSize(attacker))
                    {
                        continue;
                    }

                    const absorbedSize = this.getSnakeSize(attacker);
                    const defenderIsBoa = defender.power === 'boa';
                    const defenderSizeBefore = this.getSnakeSize(defender);
                    this.killSnake(attacker, {
                        spawnOranges: !defenderIsBoa,
                        deathContext: {
                            reason: 'body_crash',
                            opponent: defender,
                            opponentSize: defenderSizeBefore
                        }
                    });
                    const crashBonus = defender.power === 'sphinx'
                        ? this.crashKillBonusScore * 2
                        : this.crashKillBonusScore;
                    this.addScore(defender, crashBonus);

                    if (defenderIsBoa && defender.alive)
                    {
                        this.changeSize(defender, absorbedSize);
                        this.addScore(defender, absorbedSize);
                    }

                    break;
                }

                if (this.getSnakeSize(defender) > this.getSnakeSize(attacker))
                {
                    if (attacker.power === 'salamandre')
                    {
                        continue;
                    }

                    const absorbedSize = this.getSnakeSize(attacker);
                    const defenderIsBoa = defender.power === 'boa';
                    const defenderSizeBefore = this.getSnakeSize(defender);
                    this.killSnake(attacker, {
                        spawnOranges: !defenderIsBoa,
                        deathContext: {
                            reason: 'body_crash',
                            opponent: defender,
                            opponentSize: defenderSizeBefore
                        }
                    });
                    const crashBonus = defender.power === 'sphinx'
                        ? this.crashKillBonusScore * 2
                        : this.crashKillBonusScore;
                    this.addScore(defender, crashBonus);

                    if (defenderIsBoa && defender.alive)
                    {
                        this.changeSize(defender, absorbedSize);
                        this.addScore(defender, absorbedSize);
                    }

                    break;
                }

                if (this.getSnakeSize(attacker) > this.getSnakeSize(defender))
                {
                    // Handle Diable Cornu: attacker loses DIABLE_CORNU_DAMAGE segments
                    if (defender.power === 'diable_cornu')
                    {
                        const damageSegments = Math.min(DIABLE_CORNU_DAMAGE, Math.max(0, this.getSnakeSize(attacker) - 1));
                        for (let d = 0; d < damageSegments; d++)
                        {
                            if (attacker.segments.length > 0)
                            {
                                const removed = attacker.segments.pop();
                                removed.destroy();
                            }
                        }

                        this.changeSize(attacker, -damageSegments);

                        if (this.getSnakeSize(attacker) < 1)
                        {
                            const defenderSizeBefore = this.getSnakeSize(defender);
                            this.killSnake(attacker, {
                                deathContext: {
                                    reason: 'diable_cornu_counter',
                                    opponent: defender,
                                    opponentSize: defenderSizeBefore
                                }
                            });
                            break;
                        }
                        
                        // Defender segments become poisoned oranges
                        const removed = defender.segments.splice(hitIndex);
                        for (const seg of removed)
                        {
                            this.spawnOrange(seg.x, seg.y, true);
                            seg.destroy();
                        }
                        
                        this.addScore(defender, this.diableCornuScoreBonus);
                        this.showScorePopup(attacker.x, attacker.y - 25, `-${damageSegments} POISON!`, attacker.color);
                        
                        if (defender.segments.length <= 0)
                        {
                            const attackerSizeBefore = this.getSnakeSize(attacker);
                            this.killSnake(defender, {
                                deathContext: {
                                    reason: 'cut',
                                    opponent: attacker,
                                    opponentSize: attackerSizeBefore
                                }
                            });
                        }
                    }
                    else
                    {
                        this.triggerMambaBoost(attacker);
                        this.truncateSnakeAt(defender, hitIndex);
                    }
                }

                break;
            }
        }
    }

    checkSelfCollision (snake)
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

        for (let index = nonLethalSegments; index < snake.segments.length; index++)
        {
            const bodyPart = snake.segments[index];
            const distance = PhaserMath.Distance.Between(snake.head.x, snake.head.y, bodyPart.x, bodyPart.y);

            if (distance <= HEAD_TO_BODY_DISTANCE)
            {
                this.killSnake(snake, { deathContext: { reason: 'self_collision' } });
                return;
            }

            if (index > 0)
            {
                const previous = snake.segments[index - 1];
                const gapDistance = this.distancePointToSegment(
                    snake.head.x,
                    snake.head.y,
                    previous.x,
                    previous.y,
                    bodyPart.x,
                    bodyPart.y
                );

                if (gapDistance <= HEAD_TO_BODY_DISTANCE - 2)
                {
                    this.killSnake(snake, { deathContext: { reason: 'self_collision' } });
                    return;
                }
            }
        }
    }

    handleHeadToHead (snakeA, snakeB)
    {
        if (!snakeA.alive || !snakeB.alive)
        {
            return;
        }

        const impactX = (snakeA.head.x + snakeB.head.x) * 0.5;
        const impactY = (snakeA.head.y + snakeB.head.y) * 0.5;
        this.showImpactFlash(impactX, impactY, true);

        if (snakeA.power === 'boa' && snakeB.power === 'boa')
        {
            const sizeA = this.getSnakeSize(snakeA);
            const sizeB = this.getSnakeSize(snakeB);
            this.killSnake(snakeA, { deathContext: { reason: 'head_to_head', opponent: snakeB, opponentSize: sizeB } });
            this.killSnake(snakeB, { deathContext: { reason: 'head_to_head', opponent: snakeA, opponentSize: sizeA } });
            return;
        }

        if (snakeA.power === 'boa' || snakeB.power === 'boa')
        {
            const boaSnake = snakeA.power === 'boa' ? snakeA : snakeB;
            const otherSnake = boaSnake === snakeA ? snakeB : snakeA;
            const absorbedSize = this.getSnakeSize(boaSnake);
            const otherSizeBefore = this.getSnakeSize(otherSnake);
            this.killSnake(boaSnake, {
                spawnOranges: false,
                deathContext: {
                    reason: 'head_to_head',
                    opponent: otherSnake,
                    opponentSize: otherSizeBefore
                }
            });

            if (otherSnake.alive)
            {
                this.changeSize(otherSnake, absorbedSize);
                this.addScore(otherSnake, absorbedSize);
                this.triggerMambaBoost(otherSnake);
            }

            return;
        }

        if (snakeA.score === snakeB.score)
        {
            const sizeA = this.getSnakeSize(snakeA);
            const sizeB = this.getSnakeSize(snakeB);
            this.killSnake(snakeA, { deathContext: { reason: 'head_to_head', opponent: snakeB, opponentSize: sizeB } });
            this.killSnake(snakeB, { deathContext: { reason: 'head_to_head', opponent: snakeA, opponentSize: sizeA } });
            return;
        }

        const bigger = snakeA.score > snakeB.score ? snakeA : snakeB;
        const smaller = bigger === snakeA ? snakeB : snakeA;
        const absorbedSize = this.getSnakeSize(smaller);
        const biggerSizeBefore = this.getSnakeSize(bigger);

        this.killSnake(smaller, {
            spawnOranges: false,
            deathContext: {
                reason: 'head_to_head',
                opponent: bigger,
                opponentSize: biggerSizeBefore
            }
        });

        if (bigger.alive)
        {
            this.changeSize(bigger, absorbedSize);
            this.addScore(bigger, absorbedSize);
            this.triggerMambaBoost(bigger);
            
            // Bonus kill selon la taille de la victime
            if (absorbedSize >= this.killBonusThresholdSize)
            {
                this.addScore(bigger, this.killBonusLargeScore);
                this.showScorePopup(bigger.head.x, bigger.head.y - 25, `+${absorbedSize} +${this.killBonusLargeScore} KILL!`, bigger.color);
            }
            else
            {
                this.addScore(bigger, this.killBonusSmallScore);
                this.showScorePopup(bigger.head.x, bigger.head.y - 25, `+${absorbedSize} +${this.killBonusSmallScore} KILL!`, bigger.color);
            }
        }
    }

    getBodyHitIndex (attacker, defender)
    {
        for (let index = 0; index < defender.segments.length; index++)
        {
            const bodyPart = defender.segments[index];
            const distance = PhaserMath.Distance.Between(attacker.head.x, attacker.head.y, bodyPart.x, bodyPart.y);

            if (distance <= HEAD_TO_BODY_DISTANCE)
            {
                return index;
            }

            if (index > 0)
            {
                const previous = defender.segments[index - 1];
                const gapDistance = this.distancePointToSegment(
                    attacker.head.x,
                    attacker.head.y,
                    previous.x,
                    previous.y,
                    bodyPart.x,
                    bodyPart.y
                );

                if (gapDistance <= HEAD_TO_BODY_DISTANCE - 2)
                {
                    return index;
                }
            }
        }

        return -1;
    }

    truncateSnakeAt (snake, startIndex)
    {
        if (!snake.alive)
        {
            return;
        }

        const canTriggerLizard = snake.power === 'lezard' && this.time.now >= snake.lizardCooldownUntil;

        if (canTriggerLizard)
        {
            snake.lizardBoostUntil = this.time.now + (this.lizardBoostDurationSec * 1000);
            snake.lizardCooldownUntil = this.time.now + (this.lizardCooldownSec * 1000);
            this.showScorePopup(snake.head.x, snake.head.y - 30, 'LEZARD!', snake.color);
        }

        const firstRemoved = snake.segments[startIndex];
        if (firstRemoved)
        {
            this.showImpactFlash(firstRemoved.x, firstRemoved.y);
        }

        const removed = snake.segments.splice(startIndex);
        const removedCount = removed.length;

        for (const segment of removed)
        {
            this.spawnOrange(segment.x, segment.y);
            segment.destroy();
        }

        this.changeSize(snake, -removedCount);

        if (snake.isLocalHuman && removedCount > 0)
        {
            this.audioEngine?.playCut();
        }

        if (canTriggerLizard && removedCount > 0)
        {
            snake.pendingLizardRestoreSegments = removedCount;
            snake.pendingLizardRestoreAt = this.time.now + (this.lizardBoostDurationSec * 1000);
        }

        snake.history.length = this.getTargetHistoryLength(snake);
    }

    processPendingLizardRestore (snake)
    {
        if (!snake.alive || snake.pendingLizardRestoreSegments <= 0)
        {
            return;
        }

        if (this.time.now < snake.pendingLizardRestoreAt)
        {
            return;
        }

        this.changeSize(snake, snake.pendingLizardRestoreSegments);
        this.showScorePopup(
            snake.head.x,
            snake.head.y - 36,
            `QUEUE +${snake.pendingLizardRestoreSegments}`,
            snake.color
        );
        snake.pendingLizardRestoreSegments = 0;
        snake.pendingLizardRestoreAt = 0;
        snake.history.length = this.getTargetHistoryLength(snake);
    }

    processPhoenixArrivalGrowth (snake)
    {
        if (!snake.alive || snake.phoenixArrivalGrowthRemaining <= 0)
        {
            return;
        }

        while (snake.phoenixArrivalGrowthRemaining > 0 && this.time.now >= snake.phoenixArrivalGrowthNextAt)
        {
            this.addScore(snake, this.orangeScoreGain);
            this.changeSize(snake, this.orangeSizeGain);
            snake.phoenixArrivalGrowthRemaining -= 1;
            snake.phoenixArrivalGrowthNextAt += PHOENIX_RESPAWN_GROWTH_STEP_MS;
        }

        if (snake.phoenixArrivalGrowthRemaining <= 0)
        {
            snake.phoenixArrivalGrowthNextAt = 0;
        }
    }

    showImpactFlash (x, y, isMajor = false)
    {
        const flash = this.add.circle(x, y, 12, 0xffffff, 0.95).setDepth(60);

        if (isMajor)
        {
            this.cameras.main.shake(MAJOR_SHAKE_DURATION_MS, MAJOR_SHAKE_INTENSITY);
        }

        this.tweens.add({
            targets: flash,
            scale: { from: 1, to: 3.5 },
            alpha: { from: 0.95, to: 0 },
            duration: 180,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy()
        });
    }

    showScorePopup (x, y, label, color)
    {
        const popup = this.add.text(x, y, label, {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: toHexColor(color),
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(70);

        this.tweens.add({
            targets: popup,
            y: y - 26,
            alpha: { from: 1, to: 0 },
            duration: POPUP_LIFETIME_MS,
            ease: 'Sine.easeOut',
            onComplete: () => popup.destroy()
        });
    }

    killSnake (snake, { spawnOranges = true, deathContext = null } = {})
    {
        if (!snake.alive)
        {
            return;
        }

        const logicalSizeAtDeath = this.getSnakeSize(snake);
        const visibleSegmentsAtDeath = snake.segments.length;

        if (snake.power === 'phoenix' && snake.livesRemaining > 1)
        {
            snake.livesRemaining -= 1;
            this.schedulePhoenixRespawn(snake);
            this.showScorePopup(snake.head.x, snake.head.y - 26, `PHOENIX ${snake.livesRemaining}`, snake.color);
            this.refreshCameraTargets();
            return;
        }

        if (snake.isLocalHuman)
        {
            this.audioEngine?.playDeath();
        }

        snake.lastKoContext = this.buildKoContext(snake, logicalSizeAtDeath, deathContext);

        snake.alive = false;
        snake.size = 0;

        for (const segment of snake.segments)
        {
            if (spawnOranges)
            {
                this.spawnOrange(segment.x, segment.y);
            }

            segment.destroy();
        }

        snake.segments = [];

        if (spawnOranges)
        {
            this.spawnOrange(snake.head.x, snake.head.y);

            if (snake.power === 'leurre')
            {
                const extraOranges = Math.max(0, logicalSizeAtDeath - (visibleSegmentsAtDeath + 1));
                for (let index = 0; index < extraOranges; index++)
                {
                    const x = PhaserMath.Clamp(
                        snake.head.x + PhaserMath.Between(-18, 18),
                        20,
                        WORLD_WIDTH - 20
                    );
                    const y = PhaserMath.Clamp(
                        snake.head.y + PhaserMath.Between(-18, 18),
                        20,
                        WORLD_HEIGHT - 20
                    );
                    this.spawnOrange(x, y);
                }
            }
        }

        snake.head.destroy();
        snake.phoenixRespawnAnchor?.destroy();
        snake.wormVirusTargetAnchor?.destroy();
        snake.viewerLabels.forEach((label) => label.destroy());
        snake.viewerLabels = [];

        this.refreshCameraTargets();

        if (snake.isLocalHuman && !this.isGameOver)
        {
            const aliveLocalPlayers = this.getActiveOrPendingLocalPlayers();

            if (aliveLocalPlayers.length === 0)
            {
                const bestLocalResult = this.getBestLocalResult();
                this.finishGame(bestLocalResult.score, 'Tous les joueurs locaux sont elimines !', bestLocalResult.name, bestLocalResult.id);
            }
        }
    }

    buildKoContext (snake, logicalSizeAtDeath, deathContext)
    {
        const context = {
            reason: typeof deathContext?.reason === 'string' ? deathContext.reason : 'ko',
            victimSize: Math.max(1, Math.floor(logicalSizeAtDeath)),
            opponentSize: null,
            opponentName: null,
            opponentPower: null
        };

        const opponent = deathContext?.opponent;
        if (!opponent)
        {
            return context;
        }

        const providedOpponentSize = deathContext?.opponentSize;
        context.opponentSize = Number.isFinite(providedOpponentSize)
            ? Math.max(1, Math.floor(providedOpponentSize))
            : this.getSnakeSize(opponent);
        context.opponentName = this.sanitizeName(opponent.name || 'Adversaire');
        context.opponentPower = opponent.power || 'sans';

        return context;
    }

    schedulePhoenixRespawn (snake)
    {
        const spawn = this.findSafeRespawnPoint(snake);
        const direction = DIRECTIONS[PhaserMath.Between(0, DIRECTIONS.length - 1)];

        snake.alive = false;
        snake.head.setVisible(false);
        snake.score = Math.max(0, snake.score - this.phoenixRespawnScorePenalty);
        snake.size = this.initialSize;
        snake.phoenixRespawnPending = true;
        snake.phoenixRespawnAtMs = this.time.now + PHOENIX_RESPAWN_DELAY_MS;
        snake.phoenixRespawnX = spawn.x;
        snake.phoenixRespawnY = spawn.y;
        snake.phoenixRespawnDirection = { ...direction };
        snake.phoenixRespawnAnchor.setPosition(spawn.x, spawn.y);
        snake.phoenixArrivalGrowthRemaining = 0;
        snake.phoenixArrivalGrowthNextAt = 0;

        for (const segment of snake.segments)
        {
            segment.destroy();
        }
        snake.segments = [];

        this.updateSnakeScoreLabel(snake);
    }

    processPendingPhoenixRespawns ()
    {
        for (const snake of this.snakes)
        {
            if (!snake.phoenixRespawnPending || snake.alive)
            {
                continue;
            }

            if (this.time.now < snake.phoenixRespawnAtMs)
            {
                continue;
            }

            this.respawnPhoenixSnakeAtScheduledPoint(snake);
        }
    }

    respawnPhoenixSnakeAtScheduledPoint (snake)
    {
        const spawn = {
            x: snake.phoenixRespawnX,
            y: snake.phoenixRespawnY
        };
        const direction = snake.phoenixRespawnDirection || DIRECTIONS[PhaserMath.Between(0, DIRECTIONS.length - 1)];

        snake.alive = true;
        snake.size = this.initialSize;
        snake.head.setPosition(spawn.x, spawn.y);
        snake.head.setVisible(true);
        snake.direction = { ...direction };
        snake.turnCooldown = 0;
        snake.lizardBoostUntil = 0;
        snake.lizardCooldownUntil = 0;
        snake.basilicBoostUntil = 0;
        snake.basilicCooldownUntil = 0;
        snake.cameleonInvisibleUntil = 0;
        snake.cameleonCooldownUntil = 0;
        snake.cracheurCooldownUntil = 0;
        snake.paralyzedUntil = 0;
        snake.mambaBoostUntil = 0;
        snake.sphinxVisualSizeBonus = snake.power === 'sphinx' ? Math.max(0, this.initialSize - 1) : 0;
        snake.wormVirusTargetingUntil = 0;
        snake.wormVirusTeleportPending = false;
        snake.wormVirusStoredSize = 0;
        snake.wormVirusArrivalSegmentsRemaining = 0;
        snake.wormVirusArrivalNextAt = 0;
        snake.wormVirusTargetAnchor?.setPosition(spawn.x, spawn.y);
        snake.pendingLizardRestoreAt = 0;
        snake.pendingLizardRestoreSegments = 0;
        snake.phoenixRespawnPending = false;
        snake.phoenixRespawnAtMs = 0;
        snake.phoenixRespawnDirection = null;
        snake.phoenixArrivalGrowthRemaining = PHOENIX_RESPAWN_BONUS_GROWTH;
        snake.phoenixArrivalGrowthNextAt = this.time.now + PHOENIX_RESPAWN_GROWTH_STEP_MS;
        snake.phoenixRespawnAnchor.setPosition(spawn.x, spawn.y);
        snake.history = this.createInitialHistory(spawn, direction, snake.power);

        for (const segment of snake.segments)
        {
            segment.destroy();
        }
        snake.segments = [];
        this.showScorePopup(snake.head.x, snake.head.y - 24, `+${PHOENIX_RESPAWN_BONUS_GROWTH}`, snake.color);
        this.updateSnakeSegments(snake);
        this.updateSnakeScoreLabel(snake);
        this.refreshCameraTargets();
    }

    spawnPoisonProjectile (snake)
    {
        if (!snake?.alive)
        {
            return;
        }

        const direction = snake.direction;
        if (!direction || (!direction.x && !direction.y))
        {
            return;
        }

        const sprite = this.add.circle(
            snake.head.x,
            snake.head.y,
            CRACHEUR_PROJECTILE_RADIUS,
            0xa945ff,
            1
        ).setDepth(24);

        this.poisonProjectiles.push({
            ownerId: snake.id,
            x: snake.head.x,
            y: snake.head.y,
            direction: { ...direction },
            traveled: 0,
            maxDistance: this.cracheurShotDistance,
            sprite
        });
    }

    updatePoisonProjectiles (delta)
    {
        if (!Array.isArray(this.poisonProjectiles) || this.poisonProjectiles.length === 0)
        {
            return;
        }

        const dt = delta / 1000;

        for (let index = this.poisonProjectiles.length - 1; index >= 0; index--)
        {
            const projectile = this.poisonProjectiles[index];
            const stepDistance = CRACHEUR_PROJECTILE_SPEED * dt;

            projectile.x += projectile.direction.x * stepDistance;
            projectile.y += projectile.direction.y * stepDistance;
            projectile.traveled += stepDistance;
            projectile.sprite.setPosition(projectile.x, projectile.y);

            if (
                projectile.traveled >= projectile.maxDistance ||
                projectile.x < 0 ||
                projectile.x > WORLD_WIDTH ||
                projectile.y < 0 ||
                projectile.y > WORLD_HEIGHT
            )
            {
                this.removePoisonProjectile(index);
                continue;
            }

            let hasHitSnake = false;
            for (const snake of this.snakes)
            {
                if (!snake.alive || snake.id === projectile.ownerId)
                {
                    continue;
                }

                const hitDistance = PhaserMath.Distance.Between(projectile.x, projectile.y, snake.head.x, snake.head.y);
                const bodyHit = snake.segments.some((segment, segmentIndex) => {
                    const segmentDistance = PhaserMath.Distance.Between(projectile.x, projectile.y, segment.x, segment.y);
                    if (segmentDistance <= (HEAD_RADIUS - 2) + CRACHEUR_PROJECTILE_RADIUS)
                    {
                        return true;
                    }

                    if (segmentIndex > 0)
                    {
                        const previous = snake.segments[segmentIndex - 1];
                        const gapDistance = this.distancePointToSegment(
                            projectile.x,
                            projectile.y,
                            previous.x,
                            previous.y,
                            segment.x,
                            segment.y
                        );

                        return gapDistance <= (HEAD_RADIUS - 4) + CRACHEUR_PROJECTILE_RADIUS;
                    }

                    return false;
                });

                if (hitDistance <= HEAD_RADIUS + CRACHEUR_PROJECTILE_RADIUS || bodyHit)
                {
                    snake.paralyzedUntil = Math.max(
                        snake.paralyzedUntil || 0,
                        this.time.now + (this.cracheurParalysisDurationSec * 1000)
                    );
                    this.showScorePopup(snake.head.x, snake.head.y - 24, 'PARALYSE!', snake.color);
                    this.removePoisonProjectile(index);
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

    removePoisonProjectile (index)
    {
        const projectile = this.poisonProjectiles[index];
        projectile?.sprite?.destroy();
        this.poisonProjectiles.splice(index, 1);
    }

    destroyAllPoisonProjectiles ()
    {
        if (!Array.isArray(this.poisonProjectiles))
        {
            return;
        }

        for (const projectile of this.poisonProjectiles)
        {
            projectile?.sprite?.destroy();
        }

        this.poisonProjectiles = [];
    }

    isSnakeCameleonInvisibleForViewer (snake, viewerIndex)
    {
        if (!snake || snake.power !== 'cameleon' || this.time.now >= snake.cameleonInvisibleUntil)
        {
            return false;
        }

        const viewerSnake = this.getCameraFollowTarget(viewerIndex);
        return !viewerSnake || viewerSnake.id !== snake.id;
    }

    updateCameleonVisibilityForCameras ()
    {
        const allCameras = [this.cameras.main, ...this.extraCameras];

        for (const snake of this.snakes)
        {
            const snakeObjects = [snake.head, ...snake.segments].filter((gameObject) => gameObject && gameObject.active);
            for (const gameObject of snakeObjects)
            {
                gameObject.cameraFilter = 0;
            }
        }

        for (let viewerIndex = 0; viewerIndex < allCameras.length; viewerIndex++)
        {
            const camera = allCameras[viewerIndex];
            const viewerSnake = this.getCameraFollowTarget(viewerIndex);

            for (const snake of this.snakes)
            {
                if (!snake.alive || snake.power !== 'cameleon' || this.time.now >= snake.cameleonInvisibleUntil)
                {
                    continue;
                }

                if (viewerSnake && viewerSnake.id === snake.id)
                {
                    continue;
                }

                const hiddenObjects = [snake.head, ...snake.segments].filter((gameObject) => gameObject && gameObject.active);
                if (hiddenObjects.length > 0)
                {
                    camera.ignore(hiddenObjects);
                }
            }
        }
    }

    updatePhoenixRespawnCountdowns ()
    {
        for (let viewerIndex = 0; viewerIndex < this.phoenixCountdownTexts.length; viewerIndex++)
        {
            const text = this.phoenixCountdownTexts[viewerIndex];
            const slotSnake = this.getCameraFollowTarget(viewerIndex);

            if (!text || !text.active || !slotSnake)
            {
                text?.setVisible(false);
                continue;
            }

            if (slotSnake.phoenixRespawnPending)
            {
                const remaining = Math.max(0, Math.ceil((slotSnake.phoenixRespawnAtMs - this.time.now) / 1000));
                const pulseScale = 1 + (Math.sin(this.time.now * 0.018) * 0.08);
                text.setText(`${remaining}`);
                text.setScale(pulseScale);
                text.setColor(remaining <= 1 ? '#ffd966' : '#ffffff');
                text.setVisible(true);
                continue;
            }

            if (this.isWormVirusTargetingActive(slotSnake))
            {
                const remaining = Math.max(0, Math.ceil((slotSnake.wormVirusTargetingUntil - this.time.now) / 1000));
                const pulseScale = 1 + (Math.sin(this.time.now * 0.018) * 0.08);
                text.setText(`${remaining}`);
                text.setScale(pulseScale);
                text.setColor('#9cff57');
                text.setVisible(true);
                continue;
            }

            text.setVisible(false);
        }
    }

    findSafeRespawnPoint (snake)
    {
        for (let attempt = 0; attempt < 80; attempt++)
        {
            const x = this.randomInWorld(150);
            const y = this.randomInWorld(150, false);
            const occupied = this.snakes.some((other) => {
                if (!other.alive || other === snake)
                {
                    return false;
                }

                if (PhaserMath.Distance.Between(x, y, other.head.x, other.head.y) < 180)
                {
                    return true;
                }

                return other.segments.some((segment) => PhaserMath.Distance.Between(x, y, segment.x, segment.y) < 140);
            });

            if (!occupied)
            {
                return { x, y };
            }
        }

        return {
            x: this.randomInWorld(150),
            y: this.randomInWorld(150, false)
        };
    }

    checkVictoryCondition ()
    {
        if (this.isGameOver)
        {
            return;
        }

        const aliveSnakes = this.snakes.filter((snake) => snake.alive || snake.phoenixRespawnPending);
        const aliveLocalPlayers = this.getActiveOrPendingLocalPlayers();

        if (aliveLocalPlayers.length === 1 && aliveSnakes.length === 1 && aliveSnakes[0] === aliveLocalPlayers[0])
        {
            const winner = aliveLocalPlayers[0];
            this.finishGame(winner.score, `Victoire ! ${winner.name} est le dernier basilic en vie.`, winner.name, winner.id, true);
        }
    }

    applyPlacementBonusesToAllSnakes ()
    {
        const rankedSnakes = this.snakes
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

            let bonus = baseBonus;
            if (snake.power === 'sans')
            {
                bonus *= this.sansScoreMultiplier;
            }
            snake.score += bonus;
        };

        applyBonusAt(0, PLACEMENT_BONUS_1ST);
        applyBonusAt(1, PLACEMENT_BONUS_2ND);
        applyBonusAt(2, PLACEMENT_BONUS_3RD);
    }

    finishGame (finalScore, title, playerNameOverride = null, playerIdOverride = null, isWinner = false)
    {
        this.isGameOver = true;
        this.audioEngine?.stopMusic();
        this.audioEngine?.playMatchEnd();
        this.applyPlacementBonusesToAllSnakes();

        const scoreOwnerSnake = playerIdOverride
            ? this.localPlayers.find((snake) => snake.id === playerIdOverride)
            : this.localPlayers.find((snake) => snake.name === playerNameOverride);

        let timeBonus = 0;
        if (isWinner && scoreOwnerSnake)
        {
            timeBonus = this.computeVictoryTimeBonus();
            scoreOwnerSnake.score += timeBonus;
        }

        const effectiveFinalScore = Number.isFinite(scoreOwnerSnake?.score) ? scoreOwnerSnake.score : finalScore;
        const scoreOwnerName = this.sanitizeName(scoreOwnerSnake?.name || playerNameOverride || this.playerName);

        const highscores = this.readHighscores();
        const qualifies = isWinner && this.qualifiesForHighscore(effectiveFinalScore, highscores);

        if (qualifies)
        {
            highscores.push({
                name: scoreOwnerName,
                score: effectiveFinalScore,
                power: scoreOwnerSnake?.power || 'sans',
                totalSnakes: this.snakes.length,
                elapsedTimeMs: this.elapsedTimeMs,
                date: new Date().toISOString().slice(0, 10)
            });
            highscores.sort((a, b) => b.score - a.score);
            highscores.length = Math.min(HIGHSCORE_LIMIT, highscores.length);
            this.writeHighscores(highscores);
        }

        const top = this.readHighscores().slice(0, HIGHSCORE_LIMIT).map((entry, index) => {
            const powerLabel = this.getPowerDisplayName(entry.power || 'sans');
            const snakesCount = Number.isFinite(entry.totalSnakes) ? entry.totalSnakes : this.maxSnakes;
            const elapsedLabel = this.formatElapsedMs(Number.isFinite(entry.elapsedTimeMs) ? entry.elapsedTimeMs : 0);
            return `${index + 1}. ${entry.name} - ${entry.score} (${powerLabel}, ${snakesCount} serpents, ${elapsedLabel})`;
        }).join('\n');
        const topText = top || 'Aucun score';
        const statusText = qualifies
            ? 'Nouveau highscore enregistre.'
            : (isWinner ? 'Victoire, mais pas dans le top highscores cette fois.' : 'Inscription highscore reservee au vainqueur.');
        const localBoard = this.localPlayers
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((snake) => {
                const baseLine = `${snake.name}: ${snake.score}`;
                if (snake.alive || snake.phoenixRespawnPending)
                {
                    return baseLine;
                }

                const ko = snake.lastKoContext;
                if (!ko)
                {
                    return `${baseLine} (KO)`;
                }

                if (ko.opponentName)
                {
                    const powerLabel = this.getPowerDisplayName(ko.opponentPower || 'sans');
                    return `${baseLine} (KO - Taille ${ko.victimSize} vs ${ko.opponentSize}; ${ko.opponentName} / ${powerLabel})`;
                }

                return `${baseLine} (KO - Taille ${ko.victimSize})`;
            })
            .join('\n');

        const timeBonusLine = isWinner ? `\nBonus temps: +${timeBonus}` : '';

        this.expandGameOverCamera(this.scale.width, this.scale.height);

        this.endPanel.setAlpha(0).setVisible(true);
        this.endText
            .setAlpha(0)
            .setVisible(true)
            .setText(`${title}\nScore retenu: ${effectiveFinalScore} (${scoreOwnerName})${timeBonusLine}\n${statusText}\n\nScores locaux:\n${localBoard || 'Aucun joueur local'}\n\nTop ${HIGHSCORE_LIMIT}:\n${topText}\n\nAppuie sur R pour retourner au menu`);

        this.tweens.add({
            targets: [this.endPanel, this.endText],
            alpha: { from: 0, to: 1 },
            duration: 260,
            ease: 'Sine.easeOut'
        });
    }

    sanitizeName (value)
    {
        const trimmed = (value || '').trim().replace(/\s+/g, ' ');
        return (trimmed.length > 0 ? trimmed.slice(0, 16) : 'Anonyme');
    }

    computeVictoryTimeBonus ()
    {
        const clampedElapsed = PhaserMath.Clamp(this.elapsedTimeMs, 0, TIME_VICTORY_BONUS_WINDOW_MS);
        const ratio = 1 - (clampedElapsed / TIME_VICTORY_BONUS_WINDOW_MS);
        return Math.max(0, Math.round(TIME_VICTORY_BONUS_MAX * ratio));
    }

    formatElapsedMs (elapsedMs)
    {
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    readHighscores ()
    {
        try
        {
            const raw = window.localStorage.getItem(HIGHSCORE_KEY);
            if (!raw)
            {
                return [];
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed))
            {
                return [];
            }

            return parsed
                .filter((entry) => typeof entry?.name === 'string' && Number.isFinite(entry?.score))
                .map((entry) => ({
                    name: entry.name,
                    score: entry.score,
                    power: typeof entry?.power === 'string' ? entry.power : 'sans',
                    totalSnakes: Number.isFinite(entry?.totalSnakes) ? entry.totalSnakes : null,
                    elapsedTimeMs: Number.isFinite(entry?.elapsedTimeMs) ? entry.elapsedTimeMs : null,
                    date: entry.date || ''
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, HIGHSCORE_LIMIT);
        }
        catch
        {
            return [];
        }
    }

    writeHighscores (scores)
    {
        window.localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(scores));
    }

    qualifiesForHighscore (score, highscores)
    {
        if (highscores.length < HIGHSCORE_LIMIT)
        {
            return true;
        }

        return score > highscores[highscores.length - 1].score;
    }

    updateHud (delta)
    {
        this.hudEmitTimer -= delta;

        if (this.hudEmitTimer > 0)
        {
            return;
        }

        this.hudEmitTimer = HUD_EMIT_INTERVAL_MS;
        this.emitHudUpdate();
    }

    emitHudUpdate ()
    {
        const aliveCount = this.snakes.filter((snake) => snake.alive).length;
        const primaryLocalPlayer = this.getPrimaryLocalPlayer();
        const score = primaryLocalPlayer && primaryLocalPlayer.alive ? primaryLocalPlayer.score : 0;
        const leftCameraTarget = this.getCameraFollowTarget(0);
        const rightCameraTarget = this.getCameraFollowTarget(1);
        const localPlayers = this.localPlayers.map((snake) => ({
            id: snake.id,
            name: snake.name,
            score: snake.score,
            alive: snake.alive,
            inputProfile: snake.inputProfile,
            color: snake.color,
            power: snake.power
        }));

        const allCameras = [this.cameras.main, ...this.extraCameras];
        const cameraFrames = allCameras.map((camera, index) => {
            const target = this.getCameraFollowTarget(index);
            return {
                x: camera.x,
                y: camera.y,
                width: camera.width,
                height: camera.height,
                color: target?.color || 0xffffff,
                playerName: target?.name || 'Aucun'
            };
        });

        EventBus.emit('game-hud-update', {
            playerName: primaryLocalPlayer?.name || this.playerName,
            score,
            aliveCount,
            totalSnakes: this.maxSnakes,
            viewMode: this.localPlayers.length > 1 ? 'split' : 'single',
            cameraTargets: {
                left: leftCameraTarget ? leftCameraTarget.name : 'Aucun',
                right: rightCameraTarget ? rightCameraTarget.name : 'Aucun'
            },
            cameraFrames,
            localPlayers,
            elapsedTimeMs: this.elapsedTimeMs,
            world: {
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT
            },
            oranges: this.oranges.map((orange) => ({ x: orange.x, y: orange.y })),
            poisonProjectiles: this.poisonProjectiles.map((projectile) => ({
                x: projectile.x,
                y: projectile.y
            })),
            snakes: this.snakes
                .filter((snake) => snake.alive)
                .filter((snake) => !(snake.power === 'cameleon' && this.time.now < snake.cameleonInvisibleUntil))
                .map((snake) => ({
                isPlayer: snake.isPlayer,
                name: snake.name,
                color: snake.color,
                score: snake.score,
                head: { x: snake.head.x, y: snake.head.y },
                segments: snake.segments.map((segment) => ({ x: segment.x, y: segment.y }))
                }))
        });
    }

    getPrimaryLocalPlayer ()
    {
        if (this.localPlayers.length > 0)
        {
            return this.localPlayers[0];
        }

        return this.localPlayer;
    }

    getAliveLocalPlayers ()
    {
        return this.localPlayers.filter((snake) => snake.alive);
    }

    getActiveOrPendingLocalPlayers ()
    {
        return this.localPlayers.filter((snake) => snake.alive || snake.phoenixRespawnPending);
    }

    getBestLocalResult ()
    {
        if (this.localPlayers.length === 0)
        {
            return {
                name: this.playerName,
                score: 0
            };
        }

        let best = this.localPlayers[0];

        for (const snake of this.localPlayers)
        {
            if (snake.score > best.score)
            {
                best = snake;
            }
        }

        return {
            id: best.id,
            name: best.name,
            score: best.score
        };
    }

    distancePointToSegment (px, py, ax, ay, bx, by)
    {
        const abx = bx - ax;
        const aby = by - ay;
        const apx = px - ax;
        const apy = py - ay;
        const abLenSq = (abx * abx) + (aby * aby);

        if (abLenSq <= 0.0001)
        {
            return Math.hypot(px - ax, py - ay);
        }

        const t = Math.max(0, Math.min(1, ((apx * abx) + (apy * aby)) / abLenSq));
        const closestX = ax + (abx * t);
        const closestY = ay + (aby * t);

        return Math.hypot(px - closestX, py - closestY);
    }

    drawWorldBounds ()
    {
        const graphics = this.add.graphics();
        graphics.lineStyle(6, 0xffffff, 0.25);
        graphics.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    handleResize (gameSize)
    {
        if (this.isGameOver)
        {
            this.expandGameOverCamera(gameSize.width, gameSize.height);
        }
        else
        {
            this.configureLocalCameras(gameSize.width, gameSize.height);
        }

        if (this.endPanel)
        {
            this.endPanel.setPosition(gameSize.width / 2, gameSize.height / 2);
            this.endPanel.setSize(Math.min(680, gameSize.width - 40), 240);
        }

        if (this.endText)
        {
            this.endText.setPosition(gameSize.width / 2, gameSize.height / 2);
        }
    }

    expandGameOverCamera (width = this.scale.width, height = this.scale.height)
    {
        for (const camera of this.extraCameras)
        {
            this.cameras.remove(camera, false);
        }
        this.extraCameras = [];

        this.cameras.main.setViewport(0, 0, width, height);
        this.cameras.main.setZoom(CAMERA_ZOOM);
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.stopFollow();

        for (const countdownText of this.phoenixCountdownTexts)
        {
            countdownText.setVisible(false);
        }

        for (const scoreText of this.playerScoreHudTexts)
        {
            scoreText.setVisible(false);
        }
    }

    configureLocalCameras (width, height)
    {
        for (const camera of this.extraCameras)
        {
            this.cameras.remove(camera, false);
        }
        this.extraCameras = [];

        const localCount = Math.max(1, this.localPlayers.length);
        let viewports = [];

        if (localCount === 1)
        {
            viewports = [{ x: 0, y: 0, width, height }];
        }
        else if (localCount === 2)
        {
            const halfWidth = Math.floor(width / 2);
            viewports = [
                { x: 0, y: 0, width: halfWidth, height },
                { x: halfWidth, y: 0, width: width - halfWidth, height }
            ];
        }
        else
        {
            const halfWidth = Math.floor(width / 2);
            const halfHeight = Math.floor(height / 2);
            viewports = [
                { x: 0, y: 0, width: halfWidth, height: halfHeight },
                { x: halfWidth, y: 0, width: width - halfWidth, height: halfHeight },
                { x: 0, y: halfHeight, width: halfWidth, height: height - halfHeight },
                { x: halfWidth, y: halfHeight, width: width - halfWidth, height: height - halfHeight }
            ];
        }

        this.cameraSlotSnakeIds = viewports.map((_, index) => this.localPlayers[index]?.id || null);

        const mainViewport = viewports[0];
        this.viewportCache = viewports;
        this.syncPhoenixCountdownTexts(viewports);
        this.cameras.main.setViewport(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
        this.cameras.main.setZoom(CAMERA_ZOOM);
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.setBackgroundColor(0x102030);
        this.applyCameraLabelIsolation(this.cameras.main, 0);

        for (let index = 1; index < viewports.length; index++)
        {
            const viewport = viewports[index];
            const camera = this.cameras.add(viewport.x, viewport.y, viewport.width, viewport.height);
            camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
            camera.setRoundPixels(true);
            camera.setZoom(CAMERA_ZOOM);
            camera.setBackgroundColor(0x102030);
            if (this.endPanel && this.endText)
            {
                camera.ignore([this.endPanel, this.endText]);
            }
            this.applyCameraLabelIsolation(camera, index);
            this.extraCameras.push(camera);
        }

        this.refreshCameraTargets();
    }

    refreshCameraTargets ()
    {
        const allCameras = [this.cameras.main, ...this.extraCameras];

        for (let slotIndex = 0; slotIndex < allCameras.length; slotIndex++)
        {
            const target = this.getCameraFollowTarget(slotIndex);
            const camera = allCameras[slotIndex];
            const followObject = this.getCameraFollowObject(target);

            if (followObject && followObject.active)
            {
                camera.startFollow(followObject, true, 1, 1);
            }
            else
            {
                camera.stopFollow();
            }
        }
    }

    getCameraFollowObject (snake)
    {
        if (!snake)
        {
            return null;
        }

        if (this.isWormVirusTargetingActive(snake) || snake.wormVirusTeleportPending)
        {
            return (snake.wormVirusTargetAnchor && snake.wormVirusTargetAnchor.active) ? snake.wormVirusTargetAnchor : null;
        }

        if (snake.phoenixRespawnPending)
        {
            return (snake.phoenixRespawnAnchor && snake.phoenixRespawnAnchor.active) ? snake.phoenixRespawnAnchor : null;
        }

        return (snake.head && snake.head.active) ? snake.head : null;
    }

    syncPhoenixCountdownTexts (viewports)
    {
        const needed = Math.max(1, viewports.length);

        this.phoenixCountdownTexts = this.phoenixCountdownTexts.filter((text) => text && text.active);
        this.playerScoreHudTexts = this.playerScoreHudTexts.filter((text) => text && text.active);

        while (this.phoenixCountdownTexts.length < needed)
        {
            const text = this.createPhoenixCountdownText();
            this.phoenixCountdownTexts.push(text);
        }

        while (this.phoenixCountdownTexts.length > needed)
        {
            const removed = this.phoenixCountdownTexts.pop();
            removed?.destroy();
        }

        while (this.playerScoreHudTexts.length < needed)
        {
            const text = this.createPlayerScoreHudText();
            this.playerScoreHudTexts.push(text);
        }

        while (this.playerScoreHudTexts.length > needed)
        {
            const removed = this.playerScoreHudTexts.pop();
            removed?.destroy();
        }

        for (let index = 0; index < viewports.length; index++)
        {
            const viewport = viewports[index];
            this.phoenixCountdownTexts[index].setPosition(
                viewport.x + (viewport.width / 2),
                viewport.y + (viewport.height / 2)
            );
            this.playerScoreHudTexts[index].setPosition(
                viewport.width / 2,
                40
            );
        }

        this.updatePlayerScoreHudTexts();
    }

    createPhoenixCountdownText ()
    {
        return this.add.text(0, 0, '', {
            fontFamily: 'Arial Black',
            fontSize: 96,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 11,
            shadow: {
                offsetX: 0,
                offsetY: 4,
                color: '#000000',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1300).setVisible(false);
    }

    createPlayerScoreHudText ()
    {
        return this.add.text(0, 0, '', {
            fontFamily: 'Arial Black',
            fontSize: 22,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1350).setVisible(false);
    }

    syncScoreHudPositionsAndVisibility ()
    {
        const viewports = this.viewportCache && this.viewportCache.length > 0
            ? this.viewportCache
            : this.buildCurrentViewports();

        for (let index = 0; index < viewports.length; index++)
        {
            const viewport = viewports[index];
            const scoreText = this.playerScoreHudTexts[index];

            if (!scoreText)
            {
                continue;
            }

            // Position text at top center of this viewport
            scoreText.setPosition(
                viewport.width / 2,
                40
            );
        }
    }

    buildCurrentViewports ()
    {
        const width = this.scale.width;
        const height = this.scale.height;
        const localCount = Math.max(1, this.localPlayers.length);
        const viewports = [];

        if (localCount === 1)
        {
            viewports.push({ x: 0, y: 0, width, height });
        }
        else if (localCount === 2)
        {
            const halfWidth = Math.floor(width / 2);
            viewports.push({ x: 0, y: 0, width: halfWidth, height });
            viewports.push({ x: halfWidth, y: 0, width: width - halfWidth, height });
        }
        else
        {
            const halfWidth = Math.floor(width / 2);
            const halfHeight = Math.floor(height / 2);
            viewports.push({ x: 0, y: 0, width: halfWidth, height: halfHeight });
            viewports.push({ x: halfWidth, y: 0, width: width - halfWidth, height: halfHeight });
            viewports.push({ x: 0, y: halfHeight, width: halfWidth, height: height - halfHeight });
            viewports.push({ x: halfWidth, y: halfHeight, width: width - halfWidth, height: height - halfHeight });
        }

        return viewports;
    }

    updatePlayerScoreHudTexts ()
    {
        for (let viewerIndex = 0; viewerIndex < this.playerScoreHudTexts.length; viewerIndex++)
        {
            const scoreText = this.playerScoreHudTexts[viewerIndex];
            const slotPlayer = this.getCameraSlotOwner(viewerIndex);

            if (!scoreText || !slotPlayer)
            {
                scoreText?.setVisible(false);
                continue;
            }

            const score = Number.isFinite(slotPlayer.score) ? slotPlayer.score : 0;
            const status = slotPlayer.alive ? '' : ' (KO)';
            scoreText
                .setColor(toHexColor(slotPlayer.color || 0xffffff))
                .setText(`${slotPlayer.name}: ${score}${status}`)
                .setVisible(true);
        }
    }

    resetPhoenixHudState ({ destroyTexts = false } = {})
    {
        this.cameraSlotSnakeIds = [];

        if (destroyTexts)
        {
            for (const text of this.phoenixCountdownTexts)
            {
                text?.destroy();
            }
            this.phoenixCountdownTexts = [];

            for (const text of this.playerScoreHudTexts)
            {
                text?.destroy();
            }
            this.playerScoreHudTexts = [];
            return;
        }

        this.phoenixCountdownTexts = [];
        this.playerScoreHudTexts = [];
    }

    applyCameraLabelIsolation (camera, viewerIndex)
    {
        const labelsToIgnore = [];

        for (const snake of this.snakes)
        {
            snake.viewerLabels.forEach((label, labelIndex) => {
                if (labelIndex !== viewerIndex)
                {
                    labelsToIgnore.push(label);
                }
            });
        }

        this.phoenixCountdownTexts.forEach((countdownText, countdownIndex) => {
            if (countdownIndex !== viewerIndex)
            {
                labelsToIgnore.push(countdownText);
            }
        });

        this.playerScoreHudTexts.forEach((scoreHudText, hudIndex) => {
            if (hudIndex !== viewerIndex)
            {
                labelsToIgnore.push(scoreHudText);
            }
        });

        if (labelsToIgnore.length > 0)
        {
            camera.ignore(labelsToIgnore);
        }
    }

    getCameraSlotOwner (slotIndex)
    {
        const snakeId = this.cameraSlotSnakeIds[slotIndex];
        if (!snakeId)
        {
            return this.localPlayers[slotIndex] || null;
        }

        return this.localPlayers.find((snake) => snake.id === snakeId) || null;
    }

    getCameraFollowTarget (slotIndex)
    {
        if (this.localPlayers.length === 0)
        {
            return null;
        }

        const slotPlayer = this.getCameraSlotOwner(slotIndex) || this.localPlayers[slotIndex];
        if (slotPlayer && (slotPlayer.alive || slotPlayer.phoenixRespawnPending))
        {
            return slotPlayer;
        }

        for (const snake of this.localPlayers)
        {
            if (snake.alive || snake.phoenixRespawnPending)
            {
                return snake;
            }
        }

        return this.localPlayers[0] || null;
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
