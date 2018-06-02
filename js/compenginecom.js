// Debugging component that renders the whole scene graph
class DebugComponent extends Component {
    constructor(targetHtmlElement) {
        super();
        this.targetHtmlElement = targetHtmlElement; // TODO add something more generic here
        this.strWrapper = { str: '' };
    }

    oninit() {
        if (this.owner.parent != null) {
            throw new Error('DebugComponent must be attached to the very root!');
        }

        let originalDraw = this.scene.draw;
        var self = this;

        // todo draw method is replaced which is not a good approach
        /*	this.scene.draw = () => {
                for (let gameObject of self.scene.sortedObjects) {
                    gameObject.draw(self.scene.canvasCtx);
                }
    
                let strokeStyle = self.scene.canvasCtx.strokeStyle;
                self.scene.canvasCtx.beginPath();
                self.scene.canvasCtx.strokeStyle = "red";
                self._drawBoundingBox(self.scene.canvasCtx, self.owner);
                self.scene.canvasCtx.stroke();
                self.scene.canvasCtx.strokeStyle = strokeStyle;
            };*/
    }

    update(delta, absolute) {
        this.strWrapper.str = '';
        this._processNode(this.owner, this.strWrapper);
        this.targetHtmlElement.innerHTML = this.strWrapper.str;
    }

    _drawBoundingBox(ctx, node) {
        if (node.tag.indexOf('bubble') != -1) return;

        let bb = node.mesh.bbox;
        let posX = bb.topLeftX * UNIT_SIZE;
        let posY = bb.topLeftY * UNIT_SIZE;
        let size = bb.getSize();

        //node.trans.rotationOffsetX = node.trans.rotationOffsetY = 0;
        if (size.width != 0 && size.height != 0) {
            ctx.rect(posX, posY, size.width * UNIT_SIZE, size.height * UNIT_SIZE);
        }

        ctx.rect(
            node.trans.absPosX * UNIT_SIZE,
            node.trans.absPosY * UNIT_SIZE,
            10,
            10
        );

        for (let [id, child] of node.children) {
            this._drawBoundingBox(ctx, child);
        }
    }

    _setPadding(padding) {
        let otp = '';
        for (let i = 0; i < padding; i++) {
            otp = otp.concat('&nbsp');
        }
        return otp;
    }

    _processNode(node, strWrapper, padding = 0) {
        // transform:
        strWrapper.str += '<strong><span style="color:red">';
        strWrapper.str = strWrapper.str.concat(
            this._setPadding(padding + 2) +
            `rel:[${node.trans.posX.toFixed(2)},${node.trans.posY.toFixed(2)}]|abs:[${node.trans.absPosX.toFixed(2)},${node.trans.absPosY.toFixed(2)}]|rot: ${node.trans.rotation.toFixed(2)}|z: ${node.zIndex}` +
            '<br>'
        );
        strWrapper.str += '</span></strong>';

        for (let cmp of node.components) {
            strWrapper.str += '<span style="color:blue">';
            strWrapper.str = strWrapper.str.concat(
                this._setPadding(padding + 2) + cmp.constructor.name + '<br>'
            );
            strWrapper.str += '</span>';
        }

        for (let [id, child] of node.children) {
            strWrapper.str += '<span style="color:green">';
            strWrapper.str = strWrapper.str.concat(
                this._setPadding(padding) + `${child.id}:${child.tag}` + '<br>'
            );
            this._processNode(child, strWrapper, padding + 4);
            strWrapper.str += '</span>';
        }
    }
}

// Rendering component that can render any mesh
class BasicRenderer extends Component {
    draw(ctx) {
        let mesh = this.owner.mesh;

        if (mesh instanceof RectMesh) {
            this._drawRectMesh(ctx, mesh);
        } else if (mesh instanceof ImageMesh) {
            this._drawImageMesh(ctx, mesh);
        } else if (mesh instanceof SpriteMesh) {
            this._drawSpriteMesh(ctx, mesh, this.owner.trans);
        } else if (mesh instanceof MultiSprite) {
            throw new Error(
                'MultiSprite cannot be used directly. Put it into a MultiSpriteCollection instead'
            );
        } else if (mesh instanceof MultiSpriteCollection) {
            this._drawMultiSpriteMesh(ctx, mesh);
        } else {
            throw new Error('Not supported mesh type');
        }
    }

