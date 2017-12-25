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
    
var TimelineInterface = function (wickEditor) {

    var self = this;

    var lastObject;

    var timeline;

    //var cssVars;
    //var cssVar;

    self.setup = function () {

        // Load style vars from CSS
        window.cssVars = window.getComputedStyle(document.body);
        window.cssVar = function (varName) {
            return parseInt(cssVars.getPropertyValue(varName));
        }

        // Build timeline in DOM
        timeline = new TimelineInterface.Timeline(wickEditor);
        timeline.build();
    }

    self.syncWithEditorState = function () {

        if (lastObject !== wickEditor.project.currentObject || wickEditor.project.currentObject.framesDirty) {
            wickEditor.project.currentObject.framesDirty = false;
            lastObject = wickEditor.project.currentObject;

            timeline.rebuild();
        }

        timeline.update();

    }

    self.getElem = function () {
        return timeline;
    }

    self.resetScrollbars = function () {
        timeline.horizontalScrollBar.reset();
        timeline.verticalScrollBar.reset();
    }

    self.updateZoomBox = function () {
        timeline.updateZoomBox();
    }

}

TimelineInterface.Timeline = function (wickEditor) {
    this.elem = null;

    this.layersContainer = new TimelineInterface.LayersContainer(wickEditor, this);
    this.framesContainer = new TimelineInterface.FramesContainer(wickEditor, this);
    this.horizontalScrollBar = new TimelineInterface.HorizontalScrollBar(wickEditor, this);
    this.verticalScrollBar = new TimelineInterface.VerticalScrollBar(wickEditor, this);
    this.numberLine = new TimelineInterface.NumberLine(wickEditor, this);
    this.playhead = new TimelineInterface.Playhead(wickEditor, this);

    this.interactions = new TimelineInterface.Interactions(wickEditor, this);
    this.interactions.setup();

    var onionSkinningButton;

    this.build = function () {
        this.elem = document.createElement('div');
        document.getElementById('timelineGUI').appendChild(this.elem);

        this.framesContainer.build();
        this.elem.appendChild(this.framesContainer.elem);

        this.layersContainer.build();
        this.elem.appendChild(this.layersContainer.elem);

        this.numberLine.build();
        this.elem.appendChild(this.numberLine.elem);

        this.playhead.build();
        this.elem.appendChild(this.playhead.elem);

        var hideNumberlinePiece = document.createElement('div');
        hideNumberlinePiece.className = 'hide-number-line-piece';
        this.elem.appendChild(hideNumberlinePiece);
        
        var hideLayersPiece = document.createElement('div');
        hideLayersPiece.className = 'layer-toolbar';
        this.elem.appendChild(hideLayersPiece);

        var addLayerButton = document.createElement('div');
        addLayerButton.className = 'layer-tools-button add-layer-button tooltipElem';
        addLayerButton.setAttribute('alt', "Add Layer");
        addLayerButton.addEventListener('mousedown', function (e) {
            wickEditor.guiActionHandler.doAction('addLayer');
        });
        this.elem.appendChild(addLayerButton);

        var deleteLayerButton = document.createElement('div');
        deleteLayerButton.className = 'layer-tools-button delete-layer-button tooltipElem';
        deleteLayerButton.setAttribute('alt', "Delete Layer");
        deleteLayerButton.addEventListener('mousedown', function (e) {
            wickEditor.guiActionHandler.doAction('removeLayer');
        });
        this.elem.appendChild(deleteLayerButton);

        onionSkinningButton = document.createElement('div');
        onionSkinningButton.className = 'layer-tools-button onion-skin-button tooltipElem';
        onionSkinningButton.setAttribute('alt', "Toggle Onion Skinning");
        onionSkinningButton.style.backgroundColor = wickEditor.project.onionSkinning ? 'orange' : '#F0EFEF';
        onionSkinningButton.addEventListener('mousedown', function (e) {
            wickEditor.project.onionSkinning = !wickEditor.project.onionSkinning;
            wickEditor.syncInterfaces();
        });
        this.elem.appendChild(onionSkinningButton);


        var previewPlayButton = document.createElement('div');
        previewPlayButton.className = 'layer-tools-button play-preview-button tooltipElem';
        previewPlayButton.setAttribute('alt', "Play Preview (Enter)<br/>(Shift+Click to loop)");
        previewPlayButton.addEventListener('mousedown', function (e) {
            wickEditor.guiActionHandler.doAction('previewPlay', {loop:e.shiftKey});
        });
        this.elem.appendChild(previewPlayButton);

        var previewPauseButton = document.createElement('div');
        previewPauseButton.className = 'layer-tools-button pause-preview-button tooltipElem';
        previewPauseButton.setAttribute('alt', "Pause Preview (Enter)");
        previewPauseButton.addEventListener('mousedown', function (e) {
            wickEditor.guiActionHandler.doAction('previewPause');
        });
        this.elem.appendChild(previewPauseButton);

        /*var previewStepForwardButton = document.createElement('div');
        previewStepForwardButton.className = 'layer-tools-button step-forward-preview-button tooltipElem';
        previewStepForwardButton.setAttribute('alt', "Step Forwards (.)");
        previewStepForwardButton.addEventListener('mousedown', function (e) {
            wickEditor.guiActionHandler.doAction('movePlayheadRight');
        });
        this.elem.appendChild(previewStepForwardButton);

        var previewStepBackwardButton = document.createElement('div');
        previewStepBackwardButton.className = 'layer-tools-button step-backward-preview-button tooltipElem';
        previewStepBackwardButton.setAttribute('alt', "Step Backwards (,)");
        previewStepBackwardButton.addEventListener('mousedown', function (e) {
            wickEditor.guiActionHandler.doAction('movePlayheadLeft');
        });
        this.elem.appendChild(previewStepBackwardButton);*/

        this.horizontalScrollBar.build();
        this.elem.appendChild(this.horizontalScrollBar.elem);

        /*var hideScrollbarConnectPiece  = document.createElement('div'); 
        hideScrollbarConnectPiece.className = 'hide-scrollbar-connect-piece';
        this.elem.appendChild(hideScrollbarConnectPiece); */
        var zoomBox = document.createElement('div');
        zoomBox.className = 'zoom-box';
        this.elem.appendChild(zoomBox);
        self.numberInput = new SlideyNumberInput({
            onsoftchange: function (e) {
                wickEditor.canvas.setZoom(e/100, true);
            },
            onhardchange: function (e) {
                wickEditor.canvas.setZoom(e/100, true);
            },
            min: 1,
            max: 500,
            moveFactor: 0.5,
            initValue: 100,
        });
        self.numberInput.className = 'timeline-number-input';
        zoomBox.appendChild(self.numberInput);
        var zoomIcon = document.createElement('div');
        zoomIcon.className = 'timeline-zoom-icon';
        zoomIcon.onclick = function () {
            wickEditor.canvas.recenterCanvas();
            wickEditor.syncInterfaces();
        }
        zoomBox.appendChild(zoomIcon);
        var zoomPercentSign = document.createElement('div');
        zoomPercentSign.className = 'timeline-zoom-percent-sign';
        zoomPercentSign.innerHTML = '%'
        zoomBox.appendChild(zoomPercentSign);

        this.verticalScrollBar.build();
        this.elem.appendChild(this.verticalScrollBar.elem);
    }
    
    this.rebuild = function () {
        this.layersContainer.rebuild();
        this.framesContainer.rebuild();
        this.numberLine.rebuild();
    }

    this.update = function () {
        this.layersContainer.update();
        this.framesContainer.update();
        this.elem.style.height = this.calculateHeight() + "px";

        this.numberLine.update();
        this.playhead.update();

        this.horizontalScrollBar.update();
        this.verticalScrollBar.update();

        onionSkinningButton.style.backgroundColor = wickEditor.project.onionSkinning ? 'orange' : '#F0EFEF';

        this.updateZoomBox();

        resetFrameSize();
    }

    this.updateZoomBox = function () {
        self.numberInput.value = Math.floor(wickEditor.canvas.getZoom() * 100);
    }

    this.calculateHeight = function () {
        var maxTimelineHeight = cssVar("--max-timeline-height");
        var expectedTimelineHeight = this.layersContainer.layers.length * cssVar("--layer-height") + 44; 
        return Math.min(expectedTimelineHeight, maxTimelineHeight); 
    }

    var resetFrameSize = function () {
        var newFrameWidth = 20;
        var newHandleWidth = 5;
        document.body.style.setProperty('--frame-width', newFrameWidth+'px');
        document.body.style.setProperty('--frame-handle-width', newHandleWidth+'px');
    }
}

