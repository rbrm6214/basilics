import { EventBus } from '../EventBus';
import { Scene, Math as PhaserMath } from 'phaser';

export class OptionsPanel extends Scene
{
    constructor ()
    {
        super('OptionsPanel');
        this.params = {};
    }

    create ()
    {
        this.loadParams();

        this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.85).setScrollFactor(0).setDepth(900);

        const panelWidth = 940;
        const panelHeight = 660;
        const panelX = 512;
        const panelY = 384;

        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a2a3a, 1)
            .setStrokeStyle(3, 0xffffff, 0.85)
            .setScrollFactor(0)
            .setDepth(910);

        this.add.text(panelX, 110, 'OPTIONS DU JEU', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffce80',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(920);

        this.leftPageRect = {
            x: panelX - 210,
            y: panelY,
            width: 360,
            height: 430
        };
        this.rightPageRect = {
            x: panelX + 210,
            y: panelY,
            width: 360,
            height: 430
        };

        this.add.rectangle(this.leftPageRect.x, this.leftPageRect.y, this.leftPageRect.width, this.leftPageRect.height, 0x142433, 0.95)
            .setStrokeStyle(2, 0xffffff, 0.2)
            .setDepth(916);
        this.add.rectangle(this.rightPageRect.x, this.rightPageRect.y, this.rightPageRect.width, this.rightPageRect.height, 0x142433, 0.95)
            .setStrokeStyle(2, 0xffffff, 0.2)
            .setDepth(916);
        this.add.line(panelX, panelY, 0, -220, 0, 220, 0xffffff, 0.18).setDepth(917);

        this.leftPageBaseX = this.leftPageRect.x - (this.leftPageRect.width / 2) + 12;
        this.leftPageBaseY = this.leftPageRect.y - (this.leftPageRect.height / 2) + 14;
        this.leftPageViewportHeight = this.leftPageRect.height - 28;
        this.leftPageViewportWidth = this.leftPageRect.width - 48;
        this.rightPageBaseX = this.rightPageRect.x - (this.rightPageRect.width / 2) + 12;
        this.rightPageBaseY = this.rightPageRect.y - (this.rightPageRect.height / 2) + 14;
        this.rightPageViewportHeight = this.rightPageRect.height - 28;
        this.rightPageViewportWidth = this.rightPageRect.width - 48;

        this.leftOptionsContainer = this.add.container(this.leftPageBaseX, this.leftPageBaseY).setDepth(920);
        this.rightOptionsContainer = this.add.container(this.rightPageBaseX, this.rightPageBaseY).setDepth(920);

        const leftMaskShape = this.make.graphics();
        leftMaskShape.fillStyle(0xffffff, 1);
        leftMaskShape.fillRect(
            this.leftPageRect.x - (this.leftPageRect.width / 2) + 10,
            this.leftPageRect.y - (this.leftPageRect.height / 2) + 10,
            this.leftPageViewportWidth,
            this.leftPageViewportHeight
        );
        this.leftOptionsContainer.setMask(leftMaskShape.createGeometryMask());

        const rightMaskShape = this.make.graphics();
        rightMaskShape.fillStyle(0xffffff, 1);
        rightMaskShape.fillRect(
            this.rightPageRect.x - (this.rightPageRect.width / 2) + 10,
            this.rightPageRect.y - (this.rightPageRect.height / 2) + 10,
            this.rightPageViewportWidth,
            this.rightPageViewportHeight
        );
        this.rightOptionsContainer.setMask(rightMaskShape.createGeometryMask());

        this.scrollTrack = this.add.rectangle(
            this.leftPageRect.x + (this.leftPageRect.width / 2) - 15,
            this.leftPageRect.y,
            8,
            this.leftPageRect.height - 24,
            0x2e3f50,
            0.9
        ).setDepth(922).setInteractive({ useHandCursor: true });

        this.scrollThumb = this.add.rectangle(
            this.scrollTrack.x,
            this.scrollTrack.y,
            12,
            64,
            0x87a6c1,
            0.95
        ).setDepth(923).setInteractive({ draggable: true, useHandCursor: true });

        this.rightScrollTrack = this.add.rectangle(
            this.rightPageRect.x + (this.rightPageRect.width / 2) - 15,
            this.rightPageRect.y,
            8,
            this.rightPageRect.height - 24,
            0x2e3f50,
            0.9
        ).setDepth(922).setInteractive({ useHandCursor: true });

        this.rightScrollThumb = this.add.rectangle(
            this.rightScrollTrack.x,
            this.rightScrollTrack.y,
            12,
            64,
            0x87a6c1,
            0.95
        ).setDepth(923).setInteractive({ draggable: true, useHandCursor: true });

        this.input.setDraggable(this.rightScrollThumb);
        this.input.setDraggable(this.scrollThumb);
        this.input.on('drag', (pointer, gameObject, _dragX, dragY) => {
            if (gameObject === this.scrollThumb)
            {
                if (!this.leftScroll || this.leftScroll.maxOffset <= 0)
                {
                    return;
                }

                const top = this.getScrollTop();
                const bottom = this.getScrollBottom(this.leftScroll.thumbHeight);
                const clampedY = this.clamp(dragY, top, bottom);
                const ratio = bottom > top ? (clampedY - top) / (bottom - top) : 0;
                this.setLeftScrollOffset(this.leftScroll.maxOffset * ratio);
                return;
            }

            if (gameObject === this.rightScrollThumb)
            {
                if (!this.rightScroll || this.rightScroll.maxOffset <= 0)
                {
                    return;
                }

                const top = this.getRightScrollTop();
                const bottom = this.getRightScrollBottom(this.rightScroll.thumbHeight);
                const clampedY = this.clamp(dragY, top, bottom);
                const ratio = bottom > top ? (clampedY - top) / (bottom - top) : 0;
                this.setRightScrollOffset(this.rightScroll.maxOffset * ratio);
            }
        });

        this.scrollTrack.on('pointerdown', (pointer) => {
            if (!this.leftScroll || this.leftScroll.maxOffset <= 0)
            {
                return;
            }

            const top = this.getScrollTop();
            const bottom = this.getScrollBottom(this.leftScroll.thumbHeight);
            const clampedY = this.clamp(pointer.worldY, top, bottom);
            const ratio = bottom > top ? (clampedY - top) / (bottom - top) : 0;
            this.setLeftScrollOffset(this.leftScroll.maxOffset * ratio);
        });

        this.rightScrollTrack.on('pointerdown', (pointer) => {
            if (!this.rightScroll || this.rightScroll.maxOffset <= 0)
            {
                return;
            }

            const top = this.getRightScrollTop();
            const bottom = this.getRightScrollBottom(this.rightScroll.thumbHeight);
            const clampedY = this.clamp(pointer.worldY, top, bottom);
            const ratio = bottom > top ? (clampedY - top) / (bottom - top) : 0;
            this.setRightScrollOffset(this.rightScroll.maxOffset * ratio);
        });

        this.input.on('wheel', (pointer, _gameObjects, _deltaX, deltaY) => {
            const isInLeft = this.isPointerInsideLeftPage(pointer.worldX, pointer.worldY);
            const isInRight = this.isPointerInsideRightPage(pointer.worldX, pointer.worldY);

            if (isInLeft && this.leftScroll && this.leftScroll.maxOffset > 0)
            {
                this.setLeftScrollOffset(this.leftScroll.offset + (deltaY * 0.6));
            }
            else if (isInRight && this.rightScroll && this.rightScroll.maxOffset > 0)
            {
                this.setRightScrollOffset(this.rightScroll.offset + (deltaY * 0.6));
            }
        });

        const leftFields = [
            { label: 'Espacement segments', key: 'segmentSpacing', min: 1, max: 20, defaultValue: 3 },
            { label: 'Bots prise danger (0/1)', key: 'botUseDanger', min: 0, max: 1, defaultValue: 1 },
            { label: 'Bots délai décision (ms)', key: 'botTurnDelayMs', min: 50, max: 1000, defaultValue: 250 },
            { label: 'Bots vision unitaire', key: 'botVisionUnit', min: 50, max: 800, defaultValue: 200 },
            { label: 'Bots anticipation', key: 'botLookAhead', min: 20, max: 400, defaultValue: 110 },
            { label: 'Bots pas anti-piège', key: 'botTrapStep', min: 20, max: 300, defaultValue: 80 },
            { label: 'Bots seuil danger', key: 'botDangerThreshold', min: 300, max: 1100, defaultValue: 640 },
            { label: 'Bots niveau aggro ON', key: 'botAggressivityActiveLevel', min: 1, max: 11, defaultValue: 6 },
            { label: 'Bots distance danger proche', key: 'botClosePreyDistance', min: 100, max: 600, defaultValue: 300 },
            { label: 'Bots ferocité chasse', key: 'botHuntFerocity', min: 0, max: 3, defaultValue: 1 },
            { label: 'Points par orange', key: 'orangeScoreGain', min: 0, max: 10, defaultValue: 1 },
            { label: 'Taille par orange', key: 'orangeSizeGain', min: 0, max: 10, defaultValue: 1 },
            { label: 'Score initial', key: 'initialScore', min: 0, max: 100, defaultValue: 0 },
            { label: 'Taille initiale', key: 'initialSize', min: 1, max: 20, defaultValue: 4 },
            { label: 'Seuil kill bonus', key: 'killBonusThresholdSize', min: 1, max: 20, defaultValue: 8 },
            { label: 'Kill bonus (grand)', key: 'killBonusLargeScore', min: 0, max: 100, defaultValue: 25 },
            { label: 'Kill bonus (petit)', key: 'killBonusSmallScore', min: 0, max: 100, defaultValue: 10 },
            { label: 'Crash kill bonus', key: 'crashKillBonusScore', min: 0, max: 50, defaultValue: 5 },
            { label: 'Diable Cornu bonus', key: 'diableCornuScoreBonus', min: 0, max: 50, defaultValue: 3 },
            { label: 'Multiplicateur Sans', key: 'sansScoreMultiplier', min: 1, max: 10, defaultValue: 2 },
            { label: 'Pénalité Phoenix', key: 'phoenixRespawnScorePenalty', min: 0, max: 100, defaultValue: 10 }
        ];

        const rightFields = [
            { label: 'Lézard boost (x)', key: 'lizardBoostMultiplier', min: 1.2, max: 4, defaultValue: 2 },
            { label: 'Lézard durée (sec)', key: 'lizardBoostDurationSec', min: 1, max: 15, defaultValue: 3 },
            { label: 'Lézard recharge (sec)', key: 'lizardCooldownSec', min: 5, max: 120, defaultValue: 50 },
            { label: 'Basilic boost (x)', key: 'basilicBoostMultiplier', min: 1.2, max: 4, defaultValue: 2 },
            { label: 'Basilic durée (sec)', key: 'basilicBoostDurationSec', min: 1, max: 15, defaultValue: 2 },
            { label: 'Basilic recharge (sec)', key: 'basilicCooldownSec', min: 5, max: 120, defaultValue: 30 },
            { label: 'Caméléon invis. (sec)', key: 'cameleonInvisibilityDurationSec', min: 1, max: 30, defaultValue: 10 },
            { label: 'Caméléon recharge (sec)', key: 'cameleonCooldownSec', min: 5, max: 120, defaultValue: 40 },
            { label: 'Cracheur portée', key: 'cracheurShotDistance', min: 1, max: 4000, defaultValue: 500 },
            { label: 'Cracheur recharge (sec)', key: 'cracheurCooldownSec', min: 5, max: 120, defaultValue: 45 },
            { label: 'Paralysie cracheur (sec)', key: 'cracheurParalysisDurationSec', min: 1, max: 20, defaultValue: 5 },
            { label: 'Mamba boost (x)', key: 'mambaBoostMultiplier', min: 1.1, max: 5, defaultValue: 2 },
            { label: 'Mamba durée (sec)', key: 'mambaBoostDurationSec', min: 0.05, max: 2, defaultValue: 0.2 },
            { label: 'Worm Virus recharge (sec)', key: 'wormVirusCooldownSec', min: 5, max: 120, defaultValue: 35 },
            { label: 'Worm Virus vitesse caméra', key: 'wormVirusCameraMoveSpeed', min: 120, max: 1800, defaultValue: 520 },
            { label: 'Tortue espacement (x)', key: 'tortueSegmentSpacingMultiplier', min: 1, max: 3, defaultValue: 1.5 },
            { label: 'Boa multiplicateur taille', key: 'boaGrowthMultiplier', min: 1, max: 5, defaultValue: 2 },
            { label: 'Boa ralentit cible (x)', key: 'boaSlowTargetSpeedMultiplier', min: 0.1, max: 1, defaultValue: 0.8 },
            { label: 'Boa ralentit soi-meme (x)', key: 'boaSelfSlowSpeedMultiplier', min: 0.1, max: 1, defaultValue: 0.5 },
            { label: 'Aspirateur rayon', key: 'aspirateurRadius', min: 20, max: 250, defaultValue: 80 }
        ];

        let leftY = 0;
        for (const field of leftFields)
        {
            leftY = this.addOptionField(this.leftOptionsContainer, leftY, field);
        }

        let rightY = 0;
        this.addColumnTitle(this.rightOptionsContainer, rightY, 'POUVOIRS ET VITESSES');
        rightY += 34;
        for (const field of rightFields)
        {
            rightY = this.addOptionField(this.rightOptionsContainer, rightY, field);
        }

        this.add.text(
            this.rightPageRect.x,
            this.rightPageRect.y + (this.rightPageRect.height / 2) - 28,
            'Les valeurs sont sauvegardées localement',
            {
                fontFamily: 'Arial',
                fontSize: 12,
                color: '#8fb1cc',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(921);

        this.configureLeftScroll(leftY);
        this.configureRightScroll(rightY);

        const buttonY = 684;
        const returnButton = this.add.rectangle(230, buttonY, 200, 48, 0x6b2a2a, 1)
            .setStrokeStyle(2, 0xffffff, 0.85)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(920);

        this.add.text(230, buttonY, 'Retour', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(920);

        returnButton.on('pointerdown', () => {
            this.scene.stop('OptionsPanel');
        });

        const resetButton = this.add.rectangle(512, buttonY, 200, 48, 0x5c5f70, 1)
            .setStrokeStyle(2, 0xffffff, 0.85)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(920);

        this.add.text(512, buttonY, 'Réinitialiser', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(920);

        resetButton.on('pointerdown', () => {
            localStorage.removeItem('gameOptionsParams');
            this.scene.restart();
        });

        const saveButton = this.add.rectangle(794, buttonY, 200, 48, 0x1fa44a, 1)
            .setStrokeStyle(2, 0xffffff, 0.85)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(920);

        this.add.text(794, buttonY, 'Enregistrer', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(920);

        saveButton.on('pointerdown', () => {
            this.saveParams();
            this.statusText.setText('Paramètres enregistrés!');
            this.statusText.setAlpha(1);
            this.tweens.add({
                targets: this.statusText,
                alpha: { from: 1, to: 0 },
                duration: 2000,
                delay: 1000
            });
        });

        this.statusText = this.add.text(512, 748, '', {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#ffce80',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(920);

        EventBus.emit('current-scene-ready', this);
    }

    addColumnTitle (container, y, title)
    {
        const text = this.add.text(0, y, title, {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffce80'
        }).setOrigin(0, 0);
        container.add(text);
    }

    addOptionField (container, baseY, field)
    {
        const { label, key: paramKey, min, max, defaultValue } = field;
        const usesDecimal = !Number.isInteger(min) || !Number.isInteger(max) || !Number.isInteger(defaultValue);
        const currentValue = this.params[paramKey] !== undefined ? this.params[paramKey] : defaultValue;
        const normalizedValue = usesDecimal
            ? PhaserMath.Clamp(Number(currentValue), min, max)
            : PhaserMath.Clamp(Math.round(Number(currentValue)), min, max);

        this.params[paramKey] = Number.isFinite(normalizedValue) ? normalizedValue : defaultValue;

        const labelText = this.add.text(0, baseY, `${label}:`, {
            fontFamily: 'Arial',
            fontSize: 13,
            color: '#c4d8e7'
        }).setOrigin(0, 0);
        container.add(labelText);

        const minusButton = this.add.rectangle(248, baseY + 10, 24, 24, 0x44647a, 1)
            .setStrokeStyle(1, 0xffffff, 0.35)
            .setInteractive({ useHandCursor: true })
            .setDepth(920);
        container.add(minusButton);

        const minusLabel = this.add.text(248, baseY + 10, '-', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(920);
        container.add(minusLabel);

        const formatValue = (value) => {
            if (usesDecimal)
            {
                return String(Math.round(value * 10) / 10);
            }

            return String(Math.round(value));
        };

        const step = usesDecimal
            ? 0.1
            : (max - min <= 10 ? 1 : Math.ceil((max - min) / 10));

        const valueText = this.add.text(296, baseY + 2, formatValue(this.params[paramKey]), {
            fontFamily: 'Arial Black',
            fontSize: 14,
            color: '#ffce80'
        }).setOrigin(0.5, 0).setDepth(920);
        container.add(valueText);

        const setParamValue = (nextValue) => {
            const clamped = PhaserMath.Clamp(nextValue, min, max);
            this.params[paramKey] = usesDecimal
                ? Math.round(clamped * 10) / 10
                : Math.round(clamped);
            valueText.setText(formatValue(this.params[paramKey]));
        };

        minusButton.on('pointerdown', () => {
            setParamValue(Number(this.params[paramKey]) - step);
        });

        const plusButton = this.add.rectangle(342, baseY + 10, 24, 24, 0x44647a, 1)
            .setStrokeStyle(1, 0xffffff, 0.35)
            .setInteractive({ useHandCursor: true })
            .setDepth(920);
        container.add(plusButton);

        const plusLabel = this.add.text(342, baseY + 10, '+', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(920);
        container.add(plusLabel);

        plusButton.on('pointerdown', () => {
            setParamValue(Number(this.params[paramKey]) + step);
        });

        return baseY + 38;
    }

    configureLeftScroll (contentHeight)
    {
        const maxOffset = Math.max(0, contentHeight - this.leftPageViewportHeight);
        const trackHeight = this.scrollTrack.height;
        const thumbHeight = maxOffset > 0
            ? this.clamp((this.leftPageViewportHeight / Math.max(contentHeight, 1)) * trackHeight, 34, trackHeight)
            : trackHeight;

        this.leftScroll = {
            offset: 0,
            maxOffset,
            thumbHeight
        };

        this.scrollTrack.setVisible(maxOffset > 0);
        this.scrollThumb.setVisible(maxOffset > 0);
        this.scrollThumb.height = thumbHeight;
        this.setLeftScrollOffset(0);
    }

    setLeftScrollOffset (offset)
    {
        if (!this.leftScroll)
        {
            return;
        }

        this.leftScroll.offset = this.clamp(offset, 0, this.leftScroll.maxOffset);
        this.leftOptionsContainer.y = this.leftPageBaseY - this.leftScroll.offset;

        if (this.leftScroll.maxOffset <= 0)
        {
            return;
        }

        const top = this.getScrollTop();
        const bottom = this.getScrollBottom(this.leftScroll.thumbHeight);
        const ratio = this.leftScroll.maxOffset > 0 ? this.leftScroll.offset / this.leftScroll.maxOffset : 0;
        this.scrollThumb.y = top + ((bottom - top) * ratio);
    }

    configureRightScroll (contentHeight)
    {
        const maxOffset = Math.max(0, contentHeight - this.rightPageViewportHeight);
        const trackHeight = this.rightScrollTrack.height;
        const thumbHeight = maxOffset > 0
            ? this.clamp((this.rightPageViewportHeight / Math.max(contentHeight, 1)) * trackHeight, 34, trackHeight)
            : trackHeight;

        this.rightScroll = {
            offset: 0,
            maxOffset,
            thumbHeight
        };

        this.rightScrollTrack.setVisible(maxOffset > 0);
        this.rightScrollThumb.setVisible(maxOffset > 0);
        this.rightScrollThumb.height = thumbHeight;
        this.setRightScrollOffset(0);
    }

    setRightScrollOffset (offset)
    {
        if (!this.rightScroll)
        {
            return;
        }

        this.rightScroll.offset = this.clamp(offset, 0, this.rightScroll.maxOffset);
        this.rightOptionsContainer.y = this.rightPageBaseY - this.rightScroll.offset;

        if (this.rightScroll.maxOffset <= 0)
        {
            return;
        }

        const top = this.getRightScrollTop();
        const bottom = this.getRightScrollBottom(this.rightScroll.thumbHeight);
        const ratio = this.rightScroll.maxOffset > 0 ? this.rightScroll.offset / this.rightScroll.maxOffset : 0;
        this.rightScrollThumb.y = top + ((bottom - top) * ratio);
    }

    getScrollTop ()
    {
        return this.scrollTrack.y - (this.scrollTrack.height / 2) + (this.leftScroll.thumbHeight / 2);
    }

    getScrollBottom (thumbHeight)
    {
        return this.scrollTrack.y + (this.scrollTrack.height / 2) - (thumbHeight / 2);
    }

    getRightScrollTop ()
    {
        return this.rightScrollTrack.y - (this.rightScrollTrack.height / 2) + (this.rightScroll.thumbHeight / 2);
    }

    getRightScrollBottom (thumbHeight)
    {
        return this.rightScrollTrack.y + (this.rightScrollTrack.height / 2) - (thumbHeight / 2);
    }

    isPointerInsideLeftPage (x, y)
    {
        const left = this.leftPageRect.x - (this.leftPageRect.width / 2);
        const right = this.leftPageRect.x + (this.leftPageRect.width / 2);
        const top = this.leftPageRect.y - (this.leftPageRect.height / 2);
        const bottom = this.leftPageRect.y + (this.leftPageRect.height / 2);
        return x >= left && x <= right && y >= top && y <= bottom;
    }

    isPointerInsideRightPage (x, y)
    {
        const left = this.rightPageRect.x - (this.rightPageRect.width / 2);
        const right = this.rightPageRect.x + (this.rightPageRect.width / 2);
        const top = this.rightPageRect.y - (this.rightPageRect.height / 2);
        const bottom = this.rightPageRect.y + (this.rightPageRect.height / 2);
        return x >= left && x <= right && y >= top && y <= bottom;
    }

    clamp (value, min, max)
    {
        return Math.max(min, Math.min(max, value));
    }

    loadParams ()
    {
        try
        {
            const stored = localStorage.getItem('gameOptionsParams');
            if (stored)
            {
                this.params = JSON.parse(stored);
            }
        }
        catch (e)
        {
            console.error('Erreur chargement options:', e);
        }
    }

    saveParams ()
    {
        try
        {
            localStorage.setItem('gameOptionsParams', JSON.stringify(this.params));
        }
        catch (e)
        {
            console.error('Erreur sauvegarde options:', e);
        }
    }
}