    _drawRectMesh(ctx, mesh) {
        let trans = this.owner.trans;
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        let fillStyle = ctx.fillStyle;
        ctx.fillStyle = mesh.fillStyle;
        ctx.fillRect(
            -originX,
            -originY,
            mesh.width * UNIT_SIZE,
            mesh.height * UNIT_SIZE
        );
        ctx.fillStyle = fillStyle;
        ctx.rotate(-trans.absRotation);
        ctx.translate(-posX, -posY);
    }

    _drawImageMesh(ctx, mesh) {
        let trans = this.owner.trans;
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        ctx.drawImage(
            mesh.image,
            0,
            0,
            mesh.image.width,
            mesh.image.height,
            -originX,
            -originY,
            mesh.image.width,
            mesh.image.height
        );
        ctx.rotate(-trans.absRotation);
        ctx.translate(-posX, -posY);
    }

    _drawSpriteMesh(ctx, mesh, trans) {
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        ctx.drawImage(
            mesh.image,
            mesh.offsetX,
            mesh.offsetY,
            mesh.width * UNIT_SIZE,
            mesh.height * UNIT_SIZE,
            -originX,
            -originY,
            mesh.width * UNIT_SIZE,
            mesh.height * UNIT_SIZE
        );
        ctx.rotate(-trans.absRotation);
        ctx.translate(-posX, -posY);
    }

    _drawMultiSpriteMesh(ctx, mesh) {
        for (let [id, sprite] of mesh.sprites) {
            this.drawSpriteMesh(ctx, sprite, sprite.trans);
        }
    }
}

const INPUT_TOUCH = 1;
const INPUT_DOWN = 1 << 1;
const INPUT_MOVE = 1 << 2;

const MSG_TOUCH = 100;
const MSG_DOWN = 101;
const MSG_MOVE = 102;

// Component that handles touch and mouse events and transforms them into messages
// that can be subscribed by any other component
class InputManager extends Component {
    constructor(mode = INPUT_TOUCH) {
        super();
        this.mode = mode;
    }

    oninit() {
        this.lastTouch = null;

        let canvas = this.scene.canvas;

        // must be done this way, because we want to
        // remove these listeners while finalization
        this.startHandler = evt => {
            this.handleStart(evt);
        };
        this.endHandler = evt => {
            this.handleEnd(evt);
        };

        this.moveHandler = evt => {
            this.handleMove(evt);
        };

        canvas.addEventListener('touchstart', this.startHandler, false);
        canvas.addEventListener('touchend', this.endHandler, false);
        canvas.addEventListener('mousedown', this.startHandler, false);
        canvas.addEventListener('mouseup', this.endHandler, false);

        if ((this.mode |= INPUT_MOVE)) {
            canvas.addEventListener('mousemove', this.moveHandler, false);
            canvas.addEventListener('touchmove', this.moveHandler, false);
        }
    }

    finalize() {
        canvas.removeEventListener('touchstart', this.startHandler);
        canvas.removeEventListener('touchend', this.endHandler);
        canvas.removeEventListener('mousedown', this.startHandler);
        canvas.removeEventListener('mouseup', this.endHandler);

        if ((this.mode |= INPUT_MOVE)) {
            canvas.removeEventListener('mousemove', this.moveHandler);
            canvas.removeEventListener('touchmove', this.moveHandler);
        }
    }

