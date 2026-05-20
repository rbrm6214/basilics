import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class RulesPanel extends Scene
{
    currentPage = 1;

    constructor ()
    {
        super('RulesPanel');
    }

    create ()
    {
        this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.85).setScrollFactor(0).setDepth(900);

        const panelWidth = 920;
        const panelHeight = 640;
        const panelX = 512;
        const panelY = 384;

        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a2a3a, 1)
            .setStrokeStyle(3, 0xffffff, 0.85)
            .setScrollFactor(0)
            .setDepth(910);

        this.titleText = this.add.text(panelX, 115, 'RÉGLES DU JEU', {
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

        this.leftPageBaseX = this.leftPageRect.x - (this.leftPageRect.width / 2) + 16;
        this.leftPageBaseY = this.leftPageRect.y - (this.leftPageRect.height / 2) + 16;
        this.leftPageViewportHeight = this.leftPageRect.height - 32;
        this.leftPageViewportWidth = this.leftPageRect.width - 52;
        this.rightPageBaseX = this.rightPageRect.x - (this.rightPageRect.width / 2) + 16;
        this.rightPageBaseY = this.rightPageRect.y - (this.rightPageRect.height / 2) + 16;
        this.rightPageViewportHeight = this.rightPageRect.height - 32;
        this.rightPageViewportWidth = this.rightPageRect.width - 52;

        this.leftContentContainer = this.add.container(this.leftPageBaseX, this.leftPageBaseY).setDepth(920);
        this.leftContentText = this.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#c4d8e7',
            align: 'left',
            wordWrap: { width: this.leftPageViewportWidth }
        }).setOrigin(0, 0);
        this.leftContentContainer.add(this.leftContentText);

        const leftMaskShape = this.make.graphics();
        leftMaskShape.fillStyle(0xffffff, 1);
        leftMaskShape.fillRect(
            this.leftPageRect.x - (this.leftPageRect.width / 2) + 12,
            this.leftPageRect.y - (this.leftPageRect.height / 2) + 12,
            this.leftPageViewportWidth,
            this.leftPageViewportHeight
        );
        this.leftContentContainer.setMask(leftMaskShape.createGeometryMask());

        this.rightContentContainer = this.add.container(this.rightPageBaseX, this.rightPageBaseY).setDepth(920);
        this.rightContentText = this.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#c4d8e7',
            align: 'left',
            wordWrap: { width: this.rightPageViewportWidth }
        }).setOrigin(0, 0);
        this.rightContentContainer.add(this.rightContentText);

        const rightMaskShape = this.make.graphics();
        rightMaskShape.fillStyle(0xffffff, 1);
        rightMaskShape.fillRect(
            this.rightPageRect.x - (this.rightPageRect.width / 2) + 12,
            this.rightPageRect.y - (this.rightPageRect.height / 2) + 12,
            this.rightPageViewportWidth,
            this.rightPageViewportHeight
        );
        this.rightContentContainer.setMask(rightMaskShape.createGeometryMask());

        this.scrollTrack = this.add.rectangle(
            this.leftPageRect.x + (this.leftPageRect.width / 2) - 16,
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
            this.rightPageRect.x + (this.rightPageRect.width / 2) - 16,
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
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
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

        const navButtonY = 678;

        this.page1Button = this.add.rectangle(panelX - 230, navButtonY, 130, 42, 0x1fa44a, 1)
            .setStrokeStyle(2, 0xffffff, 0.85)
            .setInteractive({ useHandCursor: true })
            .setDepth(920);
        this.add.text(panelX - 230, navButtonY, 'Scoring', {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(921);
        this.page1Button.on('pointerdown', () => this.showPage(1));

        this.page2Button = this.add.rectangle(panelX - 70, navButtonY, 130, 42, 0x44647a, 1)
            .setStrokeStyle(2, 0xffffff, 0.85)
            .setInteractive({ useHandCursor: true })
            .setDepth(920);
        this.add.text(panelX - 70, navButtonY, 'Pouvoirs', {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(921);
        this.page2Button.on('pointerdown', () => this.showPage(2));

        const returnButton = this.add.rectangle(panelX + 245, navButtonY, 130, 42, 0x6b2a2a, 1)
            .setStrokeStyle(2, 0xffffff, 0.85)
            .setInteractive({ useHandCursor: true })
            .setDepth(920);
        this.add.text(panelX + 245, navButtonY, 'Retour', {
            fontFamily: 'Arial Black',
            fontSize: 13,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(921);
        returnButton.on('pointerdown', () => this.scene.stop('RulesPanel'));

        this.showPage(1);

        EventBus.emit('current-scene-ready', this);
    }

    showPage (pageNumber)
    {
        this.currentPage = pageNumber;

        if (pageNumber === 1)
        {
            this.page1Button.setFillStyle(0x1fa44a);
            this.page2Button.setFillStyle(0x44647a);
            this.titleText.setText('RÉGLES - SCORING');

            const content = this.getScoringRules();
            this.leftContentText.setText(content.left);
            this.rightContentText.setText(content.right);
        }
        else
        {
            this.page1Button.setFillStyle(0x44647a);
            this.page2Button.setFillStyle(0x1fa44a);
            this.titleText.setText('RÉGLES - POUVOIRS');

            const content = this.getPowerRules();
            this.leftContentText.setText(content.left);
            this.rightContentText.setText(content.right);
        }

        this.configureLeftScroll();
        this.configureRightScroll();
    }

    configureLeftScroll ()
    {
        const contentHeight = Math.max(this.leftContentText.height, 1);
        const maxOffset = Math.max(0, contentHeight - this.leftPageViewportHeight);
        const trackHeight = this.scrollTrack.height;
        const thumbHeight = maxOffset > 0
            ? this.clamp((this.leftPageViewportHeight / contentHeight) * trackHeight, 34, trackHeight)
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
        this.leftContentContainer.y = this.leftPageBaseY - this.leftScroll.offset;

        if (this.leftScroll.maxOffset <= 0)
        {
            return;
        }

        const top = this.getScrollTop();
        const bottom = this.getScrollBottom(this.leftScroll.thumbHeight);
        const ratio = this.leftScroll.maxOffset > 0 ? this.leftScroll.offset / this.leftScroll.maxOffset : 0;
        this.scrollThumb.y = top + ((bottom - top) * ratio);
    }

    configureRightScroll ()
    {
        const contentHeight = Math.max(this.rightContentText.height, 1);
        const maxOffset = Math.max(0, contentHeight - this.rightPageViewportHeight);
        const trackHeight = this.rightScrollTrack.height;
        const thumbHeight = maxOffset > 0
            ? this.clamp((this.rightPageViewportHeight / contentHeight) * trackHeight, 34, trackHeight)
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
        this.rightContentContainer.y = this.rightPageBaseY - this.rightScroll.offset;

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

    getScoringRules ()
    {
        return {
            left: `ORANGES\n• Orange normale: +1 score\n• Elle fait aussi grandir le serpent\n• Orange empoisonnée: -1 taille, mort si taille 1\n\nTAILLE VS SCORE\n• Taille = avantage de collision\n• Score = classement final\n• Les deux évoluent séparément\n• On peut perdre du score sans perdre sa taille\n\nDUELS ET COUPES\n• Tête contre tête: le plus grand survit\n• Même taille: mort mutuelle\n• Couper un plus petit donne l'avantage de terrain\n• Certains pouvoirs modifient ces règles\n\nBONUS D'ÉLIMINATION\n• Crash sur un grand corps: bonus crash au défenseur\n• Coupe d'un serpent >= seuil: bonus grand\n• Sinon: bonus petit\n• Les valeurs sont réglables dans Options\n\nPLACEMENT\n• 1er: +100\n• 2e: +50\n• 3e: +25\n• Donnés à toute fin de partie`,
            right: `BONUS TEMPS\n• Réservé au vainqueur\n• 0:00 => +500\n• 2:30 => +250\n• 5:00 ou plus => +0\n• Calcul linéaire entre ces bornes\n\nPOUVOIR SANS\n• Multiplie par x2 les points gagnés\n• S'applique aussi aux bonus de placement\n• N'affecte pas le bonus temps\n\nHIGHSCORES\n• Seul le vainqueur peut être enregistré\n• Le score retenu inclut placement + bonus temps\n• Chaque entrée garde aussi le pouvoir,\n  le nombre total de serpents et le chrono\n\nÀ RETENIR\n• Le plus grand serpent n'est pas toujours premier\n• Le classement peut bouger fortement à la fin\n• Il faut surveiller taille, score et survie en parallèle`
        };
    }

    getPowerRules ()
    {
        return {
            left: `SANS\n• Aucun effet actif\n• Score x2 sur les gains et le placement\n\nLUNETTE\n• Affiche taille et pouvoir des adversaires\n\nLÉZARD\n• Après une coupe réussie: boost temporaire\n• Cooldown configurable\n\nANGUILLE\n• Ignore l'auto-collision\n\nBASILIC\n• Boost activable avec la touche d'action\n• Durée et cooldown configurables\n\nPHOENIX\n• Plusieurs vies\n• À chaque retour: pénalité de score\n• Respawn après délai puis repousse progressive\n\nTORTUE\n• Plus lente\n• Corps plus compact et plus épais visuellement\n• Son corps agit comme un mur: on ne le coupe pas`,
                right: `DIABLE CORNU\n• Si un plus grand le coupe, l'attaquant perd jusqu'à 4 segments\n• La partie coupée laisse des oranges empoisonnées\n• Le défenseur gagne un bonus de score\n\nCAMÉLÉON\n• Invisibilité temporaire activable\n• Son propre joueur le voit toujours\n• Lunette ne récupère qu'une info partielle\n\nLEURRE\n• La taille affichée est plafonnée\n• La vraie puissance ne change pas\n\nCRACHEUR\n• Tire un projectile empoisonné\n• Peut paralyser et contaminer les oranges\n\nSALAMANDRE\n• Traverse le corps des plus grands\n• Coupe normalement les plus petits\n\nSPHINX\n• Double le bonus de crash reçu en défense\n• Grossit visuellement plus vite que sa taille réelle\n\nBOA\n• Sur plus petit: ne meurt pas au contact du corps adverse\n• Le contact ralentit la cible\n• S'il s'emmêle lui-même, il se ralentit aussi\n• Chaque orange le fait grandir davantage\n\nASPIRATEUR\n• Ramasse les oranges dans une zone autour de la tête\n• Portée configurable\n\nMAMBA\n• Boost après orange, coupe ou élimination\n\nWORM VIRUS\n• Ciblage libre pendant 5 secondes\n• Téléportation au centre de l'écran\n• Le corps réapparaît ensuite progressivement`
        };
    }
}