TimelineInterface.HorizontalScrollBar = function (wickEditor, timeline) {
    var that = this;

    this.elem = null;

    var leftButton;
    var rightButton;
    var head;

    var scrollbar;

    var heldDownInterval;

    this.build = function () {
        this.elem = document.createElement('div');
        this.elem.className = 'scrollbar horizontal-scrollbar';

        head = document.createElement('div');
        head.className = 'scrollbar-head scrollbar-head-horizontal';
        head.addEventListener('mousedown', function (e) {
            timeline.interactions.start('dragHorizontalScrollbarHead')
        })
        this.elem.appendChild(head);

        leftButton = document.createElement('div');
        leftButton.className = 'scrollbar-button scrollbar-button-left';
        leftButton.addEventListener('mousedown', function (e) {
            //that.scroll(-10);
            clearInterval(heldDownInterval);
            heldDownInterval = setInterval(function () {
                that.scroll(-3);
            }, 1000/30)
        });
        leftButton.addEventListener('mouseup', function (e) {
            clearInterval(heldDownInterval);
        });
        this.elem.appendChild(leftButton);

        rightButton = document.createElement('div');
        rightButton.className = 'scrollbar-button scrollbar-button-right';
        rightButton.addEventListener('mousedown', function (e) {
            //that.scroll(10);
            clearInterval(heldDownInterval);
            heldDownInterval = setInterval(function () {
                that.scroll(3);
            }, 1000/30)
        });
        rightButton.addEventListener('mouseup', function (e) {
            clearInterval(heldDownInterval);
        });
        this.elem.appendChild(rightButton);

        scrollbar = new Scrollbar(10, 20, 30);
        setTimeout(function () {
            scrollbar.setScrollbarContainerSize(that.elem.offsetWidth-30);
            scrollbar.setViewboxSize(that.elem.offsetWidth);
        }, 100);

        $(window).resize(function() {
            scrollbar.setScrollbarContainerSize(that.elem.offsetWidth-30);
            scrollbar.setViewboxSize(that.elem.offsetWidth);
            that.update()
        });
    }

    this.update = function () {
        var frameCount = wickEditor.project.getCurrentObject().getTotalTimelineLength();
        var buffer = 1000 + window.innerWidth;
        var contentSize = frameCount * cssVar('--frame-width') + buffer;
        scrollbar.setContentSize(contentSize)
        head.style.marginLeft = scrollbar.barPosition + cssVar('--scrollbar-thickness') + 'px';
        head.style.width = scrollbar.barSize + 'px';
    }

    this.scroll = function (scrollAmt) {
        scrollbar.setBarPosition(scrollbar.barPosition + scrollAmt);
        timeline.framesContainer.update();
        timeline.numberLine.update();
        timeline.playhead.update();
        that.update();
    }

    this.getScrollPosition = function () {
        return scrollbar.viewboxPosition;
    }

    this.reset = function () {
        scrollbar.setBarPosition(0);
    }
}