    handleStart(evt) {
        evt.preventDefault();
        let isTouch = typeof evt.changedTouches !== 'undefined';
        if (isTouch && evt.changedTouches.length == 1) {
            // only single-touch
            this.lastTouch = evt.changedTouches[0];
        } else {
            this.lastTouch = evt;
        }

        if ((this.mode |= MSG_DOWN)) {
            this.sendmsg(MSG_DOWN, {
                mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
                isTouch: isTouch,
            });
        }
    }

    handleMove(evt) {
        evt.preventDefault();
        let isTouch = typeof evt.changedTouches !== 'undefined';
        this.sendmsg(MSG_MOVE, {
            mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
            isTouch: isTouch,
        });
    }

    handleEnd(evt) {
        evt.preventDefault();
        var posX, posY;
        let isTouch = typeof evt.changedTouches !== 'undefined';
        if (this.lastTouch != null) {
            if (isTouch && evt.changedTouches.length == 1) {
                posX = evt.changedTouches[0].pageX;
                posY = evt.changedTouches[0].pageY;
            } else {
                // mouse
                posX = evt.pageX;
                posY = evt.pageY;
            }

            // 10px tolerance should be enough
            if (
                Math.abs(this.lastTouch.pageX - posX) < 10 &&
                Math.abs(this.lastTouch.pageY - posY) < 10
            ) {
                // at last send the message to all subscribers about this event
                this.sendmsg(MSG_TOUCH, {
                    mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
                    isTouch: isTouch,
                });
            }
        }
    }

    // Get the mouse position
    getMousePos(canvas, e, isTouch) {
        var rect = canvas.getBoundingClientRect();
        let clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
        let clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
        return {
            posX: Math.round(
                (clientX - rect.left) / (rect.right - rect.left) * canvas.width
            ),
            posY: Math.round(
                (clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
            ),
        };
    }
}

const CMD_BEGIN_REPEAT = 1;
const CMD_EXECUTE = 2;
const CMD_END_REPEAT = 3;
const CMD_BEGIN_WHILE = 4;
const CMD_END_WHILE = 5;
const CMD_BEGIN_INTERVAL = 6;
const CMD_END_INTERVAL = 7;
const CMD_BEGIN_IF = 8;
const CMD_ELSE = 9;
const CMD_END_IF = 10;
const CMD_WAIT_TIME = 11;
const CMD_ADD_COMPONENT = 12;
const CMD_WAIT_FOR_FINISH = 13;
const CMD_WAIT_UNTIL = 14;
const CMD_WAIT_FRAMES = 15;
const CMD_WAIT_FOR_MESSAGE = 16;
const CMD_REMOVE_COMPONENT = 17;
const CMD_REMOVE_GAME_OBJECT_BY_TAG = 18;
const CMD_REMOVE_GAME_OBJECT = 19;

class Stack {
    constructor() {
        this.top = null;
        this.size = 0;
    }

    push(node) {
        node.previous = this.top;
        this.top = node;
        this.size += 1;
    }

    pop() {
        let temp = this.top;
        this.top = this.top.previous;
        this.size -= 1;
        return temp;
    }
}

class ExecutorComponent extends Component {
    constructor() {
        super();
        this.scopeStack = new Stack();
        this.current = null;
        this.head = null;
        this.tail = null;
        this.helpParam = null;
        this.helpParam2 = null;
    }

    _enqueue(key, param1, param2) {
        var node = {
            key,
            param1,
            param2,
            next: null,
        };

        if (this.head == null) {
            this.head = this.tail = node;
        } else {
            this.tail.next = node;
            this.tail = node;
        }

        if (this.current == null) {
            this.current = this.head;
        }
    }

    _dequeue() {
        if (this.current == null || this.current.next == null) {
            return null;
        } else {
            this.current = this.current.next;
        }
        return this.current;
    }

    onmessage(msg) {
        this.helpParam2 = msg.action;
    }

    _gotoNext() {
        this.current = this.current.next;
    }

    _gotoNextImmediately(delta, absolute) {
        this._gotoNext();
        this.update(delta, absolute);
    }

