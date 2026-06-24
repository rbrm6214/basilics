import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { MultiGame } from './scenes/MultiGame';
import { MultiGameFull } from './scenes/MultiGameFull';
import { MultiWaitingRoom } from './scenes/MultiWaitingRoom';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { LocalSetup } from './scenes/LocalSetup';
import { RulesPanel } from './scenes/RulesPanel';
import { OptionsPanel } from './scenes/OptionsPanel';
import { AUTO, Game as PhaserGame, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: 1024,
        height: 768
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        LocalSetup,
        MultiWaitingRoom,
        MultiGame,
        MultiGameFull,
        Game,
        GameOver,
        RulesPanel,
        OptionsPanel
    ]
};

const StartGame = (parent) => {

    return new PhaserGame({ ...config, parent });

}

export default StartGame;