TimelineInterface.VerticalScrollBar = function (wickEditor, timeline) {
    var that = this;

    this.elem = null;

    var topButton;
    var bottomButton
    var head;

    var scrollbar;

    var heldDownInterval;

    this.build = function () {
        this.elem = document.createElement('div');
        this.elem.className = 'scrollbar vertical-scrollbar';

        head = document.createElement('div');
        head.className = 'scrollbar-head scrollbar-head-vertical';
        head.addEventListener('mousedown', function (e) {
            timeline.interactions.start('dragVerticalScrollbarHead');
        })
        this.elem.appendChild(head);

        topButton = document.createElement('div');
        topButton.className = 'scrollbar-button scrollbar-button-top';
        topButton.addEventListener('mousedown', function (e) {
            //that.scroll(-20)
            clearInterval(heldDownInterval);
            heldDownInterval = setInterval(function () {
                that.scroll(-3);
            }, 1000/30)
        });
        topButton.addEventListener('mouseup', function (e) {
            clearInterval(heldDownInterval);
        });
        this.elem.appendChild(topButton);

        bottomButton = document.createElement('div');
        bottomButton.className = 'scrollbar-button scrollbar-button-bottom';
        bottomButton.addEventListener('mousedown', function (e) {
            //that.scroll(20)
            clearInterval(heldDownInterval);
            heldDownInterval = setInterval(function () {
                that.scroll(3);
            }, 1000/30)
        });
        bottomButton.addEventListener('mouseup', function (e) {
            clearInterval(heldDownInterval);
        });
        this.elem.appendChild(bottomButton);

        scrollbar = new Scrollbar(10, 100, 300);
    },

    this.update = function () {
        var nLayers = wickEditor.project.getCurrentObject().layers.length;

        if(nLayers < 4) {
            this.elem.style.display = 'none';
            return;
        }
        this.elem.style.display = 'block';

        //head.style.height = parseInt(timeline.elem.style.height)/4 + 'px';
        //head.style.marginTop = scrollbar.barPosition + cssVar('--scrollbar-thickness') + cssVar('--number-line-height') + 'px';
    
        scrollbar.setScrollbarContainerSize(that.elem.offsetHeight);
        scrollbar.setViewboxSize(that.elem.offsetHeight-10);
        var contentSize = nLayers * cssVar('--layer-height');
        scrollbar.setContentSize(contentSize);
        head.style.marginTop = scrollbar.barPosition + cssVar('--scrollbar-thickness') + 'px';
        head.style.height = scrollbar.barSize - 30 + 'px';
    }

    this.scroll = function (scrollAmt) {
        scrollbar.setBarPosition(scrollbar.barPosition+scrollAmt);
        timeline.framesContainer.update();
        that.update();
    }

    this.getScrollPosition = function () {
        return scrollbar.viewboxPosition;
    }

    this.reset = function () {
        scrollbar.setBarPosition(0);
    }
}