    update(delta, absolute) {
        if (this.current == null) {
            this.current = this._dequeue();
        }

        if (this.current == null) {
            this.finish();
            return;
        }

        switch (this.current.key) {
            case CMD_BEGIN_REPEAT:
                console.log('CMD_BEGIN_REPEAT');
                this.scopeStack.push(this.current);
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_END_REPEAT:
                console.log('CMD_END_REPEAT');
                let temp = this.scopeStack.pop();

                if (--temp.param1 > 0) {
                    this.current = temp;
                    this.update(delta, absolute);
                } else {
                    this._gotoNextImmediately();
                }

                break;
            case CMD_EXECUTE:
                console.log('CMD_EXECUTE');
                this.current.param1(this);
                this._gotoNextImmediately();
                break;
            case CMD_BEGIN_WHILE:
                console.log('CMD_BEGIN_WHILE');
                this.scopeStack.push(this.current);
                this._gotoNextImmediately();
                break;
            case CMD_END_WHILE:
                console.log('CMD_END_WHILE');
                let temp2 = this.scopeStack.pop();

                if (temp2.param1()) {
                    this.current = temp2;
                    this.update(delta, absolute);
                } else {
                    this._gotoNextImmediately();
                }

                break;
            case CMD_BEGIN_INTERVAL:
                console.log('CMD_BEGIN_INTERVAL');
                if (this.helpParam == null) {
                    this.helpParam = absolute;
                } else if (absolute - this.helpParam >= this.current.param1) {
                    this.helpParam = null;
                    this.scopeStack.push(this.current);
                    this._gotoNextImmediately();
                }
                break;
            case CMD_END_INTERVAL:
                console.log('CMD_END_INTERVAL');
                this.current = this.scopeStack.pop();
                this.update(delta, absolute);
                break;
            case CMD_BEGIN_IF:
                console.log('CMD_BEGIN_IF');
                if (this.current.param1()) {
                    this._gotoNextImmediately();
                    break;
                }


                let deepCounter = 0;

                while (true) {
                    this.current = this._dequeue();

                    if (this.current.key == CMD_BEGIN_IF) {
                        deepCounter++;
                    }

                    if (this.current.key == CMD_ELSE || this.current.key == CMD_END_IF) {
                        this._gotoNext();
                        break;
                    }
                }
                this.update(delta, absolute);
                break;
            case CMD_ELSE:
                console.log('CMD_ELSE');
                while (true) {
                    this.current = this._dequeue();
                    if (this.current.key == CMD_END_IF) {
                        this._gotoNext();
                        break;
                    }
                }
                this.update(delta, absolute);
                break;
            case CMD_END_IF:
                console.log('CMD_END_IF');
                this._gotoNextImmediately();
                break;
            case CMD_WAIT_TIME:
                console.log('CMD_WAIT_TIME');
                if (this.helpParam == null) {
                    this.helpParam = absolute;
                } else if (absolute - this.helpParam >= this.current.param1) {
                    this.helpParam = null;
                    this._gotoNextImmediately();
                }
                break;
            case CMD_ADD_COMPONENT:
                console.log('CMD_ADD_COMPONENT');
                this.current.param1.addComponent(this.current.param2);
                this._gotoNextImmediately();
                break;
            case CMD_WAIT_FOR_FINISH:
                console.log('CMD_WAIT_FOR_FINISH');
                if (this.current.param1.isFinished) {
                    this._gotoNext();
                }
                break;
            case CMD_WAIT_UNTIL:
                console.log('CMD_WAIT_UNTIL');
                if (this.current.param1()) {
                    this._gotoNext();
                }
                break;
            case CMD_WAIT_FRAMES:
                console.log('CMD_WAIT_FRAMES');
                if (this.helpParam == null) {
                    this.helpParam = 0;
                } else if (++this.helpParam >= this.current.param1) {
                    this.helpParam = null;
                    this._gotoNext();
                }
                break;
            case CMD_WAIT_FOR_MESSAGE:
                console.log('CMD_WAIT_FOR_MESSAGE');
                if (this.helpParam == true) {
                    if (this.helpParam2 == this.current.param1) {
                        this.unsubscribe(this.current.param1);
                        this.helpParam = this.helpParam2 = null;
                        this._gotoNextImmediately();
                    }
                } else {
                    this.helpParam = true;
                    this.helpParam2 = null;
                    this.subscribe(this.current.param1);
                }
                break;
            case CMD_REMOVE_COMPONENT:
                console.log('CMD_REMOVE_COMPONENT');
                this.current.param1.removeComponentByName(this.current.param2);
                this._gotoNextImmediately();
                break;
            case CMD_REMOVE_GAME_OBJECT_BY_TAG:
                console.log('CMD_REMOVE_GAME_OBJECT_BY_TAG');
                let obj = this.scene.findFirstGameObjectByTag(this.current.param1);
                if (obj != null) {
                    obj.remove();
                }
                this._gotoNextImmediately();
                break;
            case CMD_REMOVE_GAME_OBJECT:
                console.log('CMD_REMOVE_GAME_OBJECT');
                this.current.param1.remove();
                this._gotoNextImmediately();
                break;
        }
    }

