/* Wick - (c) 2017 Zach Rispoli, Luca Damasco, and Josh Rispoli */

/*  This file is part of Wick. 
    
    Wick is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Wick is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Wick.  If not, see <http://www.gnu.org/licenses/>. */

var WickPixiRenderer = function (canvasContainer) {

    var self = this;

    renderer = PIXI.autoDetectRenderer(720, 480, {
        backgroundColor : "#FFFFFF", 
        resolution: window.devicePixelRatio,
        preserveDrawingBuffer: true,
        antialias: true,
    });
    renderer.clearBeforeRender = false;
    renderer.roundPixels = false;
    renderer.view.setAttribute('tabindex', 0);

    canvasContainer.appendChild(renderer.view);
    renderer.view.focus()

    var container = new PIXI.Container();
    var pixiSprites = {};

    self.renderWickObjects = function (project, objects) {
        if(renderer.width !== project.width || renderer.height !== project.height)
            renderer.resize(project.width, project.height);
        renderer.view.style.width  = project.width  + "px";
        renderer.view.style.height = project.height + "px";

        var graphics = new PIXI.Graphics();
        graphics.beginFill(parseInt(project.backgroundColor.replace("#","0x")));
        graphics.drawRect(0, 0, project.width, project.height);
        graphics.endFill();
        renderer.render(graphics);

        for (uuid in pixiSprites) {
            pixiSprites[uuid].visible = false;
        }

        objects.forEach(function (object) {
            if(!pixiSprites[object.uuid]) {
                createPixiSprite(object);
            }
            renderWickObject(object);
        });
        renderer.render(container);
    }

    function renderWickObject (object) {
        var sprite = pixiSprites[object.uuid];
        if(sprite) {
            sprite.visible = true;
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.position.x = object.x
            sprite.position.y = object.y
            sprite.rotation = object.rotation/360*2*3.14159;
            sprite.scale.x = object.scaleX;
            sprite.scale.y = object.scaleY;
            sprite.alpha = object.opacity;
            sprite.scale.x *= (object.flipX ? -1 : 1);
            sprite.scale.y *= (object.flipY ? -1 : 1);
        }

        object.getAllActiveChildObjects().forEach(function (child) {
            renderWickObject(child);
        });
    }

    function createPixiSprite (wickObject) {
        var type;

        if (wickObject.asset && wickObject.asset.type === 'image') {
            type = 'image';
        } else if (wickObject.pathData) {
            type = 'svg';
        } else if (wickObject.textData) {
            type = 'text';
        }

        if(type) {
            var newPixiSprite = WickToPixiSprite[type](wickObject);
            container.addChild(newPixiSprite);
            pixiSprites[wickObject.uuid] = newPixiSprite;
            // wickObject.generateAlphaMask(pixiObject.texture.baseTexture.imageUrl);
        }
        
    }

    var WickToPixiSprite = {
        'image': function (wickObject) {
            var pixiSprite = PIXI.Sprite.fromImage(object.asset.getData());
            return pixiSprite;
        },
        'svg': function (wickObject) {
            var parser = new DOMParser();
            var x = (wickObject.svgX || 0);
            var y = (wickObject.svgY || 0);
            if(!wickObject.svgStrokeWidth) wickObject.svgStrokeWidth = 0;
            x -= wickObject.svgStrokeWidth/2;
            y -= wickObject.svgStrokeWidth/2;
            var w = (wickObject.width  + wickObject.svgStrokeWidth*1);
            var h = (wickObject.height + wickObject.svgStrokeWidth*1);
            var svgDoc = parser.parseFromString('<svg id="svg" viewBox="'+x+' '+y+' '+w+' '+h+'" version="1.1" width="'+w+'" height="'+h+'" xmlns="http://www.w3.org/2000/svg">'+wickObject.pathData+'</svg>', "image/svg+xml");
            var s = new XMLSerializer().serializeToString(svgDoc);
            var base64svg = 'data:image/svg+xml;base64,' + window.btoa(s);
            
            var newSprite = PIXI.Sprite.fromImage(base64svg);
            return newSprite;
        },
        'text': function (wickObject) {
            var style = {
                font : wickObject.textData.fontWeight + " " + wickObject.textData.fontStyle + " " + wickObject.textData.fontSize + "px " + wickObject.textData.fontFamily,
                fill : wickObject.textData.fill,
                wordWrap : true,
                wordWrapWidth : 1440,
                align: wickObject.textData.textAlign
            };
            var pixiText = new PIXI.Text(wickObject.textData.text, style);
            return pixiText;
        }
    }

};