TimelineInterface.NumberLine = function (wickEditor, timeline) {
    var that = this;

    this.elem = null;

    this.playRanges = null;

    var numberlineContainer;
    var numbers = [];
    var bars = [];

    this.build = function () {
        this.elem = document.createElement('div');
        this.elem.addEventListener('mousedown', function (e) {
            timeline.interactions.start("dragPlayhead", e, {});
        })
        this.elem.className = 'number-line';

        numberlineContainer = document.createElement('span');
        numberlineContainer.className = 'numberline-container';
        this.elem.appendChild(numberlineContainer);

        this.playRanges = [];
    }

    this.update = function () {
        var shift = -timeline.horizontalScrollBar.getScrollPosition();

        this.elem.style.left = shift+cssVar('--layers-width')+'px';

        numberlineContainer.style.left = -shift+(shift%cssVar('--frame-width'))+'px';

        this.playRanges.forEach(function (playRange) {
            //playRange.update();
        });

        for(var i = 0; i < numbers.length; i++) {
            var num = i+1+Math.floor(-shift/cssVar('--frame-width'));
            numbers[i].innerHTML = num;
            numbers[i].className = 'number-line-cell-number';
            //if(wickEditor.project.smallFramesMode) {
                if(num % 5 !== 0 && num !== 1)  {
                    numbers[i].innerHTML = '';
                    bars[i].style.opacity = '0.2';
                } else {
                    bars[i].style.opacity = '1.0';
                }
                numbers[i].className += ' number-line-cell-number-small';
            //}
        }
    }

    this.rebuild = function () {

        this.elem.innerHTML = ''
        this.elem.appendChild(numberlineContainer)
        numberlineContainer.innerHTML = ""

        numbers = []
        bars = []
        for(var i = 0; i < 70; i++) {
            var numberLineCell = document.createElement('div');
            numberLineCell.className = 'number-line-cell';
            numberLineCell.style.left = i*cssVar('--frame-width') +cssVar('--frames-cell-first-padding') + 'px'
            
            var bar = document.createElement('div');
            bar.className = 'number-line-cell-bar';
            numberLineCell.appendChild(bar);
            bars.push(bar);

            var number = document.createElement('div');
            number.className = 'number-line-cell-number';
            numberLineCell.appendChild(number);
            numbers.push(number);
            
            numberlineContainer.appendChild(numberLineCell);
        }

        /*this.playRanges.forEach(function (playrange) {
            that.elem.removeChild(playrange.elem);
        });*/

        this.playRanges = [];

        /*wickEditor.project.getCurrentObject().playRanges.forEach(function (wickPlayrange) {
            var newPlayrange = new TimelineInterface.PlayRange(wickEditor, timeline);
            newPlayrange.wickPlayrange = wickPlayrange;
            newPlayrange.build();
            that.elem.appendChild(newPlayrange.elem);
            that.playRanges.push(newPlayrange)
        });*/
    }
}