    beginRepeat(num) {
        console.log('beginRepeat');
        this._enqueue(CMD_BEGIN_REPEAT, num);
        return this;
    }

    execute(func) {
        console.log('execute');
        this._enqueue(CMD_EXECUTE, func);
        return this;
    }

    endRepeat() {
        console.log('endRepeat');
        this._enqueue(CMD_END_REPEAT);
        return this;
    }

    beginWhile(func) {
        console.log('beginWhile');
        this._enqueue(CMD_BEGIN_WHILE, func);
        return this;
    }

    endWhile() {
        console.log('endWhile');
        this._enqueue(CMD_END_WHILE);
        return this;
    }

    beginInterval(num) {
        console.log('beginInterval');
        this._enqueue(CMD_BEGIN_INTERVAL, num);
        return this;
    }

    endInterval() {
        console.log('endInterval');
        this._enqueue(CMD_END_INTERVAL);
        return this;
    }

    beginIf(func) {
        console.log('beginIf');
        this._enqueue(CMD_BEGIN_IF, func);
        return this;
    }

    else() {
        console.log('else');
        this._enqueue(CMD_ELSE);
        return this;
    }

    endIf() {
        console.log('endIf');
        this._enqueue(CMD_END_IF);
        return this;
    }

    waitTime(time) {
        console.log('waitTime');
        this._enqueue(CMD_WAIT_TIME, time);
        return this;
    }

    addComponent(gameObj, component) {
        console.log('addComponent');
        this._enqueue(CMD_ADD_COMPONENT, gameObj, component);
        return this;
    }

    waitForFinish(component) {
        console.log('waitForFinish');
        this._enqueue(CMD_WAIT_FOR_FINISH, component);
        return this;
    }

    waitUntil(func) {
        console.log('waitUntil');
        this._enqueue(CMD_WAIT_UNTIL, func);
        return this;
    }

    waitFrames(num) {
        console.log('waitFrames');
        this._enqueue(CMD_WAIT_FRAMES, num);
        return this;
    }

    waitForMessage(msg) {
        console.log('waitForMessage');
        this._enqueue(CMD_WAIT_FOR_MESSAGE, msg);
        return this;
    }

    removeComponent(gameObj, cmp) {
        console.log('removeComponent');
        this._enqueue(CMD_REMOVE_COMPONENT, gameObj, cmp);
        return this;
    }

    removeGameObjectByTag(tag) {
        console.log('removeGameObjectByTag');
        this._enqueue(CMD_REMOVE_GAME_OBJECT_BY_TAG, tag);
        return this;
    }

    removeGameObject(obj) {
        console.log('removeGameObject');
        this._enqueue(CMD_REMOVE_GAME_OBJECT, obj);
        return this;
    }
}