TimelineInterface.Playhead = function (wickEditor, timeline) {
    var self = this;

    self.elem = null;
    self.pos = null;

    var framePosCached = 0;

    self.build = function () {
        self.elem = document.createElement('div');
        self.elem.className = 'playhead';

        var playheadNub = document.createElement('div');
        playheadNub.className = 'playhead-nub';
        self.elem.addEventListener('mousedown', function (e) {
            timeline.interactions.start("dragPlayhead", e, {});
        });
        self.elem.appendChild(playheadNub);

        window.addEventListener('mousemove', function (e) {
            self.elem.style.pointerEvents = (e.y>60) ? 'none' : 'auto';
        });

        var playheadBody = document.createElement('div');
        playheadBody.className = 'playhead-body';
        self.elem.appendChild(playheadBody);
    }

    self.update = function () {
        self.setPosition(wickEditor.project.currentObject.playheadPosition * cssVar('--frame-width'));
        snapPosition()
        updateView();
    }

    self.setPosition = function (pos) {
        self.pos = pos;
        updateView();
    }

    self.snap = function () {
        snapPosition();
        updateView();
    }

    self.getFramePosition = function () {
        var framePos = Math.floor(self.pos/cssVar('--frame-width'));
        return framePos;
    }

    self.frameDidChange = function () {
        if(!framePosCached) {
            framePosCached = self.getFramePosition();
            return true;
        } else {
            var newFramePos = self.getFramePosition();
            var frameChanged = newFramePos !== framePosCached;
            framePosCached = newFramePos;
            return frameChanged;
        }
    }

    function updateView () {
        var shift = -timeline.horizontalScrollBar.getScrollPosition();
        self.elem.style.left = (self.pos+132+shift)+'px';
    }

    function snapPosition () {
        self.pos = Math.floor(self.pos/cssVar('--frame-width'))*cssVar('--frame-width')
        self.pos += cssVar('--frame-width')/2;
    }
}